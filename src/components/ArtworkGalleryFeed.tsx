/**
 * ArtworkGalleryFeed Component
 * 
 * Progressive, infinite-scrolling gallery feed for relief printmaking editions.
 * Batches display to 10 artworks initially and dynamically appends additional batches
 * as the user scrolls into view via IntersectionObserver, preventing network congestion.
 * 
 * Preserves scroll position and visible item count across navigation sessions
 * so returning from a detail page feels immediate and seamless.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Artwork } from '../lib/types';
import type { PotentialPrint } from '../lib/potentialPrints';
import { BlurhashCanvas } from './BlurhashCanvas';
import { InProductionPrintCard } from './InProductionPrintCard';
import { ArtworkWallLabel } from './ArtworkWallLabel';
import { getPrintUrl } from '../lib/urls';
import {
  getPrintOrigin,
  getPencilEdition,
  formatPrintMedium,
  formatPrintPaper,
  formatPrintDimensions,
} from '../lib/printStories';

export interface ArtworkGalleryFeedProps {
  artworks: Artwork[];
  inProductionPrint?: PotentialPrint | null;
  batchSize?: number;
}

const STORAGE_KEY_COUNT = 'printmaker_gallery_visible_count';
const STORAGE_KEY_SCROLL = 'printmaker_gallery_scroll_pos';
const DEFAULT_BATCH_SIZE = 10;

/**
 * Assigns an asymmetric, curated editorial rhythm across a 12-column grid.
 * Breaks repetitive uniform cards by alternating solitary centerpiece prints,
 * staggered height duos with vertical offsets, and wide-format features.
 */
function getGridSpanClass(index: number): string {
  const pattern = index % 6;
  switch (pattern) {
    case 0:
      // Solitary Hero Centerpiece with generous flanking margins
      return 'col-span-1 md:col-span-12 lg:col-span-8 lg:col-start-3';
    case 1:
      // Asymmetric Duo: Left (Wide format)
      return 'col-span-1 md:col-span-7 lg:col-span-7';
    case 2:
      // Asymmetric Duo: Right (Shifted vertically down to break horizontal gridlines)
      return 'col-span-1 md:col-span-5 lg:col-span-5 md:mt-20 lg:mt-28';
    case 3:
      // Solitary Wide Exhibition Print
      return 'col-span-1 md:col-span-12 lg:col-span-10 lg:col-start-2';
    case 4:
      // Reversed Asymmetric Duo: Left (Offset vertically)
      return 'col-span-1 md:col-span-5 lg:col-span-5 md:mt-16 lg:mt-24';
    case 5:
      // Reversed Asymmetric Duo: Right (Wide format)
      return 'col-span-1 md:col-span-7 lg:col-span-7';
    default:
      return 'col-span-1 md:col-span-6';
  }
}

