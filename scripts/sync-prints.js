/**
 * @file scripts/sync-prints.js
 * @description Build-step synchronization script linking Hygraph CMS potential print artwork entries with Firebase Firestore.
 * 
 * Flow:
 * 1. Fetches published `PotentialPrint` (or `Print`) entries from Hygraph GraphQL API where `isActive == true`.
 * 2. Initializes Firebase Admin SDK using Application Default Credentials (ADC) or environment configuration.
 * 3. Iterates through each active potential print entry.
 * 4. Checks if the document `potential_prints/{hygraphId}` exists in Firestore.
 * 5. If missing, creates the document initialized with `{ voteCount: 0, createdAt: FieldValue.serverTimestamp() }`.
 * 6. If existing, skips creation to preserve active aggregate vote counts.
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { GraphQLClient, gql } from 'graphql-request';
import fs from 'fs';
import path from 'path';

/**
 * Hygraph GraphQL endpoint URI read from environment variables with fallback endpoint.
 * @type {string}
 */
const HYGRAPH_ENDPOINT = process.env.HYGRAPH_ENDPOINT || 'https://us-west-2.cdn.hygraph.com/content/cmleb20kj014707w90z5k39wb/master';

/**
 * Initializes Firebase Admin SDK application instance safely.
 * 
 * Supports credentials loaded via GOOGLE_APPLICATION_CREDENTIALS, explicit service account key path,
 * or default project environment configuration.
 */
function initFirebaseAdmin() {
  if (getApps().length === 0) {
    let serviceAccount = null;

    // 1. Check direct JSON secret from env (e.g. GitHub Actions FIREBASE_SERVICE_ACCOUNT)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      } catch (e) {
        console.warn('⚠️ [sync-prints] Failed parsing FIREBASE_SERVICE_ACCOUNT JSON:', e.message);
      }
    }

    // 2. Check file path credential (e.g. GOOGLE_APPLICATION_CREDENTIALS)
    if (!serviceAccount && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const credPath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      if (fs.existsSync(credPath)) {
        try {
          serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf8'));
        } catch (e) {
          console.warn('⚠️ [sync-prints] Failed reading credentials file:', e.message);
        }
      }
    }

    const projectId = process.env.PUBLIC_FIREBASE_PROJECT_ID || serviceAccount?.project_id || 'brookjacob-6aa1b';

    if (serviceAccount) {
      initializeApp({
        credential: cert(serviceAccount),
        projectId,
      });
    } else {
      console.warn('⚠️ [sync-prints] No service account credentials detected (FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS).');
      return null;
    }
  }
  return getFirestore();
}

/**
 * GraphQL Query fetching active PotentialPrint entries from Hygraph, including inProduction status.
 */
const GET_POTENTIAL_PRINTS_WITH_PROD = gql`
  query GetPotentialPrintsWithProd {
    potentialPrints(first: 100, where: { OR: [{ isActive: true }, { inProduction: true }] }) {
      id
      title
      isActive
      inProduction
      votingGroup
    }
  }
`;

/**
 * Basic query without inProduction field if not yet defined in Hygraph schema.
 */
const GET_POTENTIAL_PRINTS_BASIC = gql`
  query GetPotentialPrintsBasic {
    potentialPrints(first: 100) {
      id
      title
      isActive
      votingGroup
    }
  }
`;

/**
 * Fallback GraphQL Query fetching Print entries if PotentialPrint model is not yet configured in CMS schema.
 */
const GET_FALLBACK_PRINTS = gql`
  query GetFallbackPrints {
    prints(first: 100, where: { display: true }) {
      id
      title
      display
    }
  }
`;

/**
 * Main execution function for the build-step Hygraph -> Firestore sync.
 * 
 * @async
 * @returns {Promise<void>}
 */
async function syncPrintsToFirestore() {
  console.log('🔄 [sync-prints] Initiating Hygraph -> Firestore potential prints synchronization...');

  const db = initFirebaseAdmin();
  const hygraphClient = new GraphQLClient(HYGRAPH_ENDPOINT);

  try {
    let potentialPrints = [];

    // 1. Query PotentialPrint entries from Hygraph (trying with inProduction first)
    try {
      const data = await hygraphClient.request(GET_POTENTIAL_PRINTS_WITH_PROD);
      potentialPrints = (data?.potentialPrints || []).map(p => ({
        id: p.id,
        title: p.title,
        isActive: p.isActive,
        inProduction: p.inProduction || false,
        votingGroup: p.votingGroup || null,
      }));
    } catch (prodErr) {
      // Fallback to basic query without inProduction
      try {
        const basicData = await hygraphClient.request(GET_POTENTIAL_PRINTS_BASIC);
        potentialPrints = (basicData?.potentialPrints || []).map(p => ({
          id: p.id,
          title: p.title,
          isActive: p.isActive,
          inProduction: false,
          votingGroup: p.votingGroup || null,
        }));
      } catch (primaryErr) {
        console.warn('⚠️ [sync-prints] Query for `potentialPrints` failed. Attempting fallback to `prints` query...');
        try {
          const fallbackData = await hygraphClient.request(GET_FALLBACK_PRINTS);
          potentialPrints = (fallbackData?.prints || []).map(p => ({
            id: p.id,
            title: p.title,
            isActive: p.display !== false,
            inProduction: false,
            votingGroup: null,
          }));
        } catch (fallbackErr) {
          console.error('❌ [sync-prints] Fallback query for `prints` also failed:', fallbackErr);
          throw primaryErr;
        }
      }
    }

    console.log(`📊 [sync-prints] Found ${potentialPrints.length} active print entries in Hygraph.`);

    if (!db) {
      console.log('⏩ [sync-prints] Skipping Firestore sync because no Firebase service account credentials were provided.');
      return;
    }

    let createdCount = 0;
    let skippedCount = 0;

    // 2. Sync each entry into Firestore potential_prints collection
    for (const print of potentialPrints) {
      const hygraphId = print.id;
      const docRef = db.collection('potential_prints').doc(hygraphId);
      const snapshot = await docRef.get();

      if (!snapshot.exists) {
        // Document does not exist in Firestore; create initial vote record container
        await docRef.set({
          voteCount: 0,
          createdAt: FieldValue.serverTimestamp(),
          votingGroup: print.votingGroup,
        });
        createdCount++;
        console.log(`  ➕ Initialized potential_prints/${hygraphId} ("${print.title}") with voteCount: 0`);
      } else {
        skippedCount++;
        console.log(`  ⏩ Document potential_prints/${hygraphId} already exists (voteCount: ${snapshot.data()?.voteCount ?? 0}). Skipped.`);
      }
    }

    console.log(`✅ [sync-prints] Sync complete! Created: ${createdCount}, Preserved/Skipped: ${skippedCount}`);
  } catch (error) {
    console.error('❌ [sync-prints] Error during Hygraph to Firestore sync:', error?.message || error);
    // Exit cleanly if credentials are not present in local offline dev
    if (process.env.STRICT_SYNC === 'true') {
      process.exit(1);
    }
  }
}

// Execute sync
syncPrintsToFirestore();
