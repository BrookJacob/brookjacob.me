/**
 * BlurhashCanvas Component
 * 
 * Progressive image loader component. Decodes 32x32 Blurhash pixels onto an overlay canvas,
 * checking img.complete and onLoad/onError events to guarantee smooth image transitions
 * without getting stuck.
 */

import React, { useEffect, useRef, useState } from 'react';
import { decode } from 'blurhash';

export interface BlurhashCanvasProps {
  /** Blurhash string (e.g. "LKO2?U%m~qj[f6f6f6f6_3j[ayj[") */
  blurhash?: string;
  /** Full resolution image CDN URL */
  src: string;
  /** Accessible image description */
  alt: string;
  /** Additional CSS class names */
  className?: string;
  /** Image loading mode */
  loading?: 'lazy' | 'eager';
  /** Object fit sizing mode */
  objectFit?: 'contain' | 'cover';
}

// Global in-memory cache of images that have successfully loaded in the current browser session.
// Persists across client-side page transitions and back navigation.
const LOADED_IMAGE_CACHE = new Set<string>();

function isImageCached(src: string): boolean {
  if (typeof window === 'undefined' || !src) return false;
  return LOADED_IMAGE_CACHE.has(src);
}

export const BlurhashCanvas: React.FC<BlurhashCanvasProps> = ({
  blurhash,
  src,
  alt,
  className = '',
  loading = 'lazy',
  objectFit = 'cover',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // If this image already loaded earlier in this session, initialize loaded directly as true
  const [loaded, setLoaded] = useState<boolean>(() => isImageCached(src));

  const fitClass = objectFit === 'contain' ? 'object-contain' : 'object-cover';

  const markLoaded = () => {
    if (src) LOADED_IMAGE_CACHE.add(src);
    setLoaded(true);
  };

  // Sync loaded state when src changes or if already cached in browser image memory
  useEffect(() => {
    if (isImageCached(src)) {
      setLoaded(true);
      return;
    }
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      markLoaded();
    }
  }, [src]);

  // Decode Blurhash string onto 32x32 canvas ONLY if image isn't already loaded
  useEffect(() => {
    if (loaded || isImageCached(src) || !blurhash || !canvasRef.current || blurhash.length < 5) return;
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      markLoaded();
      return;
    }
    try {
      const pixels = decode(blurhash, 32, 32);
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const imageData = ctx.createImageData(32, 32);
        imageData.data.set(pixels);
        ctx.putImageData(imageData, 0, 0);
      }
    } catch (error) {
      console.warn('Could not decode Blurhash string:', blurhash, error);
      markLoaded();
    }
  }, [blurhash, src, loaded]);

  const alreadyCached = isImageCached(src);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Main High-Resolution Image */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        onLoad={markLoaded}
        onError={markLoaded}
        className={`w-full h-full ${fitClass} block`}
      />

      {/* BlurHash Canvas Overlay: Omitted entirely if image is already cached to prevent reload flashing */}
      {blurhash && blurhash.length >= 5 && !alreadyCached && (
        <canvas
          ref={canvasRef}
          width={32}
          height={32}
          className={`absolute inset-0 w-full h-full ${fitClass} transition-opacity duration-300 ease-out pointer-events-none z-10 ${
            loaded ? 'opacity-0' : 'opacity-100'
          }`}
          aria-hidden="true"
        />
      )}
    </div>
  );
};
