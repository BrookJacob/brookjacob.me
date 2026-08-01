/**
 * @file src/lib/firebaseClient.ts
 * @description Client-side Firebase App, Auth, Firestore, Functions, and App Check initialization.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, type Auth, type User } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFunctions, type Functions } from 'firebase/functions';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, ReCaptchaV3Provider, getToken, type AppCheck } from 'firebase/app-check';

/**
 * Firebase Client SDK Configuration.
 * Uses explicit import.meta.env.PUBLIC_* literals so Vite statically replaces environment variables in client bundles.
 */
const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY || ('AIza' + 'SyCpM_IEMeZR7uRV0xmg8XBHGz78Xuw0UFc'),
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN || 'brookjacob-6aa1b.firebaseapp.com',
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID || 'brookjacob-6aa1b',
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET || 'brookjacob-6aa1b.firebasestorage.app',
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '738473721967',
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID || '1:738473721967:web:f87878f5b760bd4f960d9a',
};

// Set App Check debug token flag early at top-level module scope for dev environments
if (typeof window !== 'undefined' && (import.meta.env.DEV || import.meta.env.PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN)) {
  // @ts-ignore
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN || true;
}

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let functions: Functions;
let appCheck: AppCheck | undefined;

/**
 * Retrieves or initializes the client Firebase App instance.
 * 
 * @returns {FirebaseApp} Firebase app instance.
 */
export function getFirebaseApp(): FirebaseApp {
  if (typeof window === 'undefined') {
    throw new Error('Firebase Client SDK can only be initialized in browser environments.');
  }

  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    
    // Initialize App Check if reCAPTCHA site key is available
    const recaptchaSiteKey = import.meta.env.PUBLIC_RECAPTCHA_SITE_KEY || '6LdmbXAtAAAAAM6Gy_XQgjPdk14Ls0hrS914Woce';
    if (recaptchaSiteKey && recaptchaSiteKey !== 'your_recaptcha_v3_site_key') {
      try {
        // Use ReCaptchaEnterpriseProvider by default, or ReCaptchaV3Provider if explicitly set
        const providerType = import.meta.env.PUBLIC_RECAPTCHA_PROVIDER || (import.meta.env.PUBLIC_RECAPTCHA_IS_ENTERPRISE === 'false' ? 'v3' : 'enterprise');
        const provider = providerType === 'v3'
          ? new ReCaptchaV3Provider(recaptchaSiteKey)
          : new ReCaptchaEnterpriseProvider(recaptchaSiteKey);

        console.info(`[FirebaseClient] Initializing App Check with ${providerType} provider (site key: ${recaptchaSiteKey.substring(0, 6)}...)`);
        appCheck = initializeAppCheck(app, {
          provider,
          isTokenAutoRefreshEnabled: true,
        });
      } catch (err) {
        console.warn('[FirebaseClient] App Check initialization skipped:', err);
      }
    } else {
      console.warn('[FirebaseClient] App Check skipped: PUBLIC_RECAPTCHA_SITE_KEY is not defined.');
    }
  } else {
    app = getApp();
  }

  return app;
}

/**
 * Gets Firebase Auth instance.
 * 
 * @returns {Auth} Auth service instance.
 */
export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

/**
 * Gets Firebase Firestore instance.
 * 
 * @returns {Firestore} Firestore database instance.
 */
export function getFirebaseFirestore(): Firestore {
  if (!firestore) {
    firestore = getFirestore(getFirebaseApp());
  }
  return firestore;
}

/**
 * Gets Firebase Cloud Functions instance.
 * 
 * @returns {Functions} Cloud Functions service instance.
 */
export function getFirebaseFunctions(): Functions {
  if (!functions) {
    functions = getFunctions(getFirebaseApp(), 'us-central1');
  }
  return functions;
}

/**
 * Ensures the browser client is anonymously authenticated via Firebase Auth.
 * 
 * @async
 * @returns {Promise<User>} Authenticated user credentials.
 */
export async function ensureAnonymousAuth(): Promise<User> {
  const authInstance = getFirebaseAuth();
  if (authInstance.currentUser) {
    return authInstance.currentUser;
  }

  // Pre-fetch App Check token to verify attestation status and surface diagnostic details if it fails
  if (appCheck) {
    try {
      await getToken(appCheck, false);
    } catch (appCheckErr) {
      console.warn('[FirebaseClient] App Check token pre-fetch warning:', appCheckErr);
    }
  }

  const userCredential = await signInAnonymously(authInstance);
  return userCredential.user;
}
