/**
 * ArtworkWallLabel Component
 * 
 * Museum wall label and print margin inscription rendered beneath each print.
 * Strict data truthfulness: ONLY displays fields that actually have non-null data.
 * If a field has no data, nothing is rendered.
 */

import React from 'react';

export interface ArtworkWallLabelProps {
  title: string;
  year?: number | null;
  edition?: string | null;
  medium?: string | null;
  paper?: string | null;
  dimensions?: string | null;
  description?: string | null;
  printUrl: string;
  onLinkClick?: () => void;
}

export const ArtworkWallLabel: React.FC<ArtworkWallLabelProps> = ({
  title,
  year,
  edition,
  medium,
  paper,
  dimensions,
  description,
  printUrl,
  onLinkClick,
}) => {
  // Collect only the specification fields that genuinely have data
  const specItems = [medium, paper, dimensions].filter(
    (item): item is string => typeof item === 'string' && item.trim().length > 0
  );

  const hasDescription = typeof description === 'string' && description.trim().length > 0;

  return (
    <div className="w-full mt-4 pt-1 font-mono text-left leading-relaxed">
      {/* Title, Year, and Genuine Edition (if recorded) */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="font-serif text-lg sm:text-xl font-bold text-paper-text dark:text-carbon-text tracking-tight">
          <a
            href={printUrl}
            onClick={onLinkClick}
            className="hover:text-paper-accent dark:hover:text-carbon-accent transition-colors"
          >
            {title}
          </a>
          {year && (
            <span className="font-normal font-sans text-xs text-paper-muted dark:text-carbon-muted ml-2">
              {year}
            </span>
          )}
        </h3>

        {/* Real edition from CMS (e.g. "ed. 10"), only if recorded */}
        {edition && (
          <span
            className="font-handwriting text-base sm:text-lg text-[#52504b] dark:text-[#a8a59f] select-none tracking-wide"
            title={`Edition: ${edition}`}
          >
            {edition}
          </span>
        )}
      </div>

      {/* Specifications Line: only render if at least one spec field genuinely exists */}
      {specItems.length > 0 && (
        <p className="mt-1 text-[11px] text-paper-muted dark:text-carbon-muted tracking-tight font-mono">
          {specItems.map((item, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="mx-1.5 opacity-60">·</span>}
              <span>{item}</span>
            </React.Fragment>
          ))}
        </p>
      )}

      {/* Artist Note / Description: only render if genuinely present in CMS */}
      {hasDescription && (
        <p className="mt-2 font-serif italic text-xs sm:text-sm text-paper-text/85 dark:text-carbon-text/85 leading-snug line-clamp-3">
          "{description!.trim()}"
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
