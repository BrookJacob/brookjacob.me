/**
 * InteractiveImageViewer Component
 * 
 * In-page interactive image viewer component built directly into artwork detail pages.
 * Replaces popup modals with inline pan & zoom capabilities (zoom buttons, wheel zoom, drag panning)
 * while allowing users to select and toggle through mainImage and all galleryImages thumbnails.
 * 
 * @component
 */

import React, { useState, useRef } from 'react';
import type { CMSImage } from '../lib/types';
import { BlurhashCanvas } from './BlurhashCanvas';

export interface InteractiveImageViewerProps {
  mainImage: CMSImage;
  galleryImages?: CMSImage[] | null;
  alt: string;
}

export const InteractiveImageViewer: React.FC<InteractiveImageViewerProps> = ({
  mainImage,
  galleryImages,
  alt,
}) => {
  // Combine mainImage and all galleryImages into unified list
  const allImages: CMSImage[] = [
    mainImage,
    ...(galleryImages || []),
  ].filter((img): img is CMSImage => Boolean(img && img.url));

  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const activeImage = allImages[selectedIndex] || mainImage;

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const nextScale = Math.max(prev - 0.5, 1);
      if (nextScale === 1) setPosition({ x: 0, y: 0 });
      return nextScale;
    });
  };

  // Mouse wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(prev + 0.25, 4));
    } else {
      setScale((prev) => {
        const nextScale = Math.max(prev - 0.25, 1);
        if (nextScale === 1) setPosition({ x: 0, y: 0 });
        return nextScale;
      });
    }
  };

  // Mouse drag handlers for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch drag handlers for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale <= 1 || e.touches.length !== 1) return;
    setIsDragging(true);
    setDragStart({
      x: e.touches[0].clientX - position.x,
      y: e.touches[0].clientY - position.y,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || scale <= 1 || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* Top Toolbar Controls: Zoom In, Zoom Out, Percentage Readout & Reset */}
      <div className="flex items-center justify-between px-3 py-2 bg-paper-bg dark:bg-carbon-bg border border-paper-border dark:border-carbon-border rounded-xl text-xs font-mono">
        <span className="text-paper-muted dark:text-carbon-muted font-semibold hidden sm:inline">
          {allImages.length > 1 ? `Image ${selectedIndex + 1} of ${allImages.length}` : 'Interactive Print View'}
        </span>

        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          <div className="flex items-center gap-1 bg-paper-border/30 dark:bg-carbon-border/30 p-1 rounded-lg border border-paper-border/60 dark:border-carbon-border/60">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={scale <= 1}
              className="px-2 py-0.5 rounded bg-paper-bg dark:bg-carbon-bg text-paper-text dark:text-carbon-text hover:bg-paper-border/50 dark:hover:bg-carbon-border/50 disabled:opacity-30 cursor-pointer font-bold transition-colors"
              title="Zoom Out"
            >
              &minus;
            </button>
            <span className="px-2.5 min-w-[3.5rem] text-center font-semibold select-none">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={scale >= 4}
              className="px-2 py-0.5 rounded bg-paper-bg dark:bg-carbon-bg text-paper-text dark:text-carbon-text hover:bg-paper-border/50 dark:hover:bg-carbon-border/50 disabled:opacity-30 cursor-pointer font-bold transition-colors"
              title="Zoom In"
            >
              &#43;
            </button>
          </div>

          <button
            type="button"
            onClick={resetZoom}
            disabled={scale === 1 && position.x === 0 && position.y === 0}
            className="px-3 py-1.5 rounded-lg bg-paper-accent/15 dark:bg-carbon-accent/15 text-paper-accent dark:text-carbon-accent font-semibold hover:bg-paper-accent/25 transition-colors disabled:opacity-40 cursor-pointer"
            title="Reset Zoom & Pan"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main Image Viewport Area: Image is 100% contained */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative w-full h-[50vh] sm:h-[56vh] max-h-[540px] overflow-hidden rounded-xl border border-paper-border dark:border-carbon-border bg-paper-border/20 dark:bg-carbon-border/20 flex items-center justify-center p-2 select-none touch-none ${
          scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
        }`}
      >
        <div
          className="transition-transform duration-75 ease-out flex items-center justify-center w-full h-full"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          }}
        >
          <BlurhashCanvas
            key={activeImage.url}
            src={activeImage.url}
            alt={activeImage.altText || alt}
            blurhash={activeImage.blurhash}
            className="h-full w-full object-contain pointer-events-none rounded"
          />
        </div>

        {/* Pan Hint Overlay when zoomed in */}
        {scale > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-paper-bg/90 dark:bg-carbon-bg/90 backdrop-blur text-paper-text dark:text-carbon-text text-[11px] font-mono px-3 py-1 rounded-full border border-paper-border dark:border-carbon-border pointer-events-none z-20 shadow-md">
            Drag to Pan • Scroll to Zoom
          </div>
        )}
      </div>

      {/* Thumbnail Selector Strip for mainImage + galleryImages */}
      {allImages.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
          {allImages.map((img, idx) => (
            <button
              key={img.url || idx}
              type="button"
              onClick={() => {
                setSelectedIndex(idx);
                resetZoom();
              }}
              className={`relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                selectedIndex === idx
                  ? 'border-paper-accent dark:border-carbon-accent ring-2 ring-paper-accent/30 scale-105 z-10'
                  : 'border-paper-border dark:border-carbon-border opacity-60 hover:opacity-100'
              }`}
              title={`View ${idx === 0 ? 'Main Artwork' : `Gallery Detail #${idx}`}`}
            >
              <img
                src={img.url}
                alt={`${alt} view ${idx + 1}`}
                className="w-full h-full object-cover pointer-events-none"
              />
              <span className="absolute bottom-0 right-0 bg-black/75 text-white text-[9px] font-mono font-semibold px-1 py-0.2 rounded-tl">
                {idx === 0 ? 'Main' : `#${idx}`}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default InteractiveImageViewer;
