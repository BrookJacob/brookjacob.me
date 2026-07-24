/**
 * WebsiteHoverCard Component (Radix UI Primitive)
 * 
 * Interactive hover card built with @radix-ui/react-hover-card for byline links.
 * Features a timed rotating image carousel, accessible clickable target link,
 * domain badge, and design system integration for paper/carbon themes.
 * 
 * @component
 */

import React, { useState, useEffect } from 'react';
import * as HoverCard from '@radix-ui/react-hover-card';

export interface WebsiteHoverCardProps {
  href: string;
  label: string;
  title: string;
  description: string;
  domain: string;
  images: string[];
  accentColor?: 'blue' | 'accent';
  className?: string;
}

export const WebsiteHoverCard: React.FC<WebsiteHoverCardProps> = ({
  href,
  label,
  title,
  description,
  domain,
  images = [],
  accentColor = 'accent',
  className = '',
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [imageErrorMap, setImageErrorMap] = useState<Record<number, boolean>>({});

  // Auto-rotating timer when the hover card is open
  useEffect(() => {
    if (!isOpen || images.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, 2800);

    return () => clearInterval(interval);
  }, [isOpen, images.length]);

  // Reset active index when closed
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setActiveIndex(0);
    }
  };

  const handleImageError = (index: number) => {
    setImageErrorMap((prev) => ({ ...prev, [index]: true }));
  };

  const isBlue = accentColor === 'blue';
  const decorationColor = isBlue ? 'decoration-blue-500' : 'decoration-paper-accent dark:decoration-carbon-accent';
  const badgeColor = isBlue
    ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20'
    : 'bg-paper-accent/10 text-paper-accent dark:text-carbon-accent border-paper-accent/20';

  return (
    <HoverCard.Root openDelay={150} closeDelay={200} onOpenChange={handleOpenChange}>
      <HoverCard.Trigger asChild>
        <span
          className={`inline-block underline underline-offset-4 decoration-dotted ${decorationColor} hover:text-paper-text dark:hover:text-carbon-text transition-colors font-medium cursor-pointer ${className}`}
        >
          {label}
        </span>
      </HoverCard.Trigger>

      <HoverCard.Portal>
        <HoverCard.Content
          sideOffset={8}
          align="center"
          className="z-50 w-80 rounded-xl bg-paper-bg dark:bg-carbon-bg border border-paper-border dark:border-carbon-border p-4 shadow-2xl transition-all duration-200 animate-in fade-in-0 zoom-in-95"
        >
          {/* Top Info Header */}
          <div className="flex items-center justify-between mb-3">
            <span className={`text-[11px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${badgeColor}`}>
              {domain}
            </span>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-paper-muted dark:text-carbon-muted hover:text-paper-text dark:hover:text-carbon-text flex items-center gap-1 transition-colors"
            >
              <span>Visit</span>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          {/* Rotating Image Carousel Container */}
          <div className="relative w-full h-44 rounded-lg overflow-hidden border border-paper-border/60 dark:border-carbon-border/60 bg-paper-border/20 dark:bg-carbon-border/20 mb-3 group">
            {images.length > 0 ? (
              images.map((src, index) => {
                const hasError = imageErrorMap[index];
                const isActive = index === activeIndex;

                return (
                  <div
                    key={src || index}
                    className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                      isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                  >
                    {!hasError ? (
                      <img
                        src={src}
                        alt={`${title} preview ${index + 1}`}
                        className="w-full h-full object-cover object-top"
                        onError={() => handleImageError(index)}
                      />
                    ) : (
                      /* Fallback visually striking canvas preview */
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-paper-border/30 to-paper-border/10 dark:from-carbon-border/30 dark:to-carbon-border/10">
                        <span className="font-serif text-sm font-bold text-paper-text dark:text-carbon-text">
                          {title}
                        </span>
                        <span className="text-xs text-paper-muted dark:text-carbon-muted mt-1 font-mono">
                          {domain}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-paper-border/30 to-paper-border/10 dark:from-carbon-border/30 dark:to-carbon-border/10">
                <span className="font-serif text-sm font-bold text-paper-text dark:text-carbon-text">
                  {title}
                </span>
                <span className="text-xs text-paper-muted dark:text-carbon-muted mt-1 font-mono">
                  {domain}
                </span>
              </div>
            )}

            {/* Carousel Indicator Dots */}
            {images.length > 1 && (
              <div className="absolute bottom-2.5 left-0 right-0 z-20 flex justify-center items-center gap-1.5 pointer-events-none">
                {images.map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === activeIndex
                        ? 'w-5 bg-paper-text dark:bg-carbon-text'
                        : 'w-1.5 bg-paper-text/40 dark:bg-carbon-text/40'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Description & Link Title */}
          <div>
            <h4 className="font-serif text-sm font-bold text-paper-text dark:text-carbon-text leading-tight mb-1">
              {title}
            </h4>
            <p className="text-xs text-paper-muted dark:text-carbon-muted leading-normal">
              {description}
            </p>
          </div>

          {/* Radix Pointer Arrow */}
          <HoverCard.Arrow className="fill-paper-border dark:fill-carbon-border" />
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
};

export default WebsiteHoverCard;
