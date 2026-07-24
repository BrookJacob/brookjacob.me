/**
 * ProcessPhotosCarousel Component
 * 
 * Interactive studio process photos carousel component for MuseumPlacard.
 * Renders behind-the-scenes linoleum carving, ink rolling, and layer reduction photos.
 * 
 * @component
 */

import React, { useState } from 'react';
import type { CMSImage } from '../lib/types';
import { BlurhashCanvas } from './BlurhashCanvas';

export interface ProcessPhotosCarouselProps {
  images: CMSImage[];
}

export const ProcessPhotosCarousel: React.FC<ProcessPhotosCarouselProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  if (!images || images.length === 0) return null;

  const currentImage = images[currentIndex] || images[0];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="mt-6 pt-6 border-t border-paper-border dark:border-carbon-border">
      <div className="flex items-center justify-between mb-3">
        <h3 class="text-xs uppercase tracking-wider font-semibold text-paper-muted dark:text-carbon-muted font-mono flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-paper-accent dark:text-carbon-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h0.93a2 2 0 001.664-.89l0.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l0.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          </svg>
          <span>Studio &amp; Process Photos</span>
        </h3>
        <span className="text-[10px] font-mono text-paper-muted dark:text-carbon-muted">
          {currentIndex + 1} / {images.length}
        </span>
      </div>

      {/* Main Process Image Display Frame */}
      <div className="relative group w-full aspect-[4/3] rounded-xl overflow-hidden border border-paper-border dark:border-carbon-border bg-paper-border/20 dark:bg-carbon-border/20">
        <BlurhashCanvas
          key={currentImage.url}
          src={currentImage.url}
          alt={currentImage.altText || `Studio process photo ${currentIndex + 1}`}
          blurhash={currentImage.blurhash}
          className="w-full h-full object-cover"
        />

        {/* Carousel Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 text-white opacity-80 group-hover:opacity-100 hover:bg-black/90 transition-all cursor-pointer z-10"
              aria-label="Previous process photo"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 text-white opacity-80 group-hover:opacity-100 hover:bg-black/90 transition-all cursor-pointer z-10"
              aria-label="Next process photo"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Carousel Dot Indicator Bar */}
      {images.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-2.5">
          {images.map((img, idx) => (
            <button
              key={img.url || idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                currentIndex === idx
                  ? 'w-5 bg-paper-accent dark:bg-carbon-accent'
                  : 'w-1.5 bg-paper-border dark:bg-carbon-border hover:bg-paper-muted'
              }`}
              aria-label={`Jump to process photo ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProcessPhotosCarousel;
