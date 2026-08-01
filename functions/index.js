/**
 * Firebase Cloud Functions for Hygraph Webhook Relay & Image BlurHash Generation
 * 
 * Provides HTTP endpoints with robust logging and Cloud Secret Manager integration:
 * 1. `hygraphDeployWebhook`: Relays Hygraph publish events to GitHub Actions workflow dispatch.
 * 2. `hygraphBlurhashWebhook`: Downloads print image assets, computes BlurHash strings,
 *    prevents infinite recursion loops, and updates Hygraph Asset records.
 */

const { onRequest, onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const sharp = require('sharp');
const { encode } = require('blurhash');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// Define Cloud Secret Manager secret references
const githubPatSecret = defineSecret('GITHUB_PAT');
const hygraphTokenSecret = defineSecret('HYGRAPH_PAT_TOKEN');

const GITHUB_REPO = process.env.GITHUB_REPO || 'BrookJacob/brookjacob.me';
const HYGRAPH_ENDPOINT = process.env.HYGRAPH_ENDPOINT || 'https://us-west-2.cdn.hygraph.com/content/cmleb20kj014707w90z5k39wb/master';

/**
 * Hygraph Deploy Webhook Relay Function
 */
exports.hygraphDeployWebhook = onRequest({ secrets: [githubPatSecret] }, async (req, res) => {
  if (req.method !== 'POST') {
    logger.warn('Deploy Webhook received non-POST request:', req.method);
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const payload = req.body || {};
    logger.info('--- HYGRAPH DEPLOY WEBHOOK TRIGGERED ---');
    logger.info('Operation:', payload.operation, 'Stage:', payload.stage, 'Entity ID:', payload.data?.id);

    const githubPat = (githubPatSecret.value() || process.env.GITHUB_PAT || '').trim();
    const githubRepo = (process.env.GITHUB_REPO || GITHUB_REPO).trim();

    if (!githubPat) {
      logger.error('CRITICAL: Missing GITHUB_PAT environment secret.');
      res.status(500).json({ error: 'Missing GITHUB_PAT configuration secret' });
      return;
    }

    logger.info(`Authenticating with PAT (Prefix: ${githubPat.substring(0, 8)}..., Length: ${githubPat.length}, Repo: ${githubRepo})`);

    // Repository Dispatch Endpoint (matches deploy.yml repository_dispatch trigger)
    const githubRepoDispatchUrl = `https://api.github.com/repos/${githubRepo}/dispatches`;
    const githubWorkflowDispatchUrl = `https://api.github.com/repos/${githubRepo}/actions/workflows/deploy.yml/dispatches`;

    logger.info('Dispatching repository_dispatch event to GitHub API:', githubRepoDispatchUrl);

    // Primary Dispatch: Repository Dispatch with event_type hygraph_publish
    let response = await fetch(githubRepoDispatchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${githubPat}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'Firebase-Hygraph-Relay',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: 'hygraph_publish',
        client_payload: { ref: 'main' },
      }),
    });

    // Fallback 1: Try repository_dispatch with token scheme if Bearer returns 401
    if (response.status === 401) {
      logger.warn('Bearer auth returned 401 on repository_dispatch, trying token scheme...');
      response = await fetch(githubRepoDispatchUrl, {
        method: 'POST',
        headers: {
          'Authorization': `token ${githubPat}`,
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'Firebase-Hygraph-Relay',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: 'hygraph_publish',
          client_payload: { ref: 'main' },
        }),
      });
    }

    // Fallback 2: Try workflow_dispatch endpoint if repository_dispatch fails
    if (!response.ok && response.status !== 204) {
      logger.warn('Repository dispatch returned status', response.status, 'Attempting workflow_dispatch fallback...');
      response = await fetch(githubWorkflowDispatchUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubPat}`,
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'Firebase-Hygraph-Relay',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ref: 'main' }),
      });
    }

    if (response.ok || response.status === 204) {
      logger.info('SUCCESS: Triggered GitHub Actions deploy.yml workflow.');
      res.status(200).json({ success: true, message: 'GitHub deployment triggered successfully' });
    } else {
      const errorText = await response.text();
      logger.error('ERROR from GitHub API:', {
        status: response.status,
        statusText: response.statusText,
        acceptedScopes: response.headers.get('x-accepted-oauth-scopes'),
        oauthScopes: response.headers.get('x-oauth-scopes'),
        requestId: response.headers.get('x-github-request-id'),
        errorBody: errorText,
      });
      res.status(response.status).json({ error: 'GitHub API error', status: response.status, details: errorText });
    }
  } catch (error) {
    logger.error('Unhandled Exception in hygraphDeployWebhook:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Fetches asset details (url, blurhash) directly from Hygraph if not present in webhook payload.
 * 
 * @param {string} assetId - Asset ID in Hygraph.
 * @param {string} [token] - Hygraph PAT Auth Token.
 * @returns {Promise<{ url: string, blurhash: string | null } | null>}
 */
async function fetchHygraphAssetDetails(assetId, token) {
  const query = `
    query GetAsset($id: ID!) {
      asset(where: { id: $id }) {
        id
        url
        blurhash
      }
    }
  `;

  try {
    const headers = { 'Content-Type': 'application/json' };
    const authToken = token || process.env.HYGRAPH_PAT_TOKEN || '';
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const res = await fetch(HYGRAPH_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables: { id: assetId } }),
    });

    const json = await res.json();
    if (json.data?.asset) {
      return json.data.asset;
    }
    logger.warn('Could not find Asset in Hygraph for ID:', assetId, json);
  } catch (err) {
    logger.error('Error fetching Asset details from Hygraph:', err);
  }
  return null;
}

/**
 * Encodes image buffer into a compact BlurHash string using Sharp.
 * 
 * @param {Buffer} buffer - Image file buffer.
 * @returns {Promise<string>} BlurHash string.
 */
async function generateBlurhash(buffer) {
  const { data, info } = await sharp(buffer)
    .raw()
    .ensureAlpha()
    .resize(32, 32, { fit: 'inside' })
    .toBuffer({ resolveWithObject: true });

  return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 4);
}

/**
 * Updates Hygraph Asset with computed BlurHash string via GraphQL Mutation API.
 * 
 * @param {string} assetId - Hygraph Asset ID.
 * @param {string} blurhash - Generated BlurHash string.
 * @param {string} [token] - Hygraph PAT Auth Token.
 */
async function updateHygraphAssetBlurhash(assetId, blurhash, token) {
  const mutation = `
    mutation UpdateAssetBlurhash($id: ID!, $blurhash: String!) {
      updateAsset(where: { id: $id }, data: { blurhash: $blurhash }) {
        id
        blurhash
      }
      publishAsset(where: { id: $id }, to: PUBLISHED) {
        id
      }
    }
  `;

  const headers = { 'Content-Type': 'application/json' };
  const authToken = token || process.env.HYGRAPH_PAT_TOKEN || '';
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(HYGRAPH_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: mutation, variables: { id: assetId, blurhash } }),
  });

  const json = await res.json();
  if (json.errors) {
    logger.error('Hygraph updateAsset GraphQL mutation errors:', JSON.stringify(json.errors, null, 2));
  } else {
    logger.info('SUCCESS: Saved and published BlurHash to Hygraph Asset:', assetId, blurhash);
  }
}

/**
 * Hygraph BlurHash Generator Webhook Function with Secret Manager Integration & Recursion Guard
 */
exports.hygraphBlurhashWebhook = onRequest({ secrets: [hygraphTokenSecret] }, async (req, res) => {
  if (req.method !== 'POST') {
    logger.warn('Blurhash Webhook received non-POST request:', req.method);
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const payload = req.body || {};
    const hygraphToken = hygraphTokenSecret.value() || process.env.HYGRAPH_PAT_TOKEN || '';

    logger.info('--- HYGRAPH BLURHASH WEBHOOK TRIGGERED ---');
    logger.info('Payload Summary:', {
      operation: payload.operation,
      stage: payload.stage,
      model: payload.data?.__typename || 'Unknown',
      entityId: payload.data?.id,
    });

    const data = payload.data || {};
    let assetId = null;
    let imageUrl = null;
    let existingBlurhash = null;

    // 1. Direct ID extraction if payload represents an Asset model directly
    if (data.id) {
      if (data.url || data.__typename === 'Asset' || payload.model === 'Asset') {
        assetId = data.id;
        imageUrl = data.url || null;
        existingBlurhash = data.blurhash;
      }
    }

    // 2. Check nested mainImage / coverImage / image relation fields (Print or Article models)
    const imgField = data.mainImage || data.coverImage || data.image;
    if (imgField) {
      if (typeof imgField === 'object' && !Array.isArray(imgField)) {
        assetId = assetId || imgField.id;
        imageUrl = imageUrl || imgField.url;
        if (existingBlurhash === undefined) existingBlurhash = imgField.blurhash;
      } else if (typeof imgField === 'string') {
        assetId = assetId || imgField;
      }
    }

    // 3. Fallback: If payload.data.id exists and assetId isn't resolved yet, set candidate assetId = data.id
    if (!assetId && data.id) {
      assetId = data.id;
    }

    // 4. Resolve missing image URL or BlurHash state directly from Hygraph GraphQL API
    if (assetId && (!imageUrl || existingBlurhash === undefined)) {
      logger.info('Resolving Asset details directly from Hygraph API for Asset ID:', assetId);
      const fetchedAsset = await fetchHygraphAssetDetails(assetId, hygraphToken);
      if (fetchedAsset) {
        imageUrl = imageUrl || fetchedAsset.url;
        existingBlurhash = fetchedAsset.blurhash;
      }
    }

    if (!assetId || !imageUrl) {
      logger.info('SKIPPED: Payload structure contains no valid image asset URL.', {
        hasData: !!payload.data,
        assetId,
        imageUrl,
        model: payload.model || data.__typename || 'Unknown',
        rawKeys: Object.keys(data),
      });
      res.status(200).json({ 
        skipped: true, 
        reason: 'No valid image URL or Asset ID found in payload structure',
        receivedKeys: Object.keys(data),
      });
      return;
    }

    // RECURSION GUARD: Skip if asset already has a valid BlurHash string
    if (existingBlurhash && existingBlurhash.length > 5) {
      logger.info('SKIPPING: Asset already contains BlurHash. Loop prevention active.', assetId, existingBlurhash);
      res.status(200).json({
        skipped: true,
        reason: 'Blurhash already exists on asset',
        assetId,
        blurhash: existingBlurhash,
      });
      return;
    }

    logger.info('Processing image download for BlurHash generation:', { assetId, imageUrl });

    // Download image stream
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      logger.error('ERROR downloading image from CDN:', imageRes.status, imageUrl);
      throw new Error(`Failed to download image: HTTP ${imageRes.status}`);
    }

    const arrayBuffer = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Compute BlurHash
    logger.info('Computing BlurHash string via Sharp...');
    const blurhashString = await generateBlurhash(buffer);
    logger.info('BlurHash computed successfully:', blurhashString);

    // Save back to Hygraph CMS
    await updateHygraphAssetBlurhash(assetId, blurhashString, hygraphToken);

    res.status(200).json({
      success: true,
      assetId,
      blurhash: blurhashString,
    });
  } catch (error) {
    logger.error('Unhandled Exception in hygraphBlurhashWebhook:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Allowed origin rules for CORS protection matching brookjacob.studio and its subdomains.
 */
const ALLOWED_ORIGINS = [
  'https://brookjacob.studio',
  'https://brookjacob.me',
  /https:\/\/.*\.brookjacob\.studio$/,
  /https:\/\/.*\.brookjacob\.me$/,
  /http:\/\/localhost:\d+$/,
];

/**
 * 1. submitContactForm Cloud Function
 * 
 * Callable function for multi-subdomain contact message submissions.
 * Validates, sanitizes payload, enforces App Check security, and writes to `contact_messages`.
 */
exports.submitContactForm = onCall({ cors: ALLOWED_ORIGINS }, async (request) => {
  // 1. Security Check: Enforce App Check verification
  if (!request.app) {
    logger.warn('submitContactForm rejected: Missing App Check context');
    throw new HttpsError('failed-precondition', 'App Check verification required.');
  }

  const { senderName, senderEmail, message, sourceSubdomain } = request.data || {};

  // 2. Input Validation & Sanitization
  if (!senderName || typeof senderName !== 'string' || senderName.trim().length === 0) {
    throw new HttpsError('invalid-argument', 'Sender name is required.');
  }
  if (!senderEmail || typeof senderEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail.trim())) {
    throw new HttpsError('invalid-argument', 'A valid email address is required.');
  }
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new HttpsError('invalid-argument', 'Message content is required.');
  }

  const cleanName = senderName.trim().slice(0, 150);
  const cleanEmail = senderEmail.trim().toLowerCase().slice(0, 254);
  const cleanMessage = message.trim().slice(0, 5000);
  const cleanSubdomain = (sourceSubdomain && typeof sourceSubdomain === 'string')
    ? sourceSubdomain.trim().toLowerCase().slice(0, 50)
    : 'main';

  try {
    // 3. Write to Firestore contact_messages collection
    const docRef = await db.collection('contact_messages').add({
      sourceSubdomain: cleanSubdomain,
      senderName: cleanName,
      senderEmail: cleanEmail,
      message: cleanMessage,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'unread',
    });

    logger.info(`Contact message created successfully: ${docRef.id} from ${cleanSubdomain} (${cleanEmail})`);

    return {
      success: true,
      messageId: docRef.id,
    };
  } catch (error) {
    logger.error('Error in submitContactForm Cloud Function:', error);
    throw new HttpsError('internal', 'Unable to submit contact message. Please try again later.');
  }
});

/**
 * 2. castVote Cloud Function
 * 
 * Callable function for anonymous print voting & demand-gauge system.
 * Enforces App Check and Anonymous Auth, checks for duplicate votes via transaction,
 * and atomically increments vote count for 'want_print' votes.
 */
exports.castVote = onCall({ cors: ALLOWED_ORIGINS }, async (request) => {
  // 1. Security Check: Enforce App Check
  if (!request.app) {
    logger.warn('castVote rejected: Missing App Check context');
    throw new HttpsError('failed-precondition', 'App Check verification required.');
  }

  // 2. Security Check: Enforce Auth (Anonymous Auth UID required)
  if (!request.auth || !request.auth.uid) {
    logger.warn('castVote rejected: Unauthenticated call');
    throw new HttpsError('unauthenticated', 'User must be authenticated anonymously to vote.');
  }

  const uid = request.auth.uid;
  const { hygraphId, voteType, votingGroup } = request.data || {};

  // 3. Payload Validation
  if (!hygraphId || typeof hygraphId !== 'string' || hygraphId.trim().length === 0) {
    throw new HttpsError('invalid-argument', 'Target hygraphId is required.');
  }

  if (voteType !== 'want_print' && voteType !== 'pass') {
    throw new HttpsError('invalid-argument', "voteType must be 'want_print' or 'pass'.");
  }

  const cleanHygraphId = hygraphId.trim();

  try {
    // 4. Run Firestore Transaction
    await db.runTransaction(async (transaction) => {
      const voteRef = db.collection('potential_prints').doc(cleanHygraphId).collection('votes').doc(uid);
      const voteDoc = await transaction.get(voteRef);

      // Check if user has already voted
      if (voteDoc.exists) {
        logger.warn(`Duplicate vote attempt by UID ${uid} on print ${cleanHygraphId}`);
        throw new HttpsError('already-exists', 'You have already submitted a vote for this artwork.');
      }

      const printRef = db.collection('potential_prints').doc(cleanHygraphId);
      const printDoc = await transaction.get(printRef);

      // Initialize parent potential_prints document if not created yet
      if (!printDoc.exists) {
        transaction.set(printRef, {
          voteCount: voteType === 'want_print' ? 1 : 0,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          votingGroup: votingGroup && typeof votingGroup === 'string' ? votingGroup.trim() : null,
        });
      } else if (voteType === 'want_print') {
        transaction.update(printRef, {
          voteCount: admin.firestore.FieldValue.increment(1),
        });
      }

      // Record individual vote in subcollection
      transaction.set(voteRef, {
        voteType,
        votedAt: admin.firestore.FieldValue.serverTimestamp(),
        votingGroup: votingGroup && typeof votingGroup === 'string' ? votingGroup.trim() : null,
      });
    });

    logger.info(`Vote cast successfully: UID ${uid} voted '${voteType}' on ${cleanHygraphId}`);

    return {
      success: true,
      hygraphId: cleanHygraphId,
      voteType,
    };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    logger.error('Error in castVote Cloud Function transaction:', error);
    throw new HttpsError('internal', 'Unable to cast vote. Please try again later.');
  }
});

