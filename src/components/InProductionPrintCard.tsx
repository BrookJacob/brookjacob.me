/**
 * @file src/components/InProductionPrintCard.tsx
 * @description In-Production Artwork Card displayed as the first item in the printmaking gallery feed.
 * 
 * Features:
 * - Fits seamlessly into the ArtworkGalleryFeed 3-column / 2-column responsive grid.
 * - Distinctive warm amber/studio terracotta outline with ambient top glow.
 * - Multi-image preview toggle (Original Photo vs. Quantized Linocut Reduction Preview).
 * - Real-time final vote tally display synced with Firestore.
 * - Editorial studio progress callout detailing reduction block carving status.
 */

import React, { useState, useEffect } from 'react';
import { BlurhashCanvas } from './BlurhashCanvas';
import type { PotentialPrint } from '../lib/potentialPrints';
import { subscribeToPrintVoteCount } from '../lib/voting';

export interface InProductionPrintCardProps {
  print: PotentialPrint;
}

export const InProductionPrintCard: React.FC<InProductionPrintCardProps> = ({ print }) => {
  const [activeImageTab, setActiveImageTab] = useState<'original' | 'quantized'>(
    print.quantizedImage?.url ? 'quantized' : 'original'
  );
  const [voteCount, setVoteCount] = useState<number>(print.voteCount || 0);

  // Subscribe to real-time Firestore vote count updates
  useEffect(() => {
    const unsubscribe = subscribeToPrintVoteCount(print.id, (count) => {
      setVoteCount(count);
    });
    return () => unsubscribe();
  }, [print.id]);

  const hasQuantized = !!print.quantizedImage?.url;
  const currentAsset = activeImageTab === 'quantized' && hasQuantized
    ? print.quantizedImage
    : print.image;
  const currentImageUrl = currentAsset?.url;
  const currentBlurhash = currentAsset?.blurhash;

  return (
    <article className="group relative flex flex-col bg-paper-bg dark:bg-carbon-bg border border-paper-border dark:border-carbon-border hover:border-paper-accent dark:hover:border-carbon-accent rounded-xl overflow-hidden focus-tactile transition-all shadow-xs">
      {/* Artwork Image Container (matches completed prints aspect-[4/5]) */}
      <div className="block overflow-hidden relative aspect-[4/5] bg-paper-border/20 dark:bg-carbon-border/20">
        {currentImageUrl ? (
          <BlurhashCanvas
            key={`${print.id}-${activeImageTab}`}
            src={currentImageUrl}
            alt={print.title}
            blurhash={currentBlurhash}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-paper-muted dark:text-carbon-muted text-xs font-mono">
            No Image Preview
          </div>
        )}

        {/* Quantized / Original Toggle Bar */}
        {hasQuantized && (
          <div className="absolute top-3 left-3 right-3 flex justify-center gap-1.5 p-1 bg-black/65 backdrop-blur-md rounded-lg z-20 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setActiveImageTab('original')}
              className={`px-2.5 py-0.5 rounded transition-all ${activeImageTab === 'original'
                ? 'bg-white text-neutral-900 font-semibold shadow-sm'
                : 'text-neutral-300 hover:text-white'
                }`}
            >
              Original
            </button>
            <button
              type="button"
              onClick={() => setActiveImageTab('quantized')}
              className={`px-2.5 py-0.5 rounded transition-all ${activeImageTab === 'quantized'
                ? 'bg-paper-accent dark:bg-carbon-accent text-white font-semibold shadow-sm'
                : 'text-neutral-300 hover:text-white'
                }`}
            >
              Quantized
            </button>
          </div>
        )}
      </div>

      {/* Content & Metadata Footer */}
      <div className="p-5 flex flex-col flex-grow justify-between">
        <div>
          {/* Technique / Status Tag */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-paper-accent dark:text-carbon-accent font-mono">
              On the Carving Bench
            </span>
          </div>

          {/* Print Title */}
          <h3 className="font-serif text-xl font-bold text-paper-text dark:text-carbon-text mt-1">
            {print.title}
          </h3>

          {/* Explainer / Studio Note */}
          <p className="mt-2 text-xs sm:text-sm text-paper-muted dark:text-carbon-muted font-serif leading-relaxed">
            {print.productionNote
              ? print.productionNote
              : 'Currently moving through block carving and test proofs in the studio.'}
          </p>
        </div>

        {/* Edition metadata snippet */}
        <div className="mt-4 pt-3 border-t border-paper-border/60 dark:border-carbon-border/60 flex items-center justify-between text-xs text-paper-muted dark:text-carbon-muted font-mono">
          <span className="text-[11px] text-paper-muted dark:text-carbon-muted">Work in Progress</span>
        </div>
      </div>
    </article>
  );
};

export default InProductionPrintCard;
