/**
 * @file src/lib/voting.ts
 * @description Action handler and real-time listeners for Anonymous Print Voting & Demand-Gauge System.
 */

import { httpsCallable } from 'firebase/functions';
import { doc, onSnapshot } from 'firebase/firestore';
import { ensureAnonymousAuth, getFirebaseFirestore, getFirebaseFunctions } from './firebaseClient';

/**
 * Payload sent to `castVote` Cloud Function.
 */
export interface CastVoteRequestPayload {
  hygraphId: string;
  voteType: 'want_print' | 'pass';
  votingGroup?: string;
}

/**
 * Response structure returned by `castVote` Cloud Function.
 */
export interface CastVoteResponsePayload {
  success: boolean;
  hygraphId: string;
  voteType: 'want_print' | 'pass';
}

/**
 * Result returned to the UI component handling the vote interaction.
 */
export interface VoteActionResult {
  success: boolean;
  message: string;
  alreadyVoted?: boolean;
}

/**
 * Executes a vote for a potential print artwork.
 * 
 * Flow:
 * 1. Ensures client is anonymously authenticated via Firebase Auth (`signInAnonymously`).
 * 2. Invokes the `castVote` Cloud Function via `httpsCallable`.
 * 3. Handles duplicate vote errors (`already-exists`), validation errors, and network issues gracefully.
 * 
 * @async
 * @param {string} hygraphId - Unique Hygraph entry ID for the target artwork.
 * @param {'want_print' | 'pass'} voteType - Type of vote ('want_print' or 'pass').
 * @param {string} [votingGroup] - Optional votingGroup slug for variant grouping.
 * @returns {Promise<VoteActionResult>} Execution status and human-readable result message.
 */
export async function voteOnPrint(
  hygraphId: string,
  voteType: 'want_print' | 'pass',
  votingGroup?: string
): Promise<VoteActionResult> {
  try {
    // 1. Ensure client is anonymously authenticated
    await ensureAnonymousAuth();

    // 2. Obtain callable function reference
    const functions = getFirebaseFunctions();
    const castVoteCallable = httpsCallable<CastVoteRequestPayload, CastVoteResponsePayload>(functions, 'castVote');

    // 3. Call Cloud Function
    const response = await castVoteCallable({
      hygraphId,
      voteType,
      votingGroup,
    });

    if (response.data?.success) {
      return {
        success: true,
        message: voteType === 'want_print'
          ? 'Thank you! Your vote for a physical print release has been registered.'
          : 'Thank you for your feedback.',
      };
    }

    return {
      success: false,
      message: 'Unexpected response format from voting service.',
    };
  } catch (error: any) {
    console.error('[voting] Error submitting vote:', error);

    // Handle duplicate vote exception
    if (error?.code === 'functions/already-exists' || error?.message?.includes('already submitted')) {
      return {
        success: false,
        alreadyVoted: true,
        message: 'You have already submitted a vote for this print option.',
      };
    }

    // Handle Firebase Auth configuration missing error (Anonymous authentication disabled in Firebase console)
    if (
      error?.code === 'auth/configuration-not-found' ||
      error?.code === 'auth/operation-not-allowed' ||
      error?.message?.includes('configuration-not-found')
    ) {
      return {
        success: false,
        message: 'Anonymous Authentication is not enabled in Firebase Console. Enable "Anonymous" under Firebase Auth > Sign-in method.',
      };
    }

    // Handle App Check or Auth failures
    if (
      error?.code === 'functions/failed-precondition' ||
      error?.code === 'functions/unauthenticated' ||
      error?.code === 'auth/firebase-app-check-token-is-invalid' ||
      error?.message?.includes('App Check') ||
      error?.message?.includes('app-check')
    ) {
      return {
        success: false,
        message: 'Security verification failed (App Check token invalid). Please verify reCAPTCHA Enterprise API is enabled in GCP Console.',
      };
    }

    return {
      success: false,
      message: error?.message || 'Failed to register vote. Please check your network connection and try again.',
    };
  }
}

/**
 * Subscribes to real-time aggregate vote count updates for a specific potential print document in Firestore.
 * 
 * @param {string} hygraphId - Target Hygraph entry ID matching Firestore document ID.
 * @param {(voteCount: number) => void} callback - Handler called whenever voteCount updates in real-time.
 * @returns {() => void} Unsubscribe function to stop listening.
 */
export function subscribeToPrintVoteCount(
  hygraphId: string,
  callback: (voteCount: number) => void
): () => void {
  const db = getFirebaseFirestore();
  const docRef = doc(db, 'potential_prints', hygraphId);

  const unsubscribe = onSnapshot(
    docRef,
    (snapshot: any) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback(data.voteCount ?? 0);
      } else {
        callback(0);
      }
    },
    (error: any) => {
      console.warn(`[voting] Firestore realtime subscription error for print ${hygraphId}:`, error);
    }
  );

  return unsubscribe;
}
