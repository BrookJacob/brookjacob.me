/**
 * @file src/lib/firebaseClient.ts
 * @description Client-side Firebase App, Auth, Firestore, Functions, and App Check initialization.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, type Auth, type User } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFunctions, type Functions } from 'firebase/functions';
import { initializeAppCheck, ReCaptchaV3Provider, type AppCheck } from 'firebase/app-check';

/**
 * Firebase Client SDK Configuration.
 * Uses explicit import.meta.env.PUBLIC_* literals so Vite statically replaces environment variables in client bundles.
 */
const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY || 'AIzaSyCpM_IEMeZR7uRV0xmg8XBHGz78Xuw0UFc',
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN || 'brookjacob-6aa1b.firebaseapp.com',
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID || 'brookjacob-6aa1b',
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET || 'brookjacob-6aa1b.firebasestorage.app',
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '738473721967',
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID || '1:738473721967:web:f87878f5b760bd4f960d9a',
};

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
    
    // Initialize App Check if reCAPTCHA v3 site key is available
    const recaptchaSiteKey = import.meta.env.PUBLIC_RECAPTCHA_SITE_KEY;
    if (recaptchaSiteKey && recaptchaSiteKey !== 'your_recaptcha_v3_site_key') {
      try {
        appCheck = initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(recaptchaSiteKey),
          isTokenAutoRefreshEnabled: true,
        });
      } catch (err) {
        console.warn('[FirebaseClient] App Check initialization skipped:', err);
      }
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
  const userCredential = await signInAnonymously(authInstance);
  return userCredential.user;
}
