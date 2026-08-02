/**
 * BlurhashCanvas Component
 * 
 * Progressive image loader component. Decodes 32x32 Blurhash pixels onto an overlay canvas,
 * checking img.complete and onLoad/onError events to guarantee smooth image transitions
 * without getting stuck.
 */

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
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

  // Initialize as false to guarantee 100% hydration match between server HTML and initial client render
  const [loaded, setLoaded] = useState<boolean>(false);

  const fitClass = objectFit === 'contain' ? 'object-contain' : 'object-cover';

  // Check element completion status synchronously before browser layout paint
  useLayoutEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [src]);

  // Reset loaded state when src changes
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    } else {
      setLoaded(false);
    }
  }, [src]);

  // Decode Blurhash string onto 32x32 canvas ONLY if image isn't already loaded
  useEffect(() => {
    if (loaded || !blurhash || !canvasRef.current || blurhash.length < 5) return;
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
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
      setLoaded(true);
    }
  }, [blurhash, src, loaded]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Main High-Resolution Image (always mounted to start downloading) */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={loading}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={`w-full h-full ${fitClass} block`}
      />

      {/* BlurHash Canvas Overlay (always in DOM when blurhash string exists to prevent hydration DOM mismatches) */}
      {blurhash && blurhash.length >= 5 && (
        <canvas
          ref={canvasRef}
          width={32}
          height={32}
          className={`absolute inset-0 w-full h-full ${fitClass} transition-opacity duration-500 ease-out pointer-events-none z-10 ${
            loaded ? 'opacity-0' : 'opacity-100'
          }`}
          aria-hidden="true"
        />
      )}
    </div>
  );
};
