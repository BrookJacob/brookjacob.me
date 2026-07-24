/**
 * Firebase Cloud Functions for Hygraph Webhook Relay & Image BlurHash Generation
 * 
 * Provides HTTP endpoints with robust logging and Cloud Secret Manager integration:
 * 1. `hygraphDeployWebhook`: Relays Hygraph publish events to GitHub Actions workflow dispatch.
 * 2. `hygraphBlurhashWebhook`: Downloads print image assets, computes BlurHash strings,
 *    prevents infinite recursion loops, and updates Hygraph Asset records.
 */

const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const sharp = require('sharp');
const { encode } = require('blurhash');

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

    // Payload Case 1: Webhook triggered on 'Asset' model directly
    if (data.url && data.id) {
      assetId = data.id;
      imageUrl = data.url;
      existingBlurhash = data.blurhash;
    } 
    // Payload Case 2: Webhook triggered on 'Print' model with nested 'mainImage'
    else if (data.mainImage) {
      if (typeof data.mainImage === 'object') {
        assetId = data.mainImage.id;
        imageUrl = data.mainImage.url;
        existingBlurhash = data.mainImage.blurhash;
      } else if (typeof data.mainImage === 'string') {
        assetId = data.mainImage;
      }
    }

    // Payload Case 3: If asset ID exists but image URL or existing blurhash needs resolution from Hygraph API
    if (assetId && (!imageUrl || existingBlurhash === undefined)) {
      logger.info('Resolving Asset details directly from Hygraph API for Asset ID:', assetId);
      const fetchedAsset = await fetchHygraphAssetDetails(assetId, hygraphToken);
      if (fetchedAsset) {
        imageUrl = imageUrl || fetchedAsset.url;
        existingBlurhash = fetchedAsset.blurhash;
      }
    }

    if (!assetId || !imageUrl) {
      logger.warn('WARNING: Unhandled payload structure or missing image URL.', {
        hasData: !!payload.data,
        assetId,
        imageUrl,
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
