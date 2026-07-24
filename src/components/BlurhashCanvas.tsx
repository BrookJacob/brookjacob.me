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
  const [loaded, setLoaded] = useState<boolean>(false);

  const fitClass = objectFit === 'contain' ? 'object-contain' : 'object-cover';

  // Reset loaded state and check if image is already cached/complete when src changes
  useEffect(() => {
    setLoaded(false);
    if (imgRef.current && imgRef.current.complete) {
      setLoaded(true);
    }
  }, [src]);

  // Decode Blurhash string onto 32x32 canvas
  useEffect(() => {
    if (!blurhash || !canvasRef.current || blurhash.length < 5) return;
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
  }, [blurhash, src]);

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

      {/* BlurHash Canvas Overlay (fades out when image loads or finishes) */}
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
