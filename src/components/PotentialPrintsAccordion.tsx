/**
 * @file src/components/PotentialPrintsAccordion.tsx
 * @description Radix UI Accordion Primitive Wrapper for the Upcoming Editions Voting Gallery.
 * 
 * Positions the Upcoming Editions Voting panel right near the page header in an expandable,
 * accessible Radix UI Accordion primitive. Keeps the main archive grid clean while providing
 * an interactive callout for visitors to expand and vote on upcoming print concepts.
 */

import React from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import PotentialPrintsGallery from './PotentialPrintsGallery';
import type { PotentialPrint } from '../lib/potentialPrints';

export interface PotentialPrintsAccordionProps {
  defaultOpen?: boolean;
  initialPrints?: PotentialPrint[];
}

export const PotentialPrintsAccordion: React.FC<PotentialPrintsAccordionProps> = ({
  defaultOpen = false,
  initialPrints,
}) => {
  const inProductionItem = initialPrints?.find((p) => p.inProduction === true);

  return (
    <Accordion.Root
      type="single"
      collapsible
      defaultValue={defaultOpen ? 'upcoming-prints' : undefined}
      className="w-full mb-8"
    >
      <Accordion.Item
        value="upcoming-prints"
        className="bg-paper-bg dark:bg-carbon-bg border border-paper-border/80 dark:border-carbon-border/80 rounded-xl overflow-hidden transition-all duration-300"
      >
        <Accordion.Header className="flex">
          <Accordion.Trigger className="w-full px-4 sm:px-5 py-3 flex items-center justify-between text-left group hover:bg-paper-border/20 dark:hover:bg-carbon-border/20 transition-colors cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-paper-accent dark:focus-visible:ring-carbon-accent">
            <div className="flex items-center gap-3">
              <span className="text-[11px] uppercase tracking-wider font-mono font-semibold text-paper-accent dark:text-carbon-accent px-2 py-0.5 rounded bg-paper-accent/10 dark:bg-carbon-accent/10 border border-paper-accent/20">
                Studio Bench
              </span>
              <p className="text-xs sm:text-sm font-serif text-paper-text dark:text-carbon-text">
                {inProductionItem ? (
                  <>
                    <span className="hidden sm:inline text-paper-muted dark:text-carbon-muted">In Progress: </span>
                    <strong className="font-semibold">{inProductionItem.title}</strong>
                    <span className="text-paper-muted dark:text-carbon-muted hidden md:inline"> &mdash; Help select the next block</span>
                  </>
                ) : (
                  <span>Upcoming Print Concepts & Color Studies</span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 text-paper-muted dark:text-carbon-muted font-mono text-xs">
              <span className="hidden sm:inline-block group-data-[state=open]:hidden">
                View Concepts & Vote &darr;
              </span>
              <span className="hidden sm:inline-block group-data-[state=closed]:hidden">
                Hide &uarr;
              </span>
              <svg
                className="w-4 h-4 transition-transform duration-300 group-data-[state=open]:rotate-180 text-paper-accent dark:text-carbon-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </Accordion.Trigger>
        </Accordion.Header>

        <Accordion.Content className="px-5 pb-5 pt-3 border-t border-paper-border/60 dark:border-carbon-border/60 transition-all data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
          <PotentialPrintsGallery initialPrints={initialPrints} />
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  );
};

export default PotentialPrintsAccordion;
