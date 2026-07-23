/**
 * LightboxModal Component
 * 
 * An accessible client-side image zoom lightbox component built on Radix UI Dialog primitives.
 * Incorporates Blurhash progressive image canvas rendering for instant preview previews.
 */

import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { BlurhashCanvas } from './BlurhashCanvas';

/**
 * Props for LightboxModal component.
 */
export interface LightboxModalProps {
  /** High-resolution image URL to render inside the expanded modal viewport */
  src: string;
  /** Accessible image description text */
  alt: string;
  /** Optional Blurhash string for smooth progressive image preview */
  blurhash?: string;
  /** Optional artwork title to render in accessible dialog header */
  title?: string;
  /** Artwork technique details rendered as subtitle */
  technique?: string;
}

/**
 * LightboxModal React Component
 * 
 * @param {LightboxModalProps} props - Component property options.
 * @returns {JSX.Element} Radix UI Dialog implementation with Blurhash progressive loading.
 */
export const LightboxModal: React.FC<LightboxModalProps> = ({
  src,
  alt,
  blurhash,
  title = 'Artwork Detail Zoom',
  technique,
}) => {
  // Radix Dialog open state controlled locally
  const [open, setOpen] = useState<boolean>(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {/* Interactive Trigger wrapping the visual preview with Blurhash progressive loader */}
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label={`Enlarge artwork: ${title}`}
          className="group relative block w-full overflow-hidden rounded-lg focus:outline-none focus-tactile border border-paper-border dark:border-carbon-border cursor-zoom-in"
        >
          <BlurhashCanvas
            src={src}
            alt={alt}
            blurhash={blurhash}
            className="w-full h-auto object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
          {/* Visual Overlay hint */}
          <div className="absolute inset-0 bg-paper-text/10 dark:bg-carbon-text/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
            <span className="bg-paper-bg/90 dark:bg-carbon-bg/90 text-paper-text dark:text-carbon-text text-xs uppercase tracking-widest px-3 py-1.5 rounded shadow-sm border border-paper-border dark:border-carbon-border">
              Click to Zoom
            </span>
          </div>
        </button>
      </Dialog.Trigger>

      {/* Accessible Portal Container */}
      <Dialog.Portal>
        {/* Backdrop Overlay with smooth transition fade */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md transition-opacity duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Dialog Viewport Panel */}
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 max-h-[90vh] w-[92vw] max-w-5xl translate-x-[-50%] translate-y-[-50%] rounded-xl bg-paper-bg dark:bg-carbon-bg p-4 sm:p-6 shadow-2xl border border-paper-border dark:border-carbon-border focus:outline-none transition-all duration-300">
          {/* Header metadata layout */}
          <div className="flex items-center justify-between border-b border-paper-border dark:border-carbon-border pb-3 mb-4">
            <div>
              <Dialog.Title className="font-serif text-xl sm:text-2xl font-bold text-paper-text dark:text-carbon-text">
                {title}
              </Dialog.Title>
              {technique && (
                <Dialog.Description className="text-xs sm:text-sm text-paper-muted dark:text-carbon-muted">
                  {technique}
                </Dialog.Description>
              )}
            </div>

            {/* Close button */}
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-md p-2 text-paper-muted hover:text-paper-text dark:text-carbon-muted dark:hover:text-carbon-text hover:bg-paper-border/40 dark:hover:bg-carbon-border/40 transition-colors focus:outline-none"
                aria-label="Close high-res lightbox modal"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </Dialog.Close>
          </div>

          {/* Full Resolution Zoom View with Blurhash Progressive Render */}
          <div className="relative flex items-center justify-center max-h-[72vh] overflow-auto rounded-md bg-paper-bg/50 dark:bg-carbon-bg/50">
            <BlurhashCanvas
              src={src}
              alt={alt}
              blurhash={blurhash}
              className="max-h-[70vh] w-auto rounded object-contain"
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
