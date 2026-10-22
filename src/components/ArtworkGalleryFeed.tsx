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
  getPrintEdition,
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
      {/* Cohesive, Balanced 2-Column Exhibition Gallery */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-x-12 lg:gap-x-16 gap-y-16 lg:gap-y-24 items-start mt-10">
        {/* Featured First: Print Currently Moving Through Production */}
        {inProductionPrint && (
          <div className="col-span-1">
            <InProductionPrintCard print={inProductionPrint} />
          </div>
        )}

        {visibleArtworks.map((artwork, index) => {
          const printUrl = getPrintUrl(artwork.slug);
          const description = getPrintOrigin(artwork);
          const edition = getPrintEdition(artwork);
          const medium = formatPrintMedium(artwork);
          const paper = formatPrintPaper(artwork);
          const dimensions = formatPrintDimensions(artwork);

          return (
            <article
              key={artwork.id || artwork.slug}
              className="group relative flex flex-col w-full text-left col-span-1"
            >
              {/* Artwork Image Container: Displays uncropped image in full width/height */}
              <a
                href={printUrl}
                onClick={handleLinkClick}
                className="block overflow-hidden relative h-[380px] sm:h-[440px] md:h-[480px] w-full flex items-center justify-center bg-transparent"
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

              {/* Museum Wall Label (Strictly renders only genuine non-null CMS data) */}
              <ArtworkWallLabel
                title={artwork.title}
                year={artwork.year}
                edition={edition}
                medium={medium}
                paper={paper}
                dimensions={dimensions}
                description={description}
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
