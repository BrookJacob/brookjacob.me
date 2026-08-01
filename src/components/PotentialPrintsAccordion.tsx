/**
 * @file src/components/PotentialPrintsAccordion.tsx
 * @description Radix UI Accordion Primitive Wrapper for the Demand-Gauge Voting Gallery.
 * 
 * Positions the Demand-Gauge Voting panel right near the page header in an expandable,
 * accessible Radix UI Accordion primitive. Keeps the main archive grid clean while providing
 * an interactive callout for visitors to expand and vote on upcoming print concepts.
 */

import React from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import PotentialPrintsGallery from './PotentialPrintsGallery';

export interface PotentialPrintsAccordionProps {
  defaultOpen?: boolean;
}

export const PotentialPrintsAccordion: React.FC<PotentialPrintsAccordionProps> = ({ defaultOpen = false }) => {
  return (
    <Accordion.Root
      type="single"
      collapsible
      defaultValue={defaultOpen ? 'demand-gauge' : undefined}
      className="w-full mb-10"
    >
      <Accordion.Item
        value="demand-gauge"
        className="bg-paper-bg dark:bg-carbon-bg border border-paper-border dark:border-carbon-border rounded-xl overflow-hidden shadow-sm transition-all duration-300"
      >
        <Accordion.Header className="flex">
          <Accordion.Trigger className="w-full px-6 py-4 flex items-center justify-between text-left group hover:bg-paper-border/20 dark:hover:bg-carbon-border/20 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-paper-accent dark:focus-visible:ring-carbon-accent">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-paper-accent dark:bg-carbon-accent animate-pulse"></span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-widest font-mono font-semibold text-paper-accent dark:text-carbon-accent">
                    Demand-Gauge System
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-paper-accent/10 dark:bg-carbon-accent/10 text-paper-accent dark:text-carbon-accent border border-paper-accent/20">
                    Vote on Next Edition
                  </span>
                </div>
                <h3 className="font-serif text-lg font-bold text-paper-text dark:text-carbon-text mt-0.5">
                  Vote for Upcoming Print Concepts & Colorways
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3 text-paper-muted dark:text-carbon-muted font-mono text-xs">
              <span className="hidden sm:inline-block group-data-[state=open]:hidden">
                Expand Voting Panel &rarr;
              </span>
              <span className="hidden sm:inline-block group-data-[state=closed]:hidden">
                Collapse Panel &uarr;
              </span>
              <svg
                className="w-5 h-5 transition-transform duration-300 group-data-[state=open]:rotate-180 text-paper-accent dark:text-carbon-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </Accordion.Trigger>
        </Accordion.Header>

        <Accordion.Content className="px-6 pb-6 pt-2 border-t border-paper-border/60 dark:border-carbon-border/60 transition-all data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
          <PotentialPrintsGallery />
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  );
};

export default PotentialPrintsAccordion;
