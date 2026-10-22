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
    <article className="group relative flex flex-col w-full text-left">
      {/* Artwork Image Container: Displays uncropped image in full */}
      <div className="block overflow-hidden relative h-[380px] sm:h-[440px] md:h-[480px] w-full flex items-center justify-center bg-transparent">
        {currentImageUrl ? (
          <BlurhashCanvas
            key={`${print.id}-${activeImageTab}`}
            src={currentImageUrl}
            alt={print.title}
            blurhash={currentBlurhash}
            className="w-full h-full object-contain"
            objectFit="contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-paper-muted dark:text-carbon-muted text-xs font-mono">
            No Image Preview
          </div>
        )}

        {/* Quantized / Original Toggle Bar */}
        {hasQuantized && (
          <div className="absolute top-3 left-3 right-3 flex justify-center gap-1.5 p-1 bg-black/75 backdrop-blur-md rounded z-20 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setActiveImageTab('original')}
              className={`px-2.5 py-0.5 rounded transition-colors cursor-pointer ${activeImageTab === 'original'
                ? 'bg-white text-neutral-900 font-semibold'
                : 'text-neutral-300 hover:text-white'
                }`}
            >
              Original
            </button>
            <button
              type="button"
              onClick={() => setActiveImageTab('quantized')}
              className={`px-2.5 py-0.5 rounded transition-colors cursor-pointer ${activeImageTab === 'quantized'
                ? 'bg-paper-accent dark:bg-carbon-accent text-white font-semibold'
                : 'text-neutral-300 hover:text-white'
                }`}
            >
              Quantized
            </button>
          </div>
        )}
      </div>

      {/* Wall Label & Studio Inscription */}
      <div className="mt-4 pt-1 font-mono text-left leading-relaxed">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h3 className="font-serif text-lg sm:text-xl font-bold text-paper-text dark:text-carbon-text tracking-tight">
            {print.title}
            <span className="font-normal font-sans text-xs text-paper-muted dark:text-carbon-muted ml-2">
              In Production
            </span>
          </h3>

          <span
            className="font-handwriting text-base sm:text-lg text-paper-accent dark:text-carbon-accent tracking-wide"
            title="Active on carving bench"
          >
            work in progress
          </span>
        </div>

        <p className="mt-1 text-[11px] text-paper-accent dark:text-carbon-accent font-mono uppercase tracking-wider font-semibold">
          On the Carving Bench {voteCount > 0 ? `· ${voteCount} community votes` : ''}
        </p>

        {print.productionNote && print.productionNote.trim().length > 0 && (
          <p className="mt-2 font-serif italic text-xs sm:text-sm text-paper-text/85 dark:text-carbon-text/85 leading-snug">
            "{print.productionNote.trim()}"
          </p>
        )}

        <div className="mt-3">
          <span className="font-mono text-[11px] text-paper-muted dark:text-carbon-muted">
            Reduction block in progress &rarr;
          </span>
        </div>
      </div>
    </article>
  );
};

export default InProductionPrintCard;
