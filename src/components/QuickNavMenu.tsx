/**
 * QuickNavMenu Component (Radix UI Dropdown Primitive)
 * 
 * Accessible dropdown menu primitive built with @radix-ui/react-dropdown-menu.
 * Allows quick navigation to recent platforms, printmaking artwork, and site indexes.
 * 
 * @component
 */

import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

export const QuickNavMenu: React.FC = () => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-paper-border dark:border-carbon-border bg-paper-bg dark:bg-carbon-bg text-paper-text dark:text-carbon-text hover:border-paper-accent dark:hover:border-carbon-accent transition-all focus-ring focus:outline-none cursor-pointer"
          aria-label="Quick Jump Menu"
        >
          <span>Quick Jump</span>
          <svg
            className="w-3.5 h-3.5 opacity-70 transition-transform group-data-[state=open]:rotate-180"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[220px] bg-paper-bg dark:bg-carbon-bg border border-paper-border dark:border-carbon-border rounded-xl p-2 shadow-xl animate-in fade-in-80 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
          sideOffset={6}
        >
          {/* Section 1: Featured Platforms */}
          <DropdownMenu.Label className="px-2.5 py-1.5 text-[10px] uppercase font-mono font-semibold tracking-wider text-paper-muted dark:text-carbon-muted">
            Featured Platforms
          </DropdownMenu.Label>

          <DropdownMenu.Item asChild>
            <a
              href="/code/able-roadmap"
              className="flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded-lg text-paper-text dark:text-carbon-text hover:bg-paper-border/30 dark:hover:bg-carbon-border/30 hover:text-paper-accent dark:hover:text-carbon-accent transition-colors outline-none cursor-pointer"
            >
              <span>ABLE Roadmap</span>
              <span className="text-[10px] font-mono opacity-60">SaaS</span>
            </a>
          </DropdownMenu.Item>

          <DropdownMenu.Item asChild>
            <a
              href="/code/satori-trailheads"
              className="flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded-lg text-paper-text dark:text-carbon-text hover:bg-paper-border/30 dark:hover:bg-carbon-border/30 hover:text-paper-accent dark:hover:text-carbon-accent transition-colors outline-none cursor-pointer"
            >
              <span>Satori Trailheads</span>
              <span className="text-[10px] font-mono opacity-60">Platform</span>
            </a>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-paper-border dark:bg-carbon-border my-1.5" />

          {/* Section 2: Printmaking Highlights */}
          <DropdownMenu.Label className="px-2.5 py-1.5 text-[10px] uppercase font-mono font-semibold tracking-wider text-paper-muted dark:text-carbon-muted">
            Printmaking Studio
          </DropdownMenu.Label>

          <DropdownMenu.Item asChild>
            <a
              href="/prints/view-from-a-distance"
              className="flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded-lg text-paper-text dark:text-carbon-text hover:bg-paper-border/30 dark:hover:bg-carbon-border/30 hover:text-paper-accent dark:hover:text-carbon-accent transition-colors outline-none cursor-pointer"
            >
              <span>View from a Distance</span>
              <span className="text-[10px] font-mono opacity-60">2025</span>
            </a>
          </DropdownMenu.Item>

          <DropdownMenu.Item asChild>
            <a
              href="/prints/nora"
              className="flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded-lg text-paper-text dark:text-carbon-text hover:bg-paper-border/30 dark:hover:bg-carbon-border/30 hover:text-paper-accent dark:hover:text-carbon-accent transition-colors outline-none cursor-pointer"
            >
              <span>Nora</span>
              <span className="text-[10px] font-mono opacity-60">2025</span>
            </a>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-paper-border dark:bg-carbon-border my-1.5" />

          {/* Section 3: Index Portals */}
          <DropdownMenu.Item asChild>
            <a
              href="https://brookjacob.studio"
              className="flex items-center justify-between px-2.5 py-2 text-xs font-semibold rounded-lg text-paper-accent dark:text-carbon-accent hover:bg-paper-border/30 dark:hover:bg-carbon-border/30 transition-colors outline-none cursor-pointer"
            >
              <span>Root Portal</span>
              <span>&rarr;</span>
            </a>
          </DropdownMenu.Item>

          <DropdownMenu.Arrow className="fill-paper-border dark:fill-carbon-border" />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default QuickNavMenu;
