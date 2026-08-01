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
 * Firebase Client SDK Configuration loaded from environment variables.
 */
const firebaseConfig = {
  apiKey: process.env.PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.PUBLIC_FIREBASE_AUTH_DOMAIN || 'brookjacob-me.firebaseapp.com',
  projectId: process.env.PUBLIC_FIREBASE_PROJECT_ID || 'brookjacob-me',
  storageBucket: process.env.PUBLIC_FIREBASE_STORAGE_BUCKET || 'brookjacob-me.appspot.com',
  messagingSenderId: process.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.PUBLIC_FIREBASE_APP_ID || '',
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
    const recaptchaSiteKey = process.env.PUBLIC_RECAPTCHA_SITE_KEY;
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
