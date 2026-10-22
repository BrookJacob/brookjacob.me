/**
 * ArtworkWallLabel Component
 * 
 * Museum wall label and print margin inscription rendered beneath each print.
 * Features:
 * - Newsreader serif for title & year
 * - Hand-written Caveat pencil edition number (e.g. "4/9")
 * - Fine-print IBM Plex Mono for technique, paper stock, and dimensions
 * - Atmospheric one-sentence origin story (where the print came from)
 * - Conversational "see this print" action link
 */

import React from 'react';

export interface ArtworkWallLabelProps {
  title: string;
  year: number;
  slug: string;
  editionTotal: number;
  pencilEdition: string;
  medium: string;
  paper: string;
  dimensions: string;
  originStory: string;
  onLinkClick?: () => void;
  printUrl: string;
}

export const ArtworkWallLabel: React.FC<ArtworkWallLabelProps> = ({
  title,
  year,
  slug: _slug,
  pencilEdition,
  medium,
  paper,
  dimensions,
  originStory,
  onLinkClick,
  printUrl,
}) => {
  return (
    <div className="w-full mt-4 pt-1 font-mono text-left leading-relaxed">
      {/* Title, Year, and Hand-Written Pencil Edition */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="font-serif text-lg sm:text-xl font-bold text-paper-text dark:text-carbon-text tracking-tight">
          <a
            href={printUrl}
            onClick={onLinkClick}
            className="hover:text-paper-accent dark:hover:text-carbon-accent transition-colors"
          >
            {title}
          </a>
          <span className="font-normal font-sans text-xs text-paper-muted dark:text-carbon-muted ml-2">
            {year}
          </span>
        </h3>

        {/* Hand-written pencil edition impression e.g. "4/9" */}
        <span
          className="font-handwriting text-base sm:text-lg text-[#52504b] dark:text-[#a8a59f] select-none tracking-wide"
          title="Numbered by hand in 2B pencil"
        >
          {pencilEdition}
        </span>
      </div>

      {/* Museum Specification Line: Medium, Paper, and Dimensions */}
      <p className="mt-1 text-[11px] text-paper-muted dark:text-carbon-muted tracking-tight font-mono">
        <span>{medium}</span>
        <span className="mx-1.5 opacity-60">·</span>
        <span>{paper}</span>
        <span className="mx-1.5 opacity-60">·</span>
        <span>{dimensions}</span>
      </p>

      {/* Origin Sentence (Where the print came from) */}
      {originStory && (
        <p className="mt-2 font-serif italic text-xs sm:text-sm text-paper-text/85 dark:text-carbon-text/85 leading-snug">
          "{originStory}"
        </p>
      )}

      {/* Conversational Action Link */}
      <div className="mt-3">
        <a
          href={printUrl}
          onClick={onLinkClick}
          className="font-mono text-[11px] text-paper-accent dark:text-carbon-accent hover:underline inline-flex items-center gap-1 group"
        >
          <span>see this print</span>
          <span className="inline-block transition-transform group-hover:translate-x-0.5">&rarr;</span>
        </a>
      </div>
    </div>
  );
};

export default ArtworkWallLabel;