export const ArtworkGalleryFeed: React.FC<ArtworkGalleryFeedProps> = ({
  artworks,
  inProductionPrint,
  batchSize = DEFAULT_BATCH_SIZE,
}) => {
  // Always initialize with batchSize to guarantee 100% hydration match with server HTML
  const [visibleCount, setVisibleCount] = useState<number>(() => Math.min(batchSize, artworks.length));

  const sentinelRef = useRef<HTMLDivElement>(null);

  // After hydration completes, restore saved count from sessionStorage if user previously scrolled further
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY_COUNT);
        if (saved) {
          const count = parseInt(saved, 10);
          if (!isNaN(count) && count > batchSize) {
            setVisibleCount(Math.min(count, artworks.length));
          }
        }
      } catch {
        // Fallback gracefully if sessionStorage is disabled
      }
    }
  }, [artworks.length, batchSize]);

  // Sync visible count to sessionStorage so back-navigation retains rendered cards
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(STORAGE_KEY_COUNT, visibleCount.toString());
      } catch {
        // Ignore quota/access errors
      }
    }
  }, [visibleCount]);

  // Restore scroll position after DOM paints when navigating back from detail page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedScroll = sessionStorage.getItem(STORAGE_KEY_SCROLL);
        if (savedScroll) {
          const scrollY = parseInt(savedScroll, 10);
          if (!isNaN(scrollY) && scrollY > 0) {
            sessionStorage.removeItem(STORAGE_KEY_SCROLL);
            // Wait for DOM layout to settle before restoring scroll
            requestAnimationFrame(() => {
              window.scrollTo({ top: scrollY, behavior: 'instant' });
            });
          }
        }
      } catch {
        // Ignore
      }
    }
  }, []);

  // Save current scroll position before clicking into an individual print
  const handleLinkClick = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(STORAGE_KEY_SCROLL, window.scrollY.toString());
        sessionStorage.setItem(STORAGE_KEY_COUNT, visibleCount.toString());
      } catch {
        // Ignore
      }
    }
  }, [visibleCount]);

  // Observe sentinel to load next batch of prints before user reaches the bottom
  useEffect(() => {
    if (visibleCount >= artworks.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + batchSize, artworks.length));
        }
      },
      {
        rootMargin: '400px 0px', // Trigger 400px ahead for invisible, stutter-free expansion
        threshold: 0,
      }
    );

    const target = sentinelRef.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }
      observer.disconnect();
    };
  }, [visibleCount, artworks.length, batchSize]);

  const visibleArtworks = artworks.slice(0, visibleCount);

  return (
    <div className="w-full">
      {/* Curated Asymmetric Exhibition Grid */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-x-10 gap-y-20 sm:gap-y-32 mt-10 items-start">
        {/* Featured First: Print Currently Moving Through Production */}
        {inProductionPrint && (
          <div className="col-span-1 md:col-span-12 lg:col-span-8 lg:col-start-3 mb-6">
            <InProductionPrintCard print={inProductionPrint} />
          </div>
        )}

        {visibleArtworks.map((artwork, index) => {
          const printUrl = getPrintUrl(artwork.slug);
          const gridSpan = getGridSpanClass(index);
          const originStory = getPrintOrigin(artwork);
          const pencilEdition = getPencilEdition(
            index,
            artwork.editionTotal || parseInt(artwork.editionSize || '10', 10)
          );
          const medium = formatPrintMedium(artwork);
          const paper = formatPrintPaper(artwork);
          const dimensions = formatPrintDimensions(artwork);

          return (
            <article
              key={artwork.id || artwork.slug}
              className={`group relative flex flex-col w-full text-left ${gridSpan}`}
            >
              {/* Unboxed Artwork Image Container with subtle matting */}
              <a
                href={printUrl}
                onClick={handleLinkClick}
                className="block overflow-hidden relative bg-paper-border/15 dark:bg-carbon-border/25 aspect-[4/5] sm:aspect-auto sm:h-[480px] md:h-[540px] flex items-center justify-center p-2 sm:p-4"
              >
                <BlurhashCanvas
                  src={artwork.coverImage.url}
                  alt={artwork.coverImage.altText || artwork.title}
                  blurhash={artwork.coverImage.blurhash}
                  className="w-full h-full object-contain"
                  objectFit="contain"
                  loading={index < 4 ? 'eager' : 'lazy'}
                />
              </a>

              {/* Museum Wall Label */}
              <ArtworkWallLabel
                title={artwork.title}
                year={artwork.year}
                slug={artwork.slug}
                editionTotal={artwork.editionTotal || parseInt(artwork.editionSize || '10', 10)}
                pencilEdition={pencilEdition}
                medium={medium}
                paper={paper}
                dimensions={dimensions}
                originStory={originStory}
                onLinkClick={handleLinkClick}
                printUrl={printUrl}
              />
            </article>
          );
        })}
      </section>

      {/* Infinite Scroll Sentinel (Quiet & understated, without template pulsing spinners or loud messages) */}
      {visibleCount < artworks.length ? (
        <div
          ref={sentinelRef}
          className="w-full py-12 flex items-center justify-center text-xs font-mono text-paper-muted dark:text-carbon-muted"
          aria-hidden="true"
        >
          <span className="opacity-40">···</span>
        </div>
      ) : (
        <div className="w-full py-20 text-center text-xs font-mono text-paper-muted dark:text-carbon-muted opacity-80 border-t border-paper-border/60 dark:border-carbon-border/60 mt-20">
          <span>All {artworks.length} studio editions shown · hand-carved & pressed on archival paper</span>
        </div>
      )}
    </div>
  );
};
