/**
 * LightboxModal Component (Radix UI Primitive + Pan & Zoom Engine)
 * 
 * An accessible client-side image zoom lightbox component built on Radix UI Dialog primitives.
 * Constrains initial print page view to fit within viewport height without scrolling.
 * Features an interactive Pan & Zoom engine (zoom in/out buttons, mouse wheel zoom, and click-drag panning)
 * for inspecting high-res printmaking details.
 */

import React, { useState, useRef, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { BlurhashCanvas } from './BlurhashCanvas';

export interface LightboxModalProps {
  /** High-resolution image URL to render inside the expanded modal viewport */
  src: string;
  /** Accessible image description text */
  alt: string;
  /** Optional Blurhash string for smooth progressive image preview */
  blurhash?: string;
  /** Optional artwork title to render in accessible dialog header */
  title?: string;
  /** Artwork technique details rendered as subtitle */
  technique?: string;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  src,
  alt,
  blurhash,
  title = 'Artwork Detail Zoom',
  technique,
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Reset scale and position when modal closes or opens
  useEffect(() => {
    if (!open) {
      resetZoom();
    }
  }, [open]);

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

  // Mouse wheel zoom inside modal
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

  // Drag-to-pan event handlers
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
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {/* Interactive Trigger: Fits entirely within screen viewport without scrolling */}
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label={`Enlarge artwork: ${title}`}
          className="group relative flex items-center justify-center w-full max-h-[65vh] sm:max-h-[70vh] overflow-hidden rounded-xl border border-paper-border dark:border-carbon-border bg-paper-border/20 dark:bg-carbon-border/20 p-2 focus:outline-none focus-tactile cursor-zoom-in"
        >
          <BlurhashCanvas
            src={src}
            alt={alt}
            blurhash={blurhash}
            className="max-h-[62vh] sm:max-h-[66vh] w-auto max-w-full object-contain rounded-lg transition-transform duration-500 ease-out group-hover:scale-[1.02]"
          />
          {/* Visual Overlay hint */}
          <div className="absolute inset-0 bg-paper-text/10 dark:bg-carbon-text/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 pointer-events-none">
            <span className="bg-paper-bg/95 dark:bg-carbon-bg/95 text-paper-text dark:text-carbon-text text-xs uppercase font-mono font-semibold tracking-wider px-3.5 py-2 rounded-lg shadow-lg border border-paper-border dark:border-carbon-border flex items-center gap-2">
              <svg className="w-4 h-4 text-paper-accent dark:text-carbon-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
              </svg>
              <span>Click for Full Pan &amp; Zoom</span>
            </span>
          </div>
        </button>
      </Dialog.Trigger>

      {/* Accessible Portal Container */}
      <Dialog.Portal>
        {/* Backdrop Overlay */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md transition-opacity duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Full-Screen Pan & Zoom Modal Content */}
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 h-[92vh] w-[95vw] max-w-6xl translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-paper-bg dark:bg-carbon-bg p-4 sm:p-6 shadow-2xl border border-paper-border dark:border-carbon-border flex flex-col justify-between focus:outline-none transition-all duration-300">
          
          {/* Top Control Bar Header */}
          <div className="flex items-center justify-between border-b border-paper-border dark:border-carbon-border pb-3 shrink-0 gap-4">
            <div>
              <Dialog.Title className="font-serif text-lg sm:text-2xl font-bold text-paper-text dark:text-carbon-text leading-tight">
                {title}
              </Dialog.Title>
              {technique && (
                <Dialog.Description className="text-xs sm:text-sm text-paper-muted dark:text-carbon-muted font-mono">
                  {technique}
                </Dialog.Description>
              )}
            </div>

            {/* Interactive Zoom Controls & Close Button */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1 bg-paper-border/30 dark:bg-carbon-border/30 p-1 rounded-lg border border-paper-border/60 dark:border-carbon-border/60 text-xs font-mono">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={scale <= 1}
                  className="px-2 py-1 rounded bg-paper-bg dark:bg-carbon-bg text-paper-text dark:text-carbon-text hover:bg-paper-border/50 dark:hover:bg-carbon-border/50 disabled:opacity-40 cursor-pointer font-bold"
                  title="Zoom Out"
                >
                  &minus;
                </button>
                <span className="px-2 min-w-[3.5rem] text-center font-semibold select-none">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={scale >= 4}
                  className="px-2 py-1 rounded bg-paper-bg dark:bg-carbon-bg text-paper-text dark:text-carbon-text hover:bg-paper-border/50 dark:hover:bg-carbon-border/50 disabled:opacity-40 cursor-pointer font-bold"
                  title="Zoom In"
                >
                  &#43;
                </button>
                <button
                  type="button"
                  onClick={resetZoom}
                  className="px-2 py-1 ml-1 rounded bg-paper-accent/15 text-paper-accent dark:text-carbon-accent font-semibold hover:bg-paper-accent/25 transition-colors cursor-pointer"
                  title="Reset Zoom"
                >
                  Reset
                </button>
              </div>

              {/* Close Button */}
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="p-2 rounded-lg text-paper-muted hover:text-paper-text dark:text-carbon-muted dark:hover:text-carbon-text hover:bg-paper-border/40 dark:hover:bg-carbon-border/40 transition-colors focus:outline-none cursor-pointer"
                  aria-label="Close high-res lightbox modal"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* Interactive Pan & Zoom Canvas Area */}
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
            className={`relative flex-grow w-full overflow-hidden rounded-xl bg-black/40 flex items-center justify-center select-none touch-none ${
              scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
            }`}
          >
            <div
              className="transition-transform duration-75 ease-out flex items-center justify-center w-full h-full p-2 sm:p-4"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              }}
            >
              <BlurhashCanvas
                src={src}
                alt={alt}
                blurhash={blurhash}
                className="max-h-[75vh] w-auto max-w-full object-contain pointer-events-none rounded shadow-2xl"
              />
            </div>

            {/* Hint Badge for Mobile / Pan Navigation */}
            {scale > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur text-white text-[11px] font-mono px-3 py-1 rounded-full pointer-events-none z-30">
                Drag to Pan • Scroll to Zoom
              </div>
            )}
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default LightboxModal;
