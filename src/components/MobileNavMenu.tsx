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

interface MobileNavMenuProps {
  activeDomain?: 'root' | 'prints' | 'code' | 'blog';
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
                  Studio & Web Portfolio
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
                href="/"
                className={`px-4 py-3 rounded-xl font-serif text-base font-semibold transition-colors ${
                  activeDomain === 'root'
                    ? 'bg-paper-border/40 dark:bg-carbon-border/40 text-paper-accent dark:text-carbon-accent'
                    : 'text-paper-text dark:text-carbon-text hover:bg-paper-border/20 dark:hover:bg-carbon-border/20'
                }`}
              >
                Portal
              </a>

              <a
                href="/prints"
                className={`px-4 py-3 rounded-xl font-serif text-base font-semibold transition-colors ${
                  activeDomain === 'prints'
                    ? 'bg-paper-border/40 dark:bg-carbon-border/40 text-paper-accent dark:text-carbon-accent'
                    : 'text-paper-text dark:text-carbon-text hover:bg-paper-border/20 dark:hover:bg-carbon-border/20'
                }`}
              >
                Printmaking Studio
              </a>

              <a
                href="/code"
                className={`px-4 py-3 rounded-xl font-serif text-base font-semibold transition-colors ${
                  activeDomain === 'code'
                    ? 'bg-paper-border/40 dark:bg-carbon-border/40 text-blue-600 dark:text-blue-400'
                    : 'text-paper-text dark:text-carbon-text hover:bg-paper-border/20 dark:hover:bg-carbon-border/20'
                }`}
              >
                Developer Showcase
              </a>

              <a
                href="/blog"
                className={`px-4 py-3 rounded-xl font-serif text-base font-semibold transition-colors ${
                  activeDomain === 'blog'
                    ? 'bg-paper-border/40 dark:bg-carbon-border/40 text-paper-accent dark:text-carbon-accent'
                    : 'text-paper-text dark:text-carbon-text hover:bg-paper-border/20 dark:hover:bg-carbon-border/20'
                }`}
              >
                Essays & Notes
              </a>
            </nav>

            {/* Featured Platforms Callout in Mobile Drawer */}
            <div className="pt-4 border-t border-paper-border/60 dark:border-carbon-border/60">
              <span className="text-[10px] font-mono uppercase tracking-wider text-paper-muted dark:text-carbon-muted px-1">
                Featured Platforms
              </span>
              <div className="flex flex-col gap-1.5 mt-2">
                <a
                  href="https://ableroadmap.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg text-paper-text dark:text-carbon-text hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <span>ABLE Roadmap</span>
                  <span className="text-[10px] opacity-60">ableroadmap.com ↗</span>
                </a>
                <a
                  href="https://satoritrailheads.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg text-paper-text dark:text-carbon-text hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <span>Satori Trailheads</span>
                  <span className="text-[10px] opacity-60">satoritrailheads.com ↗</span>
                </a>
              </div>
            </div>
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
