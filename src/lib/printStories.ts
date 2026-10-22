/**
 * Printmaker Wall Label Data Formatting Utilities
 * 
 * Strict data truthfulness: ONLY returns metadata that genuinely exists in CMS.
 * If a field is null, undefined, or empty, returns null so the UI renders NOTHING
 * rather than fabricating placeholder text or numbers.
 */

import type { Artwork } from './types';

/**
 * Returns the genuine artist note or description from the CMS if present.
 * Returns null if no description exists.
 */
export function getPrintOrigin(artwork: Artwork | { description?: string | null }): string | null {
  if (!artwork.description) return null;
  const trimmed = artwork.description.trim();
  if (trimmed.length === 0) return null;
  return trimmed;
}

/**
 * Returns genuine edition size from CMS (e.g. "Ed. 10") if recorded.
 * Returns null if editionTotal is missing or not a positive number.
 */
export function getPrintEdition(artwork: Artwork): string | null {
  const total = artwork.editionTotal || (artwork.editionSize ? parseInt(artwork.editionSize, 10) : null);
  if (total && !isNaN(total) && total > 0) {
    return `ed. ${total}`;
  }
  return null;
}

/**
 * Returns paper stock only if recorded in the CMS.
 * Returns null if absent.
 */
export function formatPrintPaper(artwork: Artwork): string | null {
  const paper = artwork.paperStock || artwork.paperDimensions;
  if (!paper) return null;
  const trimmed = paper.trim();
  if (trimmed.length === 0 || trimmed.toLowerCase().includes('custom rag ()')) return null;
  return trimmed;
}

/**
 * Returns block or image dimensions only if recorded in the CMS.
 * Returns null if absent.
 */
export function formatPrintDimensions(artwork: Artwork): string | null {
  const dims = artwork.imageDimensions || artwork.blockDimensions;
  if (!dims) return null;
  const trimmed = dims.trim();
  if (trimmed.length === 0) return null;
  return trimmed;
}

/**
 * Returns printmaking technique if recorded.
 * Returns null if absent.
 */
export function formatPrintMedium(artwork: Artwork): string | null {
  if (!artwork.technique) return null;
  const trimmed = artwork.technique.trim();
  if (trimmed.length === 0) return null;
  return trimmed;
}
