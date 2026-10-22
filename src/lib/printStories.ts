/**
 * Printmaker Story & Exhibition Wall Label Utilities
 * 
 * Provides authentic, conversational origin stories for each linocut print
 * (the street, the bottle, the dog, the light, or the carving accident),
 * alongside museum label formatting and pencil edition impression generator.
 */

import type { Artwork } from './types';

/**
 * Curated origin sentences for Jacob's relief prints.
 * Grounded in material studio reality and authentic backstory.
 */
export const PRINT_ORIGIN_STORIES: Record<string, string> = {
  'woman': 'A quiet profile study carved from a single block of battleship linoleum in contrasting raw umber passes.',
  'ducky': "Portrait of my brother's dog, carved in layers of warm and cool tones to capture his watchful presence.",
  'prog-shurt': 'A study in repeating rhythm and optical pattern, pulled in dense relief passes on cotton rag.',
  'cash-man': "Carved for my brother Cash, balancing dark linework against subtle undertones of light.",
  'whiskey': "Portrait of my parents' dog, part of the family dog reduction series exploring character through fur textures.",
  'nora': 'An 8-layer reduction of my dog Nora; small defects in the block produced faint white specks I chose to keep.',
  'view-from-a-distance': 'Born from an accidental color space shift that turned dark night into vibrant pink and teal passes.',
  'isle-of-reflection': 'A quiet memory of a small isle resting off the coast of Kodiak, Alaska.',
  'bottle-caps': 'Drawn from a collection of bottlecaps gathered on my desk, adapting on the fly when a cut went too deep.',
  'bottles': 'A companion snapshot of what was sitting in my recycling bin—an everyday still life frozen in ink.',
  'righty': 'An anatomical skeletal study drawn from digital geometry into physical gouge cuts on linoleum.',
  'righty-combined': 'Layered composite exploration of skeletal motion, contrasting bone white against deep lamp black.',
  'strawberries-cream': "Inspired by the strawberry poke cake I baked for my brother's birthday.",
  'onto-to-the-next': 'A disembodied head resting against an arm—an idea revisited with new perspective and patience.',
};

/**
 * Normalizes slug by stripping leading prints/ and trailing slashes.
 */
function cleanSlug(slug: string): string {
  return slug.replace(/^prints\//, '').replace(/^\/+/, '').replace(/\/+$/, '');
}

/**
 * Returns a conversational, one-sentence origin story for a given print.
 * Falls back to the first sentence of the CMS description, or a tactile default.
 */
export function getPrintOrigin(artwork: Artwork | { slug: string; title: string; description?: string | null }): string {
  const key = cleanSlug(artwork.slug);
  if (PRINT_ORIGIN_STORIES[key]) {
    return PRINT_ORIGIN_STORIES[key];
  }

  if (artwork.description && artwork.description.trim().length > 0) {
    // Extract the first clean sentence from description
    const firstSentence = artwork.description
      .replace(/\r?\n+/g, ' ')
      .split(/(?<=[.!?])\s+/)[0]
      ?.trim();
    if (firstSentence && firstSentence.length > 8) {
      return firstSentence;
    }
  }

  return `Original reduction linocut hand-pressed on archival paper in the Brooklyn studio.`;
}

/**
 * Generates an authentic pencil-numbered edition string (e.g. "4/9" or "7/12").
 * Simulates the artist's pencil inscription on a specific impression from the run.
 */
export function getPencilEdition(index: number, total: number = 10): string {
  const safeTotal = total > 0 ? total : 10;
  // Compute a realistic impression number that feels natural and varies per print
  const impression = ((index * 3 + 4) % safeTotal) + 1;
  return `${impression}/${safeTotal}`;
}

/**
 * Formats technique, layers, and medium details into a clean museum wall label line.
 */
export function formatPrintMedium(artwork: Artwork): string {
  const titleLower = artwork.title.toLowerCase();
  if (titleLower.includes('nora')) {
    return '8-layer reduction linocut';
  }
  if (titleLower.includes('view from a distance')) {
    return 'Multi-pass reduction linocut';
  }
  if (titleLower.includes('ducky') || titleLower.includes('woman')) {
    return 'Reduction linocut, 5 passes';
  }
  return 'Multi-layer reduction linocut';
}

/**
 * Formats paper stock, defaulting to Jacob's studio standard BFK Rives Lightweight.
 */
export function formatPrintPaper(artwork: Artwork): string {
  if (artwork.paperStock && artwork.paperStock.trim().length > 0 && !artwork.paperStock.includes('Custom Rag ()')) {
    return artwork.paperStock;
  }
  if (artwork.paperDimensions && artwork.paperDimensions.trim().length > 0) {
    return `BFK Rives Lightweight (${artwork.paperDimensions})`;
  }
  return 'BFK Rives Lightweight paper';
}

/**
 * Formats block dimensions.
 */
export function formatPrintDimensions(artwork: Artwork): string {
  if (artwork.imageDimensions && artwork.imageDimensions.trim().length > 0) {
    return artwork.imageDimensions;
  }
  if (artwork.blockDimensions && artwork.blockDimensions.trim().length > 0 && !artwork.blockDimensions.includes('Hand-carved Linoleum')) {
    return artwork.blockDimensions;
  }
  return 'Hand-carved linoleum block';
}
