/**
 * MobileNavMenu Component (Radix UI Slide-Over Drawer Primitive)
 * 
 * Accessible mobile sliding menu built with @radix-ui/react-dialog.
 * Prevents header crowding on small screens (< 768px) with a smooth side drawer panel.
 * 
 * @component
 */

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { DOMAINS } from '../lib/urls';

interface MobileNavMenuProps {
  activeDomain?: 'root' | 'prints' | 'code' | 'blog' | 'bio';
}

export const MobileNavMenu: React.FC<MobileNavMenuProps> = ({ activeDomain = 'root' }) => {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="md:hidden p-2 rounded-lg border border-paper-border dark:border-carbon-border text-paper-text dark:text-carbon-text hover:bg-paper-border/30 dark:hover:bg-carbon-border/30 transition-colors focus-ring focus:outline-none cursor-pointer"
          aria-label="Open mobile navigation menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        {/* Overlay Backdrop */}
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200" />

        {/* Slide-Over Content Panel */}
        <Dialog.Content className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-paper-bg dark:bg-carbon-bg border-l border-paper-border dark:border-carbon-border p-6 shadow-2xl z-50 flex flex-col justify-between focus:outline-none animate-in slide-in-from-right duration-300">
          <div>
            {/* Mobile Menu Header & Close Button */}
            <div className="flex items-center justify-between pb-6 border-b border-paper-border dark:border-carbon-border">
              <div>
                <Dialog.Title className="font-serif text-lg font-bold text-paper-text dark:text-carbon-text">
                  Jacob Brook
                </Dialog.Title>
                <Dialog.Description className="text-xs text-paper-muted dark:text-carbon-muted">
                  Studio & Lab
                </Dialog.Description>
              </div>

              <Dialog.Close asChild>
                <button
                  type="button"
                  className="p-1.5 rounded-lg text-paper-muted dark:text-carbon-muted hover:text-paper-text dark:hover:text-carbon-text hover:bg-paper-border/30 dark:hover:bg-carbon-border/30 transition-colors cursor-pointer"
                  aria-label="Close menu"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </Dialog.Close>
            </div>

            {/* Navigation Links Feed */}
            <nav className="flex flex-col gap-2 py-6">
              <a
                href={DOMAINS.portal}
                className={`px-4 py-3 rounded-xl font-serif text-base font-semibold transition-colors flex items-center justify-between ${
                  activeDomain === 'root'
                    ? 'bg-paper-border/40 dark:bg-carbon-border/40 text-paper-accent dark:text-carbon-accent'
                    : 'text-paper-text dark:text-carbon-text hover:bg-paper-border/20 dark:hover:bg-carbon-border/20'
                }`}
              >
                <span>Jacob Brook Studio & Lab</span>
                <span className="text-xs font-mono opacity-60">Home</span>
              </a>

              <a
                href={DOMAINS.prints}
                className={`px-4 py-3 rounded-xl font-serif text-base font-semibold transition-colors flex items-center justify-between ${
                  activeDomain === 'prints'
                    ? 'bg-paper-border/40 dark:bg-carbon-border/40 text-paper-accent dark:text-carbon-accent'
                    : 'text-paper-text dark:text-carbon-text hover:bg-paper-border/20 dark:hover:bg-carbon-border/20'
                }`}
              >
                <span>Prints</span>
                <span className="text-xs font-mono opacity-60">Gallery</span>
              </a>

              <a
                href={DOMAINS.bio}
                className={`px-4 py-3 rounded-xl font-serif text-base font-semibold transition-colors flex items-center justify-between border border-paper-border dark:border-carbon-border ${
                  activeDomain === 'bio'
                    ? 'bg-paper-accent/15 dark:bg-carbon-accent/15 text-paper-accent dark:text-carbon-accent border-paper-accent/40 dark:border-carbon-accent/40 font-semibold'
                    : 'text-paper-text dark:text-carbon-text hover:bg-paper-border/20 dark:hover:bg-carbon-border/20'
                }`}
              >
                <span>Bio</span>
                <span className="text-xs font-mono opacity-60">About</span>
              </a>
            </nav>
          </div>

          {/* Drawer Footer */}
          <div className="pt-4 border-t border-paper-border dark:border-carbon-border text-center">
            <p className="text-[11px] text-paper-muted dark:text-carbon-muted">
              &copy; {new Date().getFullYear()} Jacob Brook. All rights reserved.
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default MobileNavMenu;
