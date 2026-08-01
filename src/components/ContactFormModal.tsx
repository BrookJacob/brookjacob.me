/**
 * @file src/components/ContactFormModal.tsx
 * @description Multi-Subdomain Contact Form & Modal Component.
 * 
 * Submits contact messages to Firebase Firestore via the `submitContactForm` Cloud Function.
 * Auto-detects active subdomain ('print', 'dev', 'main') or accepts explicit `sourceSubdomain` prop.
 */

import React, { useState, useEffect } from 'react';
import { submitContactMessage } from '../lib/contact';

export interface ContactFormModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  sourceSubdomain?: string;
  triggerButtonText?: string;
  triggerButtonClassName?: string;
  isEmbedded?: boolean;
}

/**
 * Determines current subdomain prefix ('print', 'dev', 'main') based on window hostname.
 */
function detectSubdomain(): string {
  if (typeof window === 'undefined') return 'main';
  const hostname = window.location.hostname.toLowerCase();
  if (hostname.includes('printmaker') || hostname.includes('prints.')) return 'print';
  if (hostname.includes('developer') || hostname.includes('code.')) return 'dev';
  return 'main';
}

export const ContactFormModal: React.FC<ContactFormModalProps> = ({
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  sourceSubdomain: customSubdomain,
  triggerButtonText = 'Contact Studio',
  triggerButtonClassName = '',
  isEmbedded = false,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const isModalOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const handleClose = () => {
    if (externalOnClose) {
      externalOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!name.trim() || !email.trim() || !message.trim()) {
      setStatusMessage('Please complete all form fields.');
      setIsSuccess(false);
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const subdomain = customSubdomain || detectSubdomain();
    const result = await submitContactMessage(subdomain, name, email, message);

    setIsSubmitting(false);
    setStatusMessage(result.message);
    setIsSuccess(result.success);

    if (result.success) {
      setName('');
      setEmail('');
      setMessage('');
    }
  };

  const formContent = (
    <div className="w-full">
      <div className="mb-6">
        <span className="text-[10px] font-mono uppercase tracking-widest font-semibold text-paper-accent dark:text-carbon-accent">
          Direct Inquiry ({customSubdomain || detectSubdomain()})
        </span>
        <h3 className="font-serif text-2xl font-bold text-paper-text dark:text-carbon-text mt-1">
          Send a Message
        </h3>
        <p className="text-xs text-paper-muted dark:text-carbon-muted mt-1 font-serif">
          Have a question about print editions, custom commissions, or software engineering projects? Send a message below.
        </p>
      </div>

      {statusMessage && (
        <div
          className={`mb-4 p-3 rounded-lg text-xs font-mono border ${
            isSuccess
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
          }`}
        >
          {statusMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-paper-muted dark:text-carbon-muted mb-1.5 font-medium">
            Your Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jacob Brook"
            className="w-full px-3.5 py-2.5 rounded-lg bg-paper-bg dark:bg-carbon-bg border border-paper-border dark:border-carbon-border text-paper-text dark:text-carbon-text text-sm font-sans focus:outline-none focus:ring-2 focus:ring-paper-accent dark:focus:ring-carbon-accent transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-paper-muted dark:text-carbon-muted mb-1.5 font-medium">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jacob@brookjacob.studio"
            className="w-full px-3.5 py-2.5 rounded-lg bg-paper-bg dark:bg-carbon-bg border border-paper-border dark:border-carbon-border text-paper-text dark:text-carbon-text text-sm font-sans focus:outline-none focus:ring-2 focus:ring-paper-accent dark:focus:ring-carbon-accent transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-paper-muted dark:text-carbon-muted mb-1.5 font-medium">
            Message
          </label>
          <textarea
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your message or inquiry here..."
            className="w-full px-3.5 py-2.5 rounded-lg bg-paper-bg dark:bg-carbon-bg border border-paper-border dark:border-carbon-border text-paper-text dark:text-carbon-text text-sm font-sans focus:outline-none focus:ring-2 focus:ring-paper-accent dark:focus:ring-carbon-accent transition-all resize-none"
          />
        </div>

        <div className="pt-2 flex justify-end gap-3">
          {!isEmbedded && (
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 rounded-lg text-xs font-mono font-medium text-paper-muted dark:text-carbon-muted hover:text-paper-text dark:hover:text-carbon-text transition-all"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-lg bg-paper-accent dark:bg-carbon-accent text-white font-mono text-xs font-semibold tracking-wide hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Sending...</span>
              </>
            ) : (
              <span>Submit Message</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );

  if (isEmbedded) {
    return (
      <div className="p-6 sm:p-8 rounded-xl bg-paper-bg dark:bg-carbon-bg border border-paper-border dark:border-carbon-border shadow-sm">
        {formContent}
      </div>
    );
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setInternalIsOpen(true)}
        className={
          triggerButtonClassName ||
          'px-4 py-2 rounded-lg bg-paper-accent dark:bg-carbon-accent text-white font-mono text-xs font-medium hover:opacity-90 transition-all shadow-sm'
        }
      >
        {triggerButtonText}
      </button>

      {/* Modal Backdrop */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-2xl bg-paper-bg dark:bg-carbon-bg border border-paper-border dark:border-carbon-border shadow-2xl">
            {/* Close Icon Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-paper-muted dark:text-carbon-muted hover:text-paper-text dark:hover:text-carbon-text transition-all"
              aria-label="Close Modal"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {formContent}
          </div>
        </div>
      )}
    </>
  );
};

export default ContactFormModal;
