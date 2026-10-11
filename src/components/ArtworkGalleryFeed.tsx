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
import { getPrintUrl } from '../lib/urls';

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
    <div>
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-6">
        {/* Featured First Card: Print Currently Moving Through Production */}
        {inProductionPrint && (
          <InProductionPrintCard print={inProductionPrint} />
        )}

        {visibleArtworks.map((artwork, index) => {
          const hasGallery = Boolean(artwork.galleryImages && artwork.galleryImages.length > 0);
          const secondaryImage = hasGallery ? artwork.galleryImages![0] : null;
          const printUrl = getPrintUrl(artwork.slug);

          return (
            <article
              key={artwork.id || artwork.slug}
              className="group relative flex flex-col bg-paper-bg dark:bg-carbon-bg border border-paper-border dark:border-carbon-border rounded-xl overflow-hidden focus-tactile transition-all"
            >
              {/* Medium Bleed Artwork Image Header with Timed Hover Cross-Fade */}
              <a
                href={printUrl}
                onClick={handleLinkClick}
                className="block overflow-hidden relative aspect-[4/5] bg-paper-border/20 dark:bg-carbon-border/20"
              >
                {/* Primary Main Cover Image */}
                <BlurhashCanvas
                  src={artwork.coverImage.url}
                  alt={artwork.coverImage.altText || artwork.title}
                  blurhash={artwork.coverImage.blurhash}
                  className="w-full h-full object-cover absolute inset-0 z-10"
                  loading={index < 4 ? 'eager' : 'lazy'}
                />

                {/* Secondary Gallery Detail Image (Overlay Layer: z-20, lazy-loaded on hover) */}
                {secondaryImage && (
                  <img
                    src={secondaryImage.url}
                    alt={secondaryImage.altText || `${artwork.title} gallery detail`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-in-out z-20 pointer-events-none"
                  />
                )}

                {/* Subtle Year Tag & Gallery Count overlay */}
                <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 pointer-events-none">
                  {hasGallery && (
                    <span className="bg-paper-bg/90 dark:bg-carbon-bg/90 backdrop-blur text-paper-accent dark:text-carbon-accent text-[10px] font-mono font-semibold px-2 py-0.5 rounded border border-paper-border/60 dark:border-carbon-border/60">
                      +{artwork.galleryImages!.length} views
                    </span>
                  )}
                  <span className="bg-paper-bg/90 dark:bg-carbon-bg/90 backdrop-blur text-paper-text dark:text-carbon-text text-xs font-semibold px-2.5 py-1 rounded border border-paper-border/60 dark:border-carbon-border/60">
                    {artwork.year}
                  </span>
                </div>
              </a>

              {/* Content & Metadata Footer */}
              <div className="p-5 flex flex-col flex-grow justify-between">
                <div>
                  {/* Technique Badge */}
                  <span className="text-xs font-medium uppercase tracking-wider text-paper-accent dark:text-carbon-accent">
                    {artwork.technique || 'Reduction Linocut Print'}
                  </span>
                  {/* Title */}
                  <h3 className="font-serif text-xl font-bold text-paper-text dark:text-carbon-text mt-1 group-hover:text-paper-accent dark:group-hover:text-carbon-accent transition-colors">
                    <a href={printUrl} onClick={handleLinkClick}>
                      {artwork.title}
                    </a>
                  </h3>
                </div>

                {/* Edition metadata snippet */}
                <div className="mt-4 pt-3 border-t border-paper-border/60 dark:border-carbon-border/60 flex items-center justify-between text-xs text-paper-muted dark:text-carbon-muted">
                  <span>Edition: {artwork.editionSize || artwork.editionTotal}</span>
                  <a
                    href={printUrl}
                    onClick={handleLinkClick}
                    className="group-hover:translate-x-1 transition-all inline-flex items-center gap-1 font-semibold text-paper-text dark:text-carbon-text hover:text-paper-accent dark:hover:text-carbon-accent"
                  >
                    Inspect &rarr;
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* Infinite Scroll Sentinel */}
      {visibleCount < artworks.length && (
        <div
          ref={sentinelRef}
          className="w-full py-8 flex items-center justify-center text-xs font-mono text-paper-muted dark:text-carbon-muted"
          aria-hidden="true"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-paper-accent dark:bg-carbon-accent animate-ping" />
            <span>Loading additional editions...</span>
          </div>
        </div>
      )}
    </div>
  );
};
