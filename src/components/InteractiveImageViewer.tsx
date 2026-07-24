/**
 * InteractiveImageViewer Component
 * 
 * In-page interactive image viewer component built directly into artwork detail pages.
 * Replaces popup modals with inline pan & zoom capabilities (zoom buttons, wheel zoom, drag panning)
 * while ensuring the entire image remains 100% visible (contained) inside the viewport.
 * 
 * @component
 */

import React, { useState, useRef } from 'react';
import { BlurhashCanvas } from './BlurhashCanvas';

export interface InteractiveImageViewerProps {
  src: string;
  alt: string;
  blurhash?: string;
  title?: string;
}

export const InteractiveImageViewer: React.FC<InteractiveImageViewerProps> = ({
  src,
  alt,
  blurhash,
  title = 'Artwork Detail',
}) => {
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

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
    // Only intercept wheel zoom if hovering over container
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
    <div className="flex flex-col gap-2 w-full">
      {/* Top Toolbar Controls: Zoom In, Zoom Out, Percentage Readout & Reset */}
      <div className="flex items-center justify-between px-3 py-2 bg-paper-bg dark:bg-carbon-bg border border-paper-border dark:border-carbon-border rounded-xl text-xs font-mono">
        <span className="text-paper-muted dark:text-carbon-muted font-semibold hidden sm:inline">
          Interactive Print View
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

      {/* Main Image Viewport Area: Image is 100% contained and constrained to screen height */}
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
        className={`relative w-full h-[55vh] sm:h-[62vh] max-h-[580px] overflow-hidden rounded-xl border border-paper-border dark:border-carbon-border bg-paper-border/20 dark:bg-carbon-border/20 flex items-center justify-center p-2 select-none touch-none ${
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
            src={src}
            alt={alt}
            blurhash={blurhash}
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
    </div>
  );
};

export default InteractiveImageViewer;
