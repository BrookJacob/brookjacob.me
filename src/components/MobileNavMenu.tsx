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
                  {activeDomain === 'code' ? 'Developer Showcase' : 'Studio & Lab'}
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
              {activeDomain === 'code' ? (
                <>
                  <a
                    href={DOMAINS.code}
                    className={`px-4 py-3 rounded-xl font-serif text-base font-semibold transition-colors flex items-center justify-between ${
                      activeDomain === 'code'
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'text-paper-text dark:text-carbon-text hover:bg-paper-border/20 dark:hover:bg-carbon-border/20'
                    }`}
                  >
                    <span>Projects</span>
                    <span className="text-xs font-mono opacity-60">Overview</span>
                  </a>

                  <a
                    href={DOMAINS.blog}
                    className="px-4 py-3 rounded-xl font-serif text-base font-semibold transition-colors flex items-center justify-between text-paper-text dark:text-carbon-text hover:bg-paper-border/20 dark:hover:bg-carbon-border/20"
                  >
                    <span>Technical Essays</span>
                    <span className="text-xs font-mono opacity-60">Articles</span>
                  </a>

                  <a
                    href={DOMAINS.prints}
                    className="px-4 py-3 rounded-xl font-serif text-base font-semibold transition-colors flex items-center justify-between text-paper-text dark:text-carbon-text hover:bg-paper-border/20 dark:hover:bg-carbon-border/20"
                  >
                    <span>Printmaking Studio</span>
                    <span className="text-xs font-mono opacity-60">Prints</span>
                  </a>

                  <a
                    href="https://github.com/brookjacob"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 rounded-xl font-mono text-sm font-medium transition-colors flex items-center justify-between border border-paper-border dark:border-carbon-border text-paper-text dark:text-carbon-text hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                      </svg>
                      GitHub @brookjacob
                    </span>
                    <span className="text-xs font-mono opacity-60">&rarr;</span>
                  </a>
                </>
              ) : (
                <>
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

                  <a
                    href="https://instagram.com/brook.jacob"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 rounded-xl font-mono text-sm font-medium transition-colors flex items-center justify-between border border-paper-border dark:border-carbon-border text-paper-text dark:text-carbon-text hover:border-paper-accent dark:hover:border-carbon-accent hover:text-paper-accent dark:hover:text-carbon-accent"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                      </svg>
                      Instagram @brook.jacob
                    </span>
                    <span className="text-xs font-mono opacity-60">&rarr;</span>
                  </a>
                </>
              )}
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
