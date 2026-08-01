/**
 * @file src/lib/contact.ts
 * @description Frontend Action Handler for Multi-Subdomain Contact Form Submissions.
 */

import { httpsCallable } from 'firebase/functions';
import { getFirebaseFunctions } from './firebaseClient';

/**
 * Payload structure sent to `submitContactForm` Cloud Function.
 */
export interface ContactFormRequestPayload {
  sourceSubdomain: string;
  senderName: string;
  senderEmail: string;
  message: string;
}

/**
 * Response payload returned by `submitContactForm` Cloud Function.
 */
export interface ContactFormResponsePayload {
  success: boolean;
  messageId: string;
}

/**
 * Result returned to the UI component handling the contact form.
 */
export interface ContactActionResult {
  success: boolean;
  message: string;
  messageId?: string;
}

/**
 * Submits a contact form message across any subdomain ('print', 'dev', 'main', etc.).
 * 
 * Flow:
 * 1. Invokes `submitContactForm` Cloud Function via `httpsCallable`.
 * 2. Enforces input sanitization and handles validation/network errors.
 * 
 * @async
 * @param {string} sourceSubdomain - Subdomain originating the submission (e.g. 'print', 'dev', 'main').
 * @param {string} senderName - Sender's full name.
 * @param {string} senderEmail - Sender's email address.
 * @param {string} message - Message text body.
 * @returns {Promise<ContactActionResult>} Execution result and user feedback message.
 */
export async function submitContactMessage(
  sourceSubdomain: string,
  senderName: string,
  senderEmail: string,
  message: string
): Promise<ContactActionResult> {
  try {
    // 1. Obtain callable function reference
    const functions = getFirebaseFunctions();
    const submitFormCallable = httpsCallable<ContactFormRequestPayload, ContactFormResponsePayload>(
      functions,
      'submitContactForm'
    );

    // 2. Call Cloud Function
    const response = await submitFormCallable({
      sourceSubdomain: sourceSubdomain || 'main',
      senderName,
      senderEmail,
      message,
    });

    if (response.data?.success) {
      return {
        success: true,
        message: 'Your message has been sent successfully. Thank you for reaching out!',
        messageId: response.data.messageId,
      };
    }

    return {
      success: false,
      message: 'Unexpected response format from contact service.',
    };
  } catch (error: any) {
    console.error('[contact] Error submitting contact message:', error);

    if (error?.code === 'functions/invalid-argument') {
      return {
        success: false,
        message: error?.message || 'Please verify that all form fields are correctly filled.',
      };
    }

    if (error?.code === 'functions/failed-precondition') {
      return {
        success: false,
        message: 'Security verification failed. Please refresh the page and try again.',
      };
    }

    return {
      success: false,
      message: error?.message || 'Unable to deliver message. Please try again later.',
    };
  }
}
