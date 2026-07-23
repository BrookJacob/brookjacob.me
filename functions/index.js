/**
 * Firebase Cloud Functions for Hygraph Webhook Relay & Image Blurhash Generation
 * 
 * Provides HTTP endpoints for:
 * 1. `hygraphDeployWebhook`: Translates Hygraph publish events into GitHub Actions workflow dispatches.
 * 2. `hygraphBlurhashWebhook`: Downloads print image assets, computes Blurhash string using Sharp & Blurhash,
 *    and updates the Asset record in Hygraph CMS via Mutation API.
 */

const { onRequest } = require('firebase-functions/v2/https');
const logger = require('firebase-functions/logger');
const sharp = require('sharp');
const { encode } = require('blurhash');

/**
 * Reads secrets and configuration environment variables.
 */
const GITHUB_PAT = process.env.GITHUB_PAT || '';
const GITHUB_REPO = process.env.GITHUB_REPO || 'brookjacob/brookjacob.me';
const HYGRAPH_ENDPOINT = process.env.HYGRAPH_ENDPOINT || 'https://us-west-2.cdn.hygraph.com/content/cmleb20kj014707w90z5k39wb/master';
const HYGRAPH_PAT_TOKEN = process.env.HYGRAPH_PAT_TOKEN || '';

/**
 * Hygraph Deploy Webhook Relay Function
 * 
 * Receives publish events from Hygraph and dispatches GitHub Actions workflow (`deploy.yml`).
 * 
 * @param {import('express').Request} req - Express HTTP request object.
 * @param {import('express').Response} res - Express HTTP response object.
 */
exports.hygraphDeployWebhook = onRequest(async (req, res) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const payload = req.body || {};
    logger.info('Received Hygraph Publish Webhook event:', payload.operation, payload.data?.id);

    const githubPat = process.env.GITHUB_PAT || GITHUB_PAT;
    const githubRepo = process.env.GITHUB_REPO || GITHUB_REPO;

    if (!githubPat) {
      logger.error('Missing GITHUB_PAT environment secret');
      res.status(500).json({ error: 'Missing GITHUB_PAT configuration' });
      return;
    }

    // Forward request to GitHub Actions workflow dispatch API endpoint
    const githubUrl = `https://api.github.com/repos/${githubRepo}/actions/workflows/deploy.yml/dispatches`;
    const response = await fetch(githubUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${githubPat}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'Firebase-Hygraph-Relay',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref: 'main' }),
    });

    if (response.ok || response.status === 204) {
      logger.info('Successfully triggered GitHub Actions workflow deploy.yml');
      res.status(200).json({ success: true, message: 'GitHub deployment triggered successfully' });
    } else {
      const errorText = await response.text();
      logger.error('Failed to trigger GitHub Actions:', response.status, errorText);
      res.status(response.status).json({ error: 'GitHub API error', details: errorText });
    }
  } catch (error) {
    logger.error('Error in hygraphDeployWebhook:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Encodes image buffer into a compact Blurhash string.
 * 
 * @param {Buffer} buffer - Image file raw binary buffer.
 * @returns {Promise<string>} Blurhash string representation.
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
 * Updates Hygraph Asset with computed Blurhash string via GraphQL Mutation API.
 * 
 * @param {string} assetId - Hygraph Asset document ID.
 * @param {string} blurhash - Generated Blurhash string.
 */
async function updateHygraphAssetBlurhash(assetId, blurhash) {
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
  if (HYGRAPH_PAT_TOKEN) {
    headers['Authorization'] = `Bearer ${HYGRAPH_PAT_TOKEN}`;
  }

  const res = await fetch(HYGRAPH_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: mutation,
      variables: { id: assetId, blurhash },
    }),
  });

  const json = await res.json();
  if (json.errors) {
    logger.error('Hygraph updateAsset mutation error:', json.errors);
  } else {
    logger.info('Hygraph Asset updated with Blurhash successfully:', assetId, blurhash);
  }
}

/**
 * Hygraph Blurhash Generator Webhook Function
 * 
 * Triggered on Hygraph Asset or Print image updates. Downloads raw image,
 * computes Blurhash string, and saves back to Hygraph CMS.
 * 
 * @param {import('express').Request} req - Express HTTP request.
 * @param {import('express').Response} res - Express HTTP response.
 */
exports.hygraphBlurhashWebhook = onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const payload = req.body || {};
    const asset = payload.data?.mainImage || payload.data;
    const imageUrl = asset?.url;
    const assetId = asset?.id;

    if (!imageUrl || !assetId) {
      res.status(400).json({ error: 'No valid image URL or Asset ID found in webhook payload' });
      return;
    }

    logger.info('Processing image for Blurhash generation:', assetId, imageUrl);

    // Download image binary stream
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      throw new Error(`Failed to download image from ${imageUrl}`);
    }
    const arrayBuffer = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Compute compact Blurhash string using Sharp
    const blurhashString = await generateBlurhash(buffer);
    logger.info('Generated Blurhash:', blurhashString);

    // Update Hygraph Asset record
    await updateHygraphAssetBlurhash(assetId, blurhashString);

    res.status(200).json({
      success: true,
      assetId,
      blurhash: blurhashString,
    });
  } catch (error) {
    logger.error('Error generating Blurhash:', error);
    res.status(500).json({ error: error.message });
  }
});
