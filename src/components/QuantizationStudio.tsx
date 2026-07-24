/**
 * QuantizationStudio Component
 * 
 * Interactive JavaScript / React browser studio simulating the Python Image Quantization engine (`main.py`)
 * and GIMP 3.0 `prep_transfer_cumulative.py` plugin.
 * 
 * Features:
 * - HTML5 Canvas 2D K-Means++ Color Quantization (Supports up to 20 inks)
 * - Pinned Custom Colors & Semi-Supervised K-Means (Eyedropper canvas picking)
 * - Cumulative Layer Reduction Transfer (Mimicking prep_transfer_cumulative.py)
 * - Press Mirror View (Horizontal Flip toggle for hand transfer registration)
 * - Directional Blur Smoothing & Mother Color Harmony blending
 * - Automated Perceived Luminance Linocut Carving Script Generator
 * 
 * @component
 */

import React, { useState, useEffect, useRef, useId } from 'react';

interface ColorSwatch {
  r: number;
  g: number;
  b: number;
  hex: string;
  luminance: number;
  inkPass: number;
  isPinned?: boolean;
}

export interface QuantizationStudioProps {
  initialImageSrc?: string;
}

export const QuantizationStudio: React.FC<QuantizationStudioProps> = ({ initialImageSrc }) => {
  const [paletteSize, setPaletteSize] = useState<number>(6);
  const [blurRadius, setBlurRadius] = useState<number>(8);
  const [motherMix, setMotherMix] = useState<number>(10);
  const [motherHex, setMotherHex] = useState<string>('#80828C');
  const [currentStep, setCurrentStep] = useState<number>(6);
  const [activeTab, setActiveTab] = useState<'canvas' | 'script' | 'swatches'>('canvas');
  const [swatches, setSwatches] = useState<ColorSwatch[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [selectedPreset, setSelectedPreset] = useState<string>(initialImageSrc ? 'initial' : 'sunset');

  // New features mirroring prep_transfer_cumulative.py & User Pinned Colors
  const [pinnedColors, setPinnedColors] = useState<string[]>([]);
  const [isEyedropperActive, setIsEyedropperActive] = useState<boolean>(false);
  const [isCumulativeMode, setIsCumulativeMode] = useState<boolean>(true);
  const [isMirrored, setIsMirrored] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const kSliderId = useId();
  const blurSliderId = useId();
  const motherMixSliderId = useId();
  const motherColorPickerId = useId();
  const stepSliderId = useId();
  const fileInputId = useId();
  const presetSelectId = useId();
  const customColorInputId = useId();

  // Helper: Load image from URL
  const loadImageFromUrl = (url: string) => {
    setIsProcessing(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const origCanvas = originalCanvasRef.current;
      if (!origCanvas) return;
      const ctx = origCanvas.getContext('2d');
      if (!ctx) return;

      const maxDim = 800;
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      origCanvas.width = w;
      origCanvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      setImageLoaded(true);
      processImage();
    };
    img.onerror = () => {
      const origCanvas = originalCanvasRef.current;
      if (!origCanvas) return;
      const ctx = origCanvas.getContext('2d');
      if (!ctx) return;
      origCanvas.width = 600;
      origCanvas.height = 400;
      drawSampleImage(ctx, 600, 400);
      setImageLoaded(true);
      processImage();
    };
    img.src = url;
  };

  // Helper: Convert hex to RGB
  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const cleaned = hex.replace('#', '');
    const num = parseInt(cleaned, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  };

  // Helper: RGB to Hex
  const rgbToHex = (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('');
  };

  // Helper: Perceived Luminance
  const getLuminance = (r: number, g: number, b: number): number => {
    return 0.299 * r + 0.587 * g + 0.114 * b;
  };

  // Draw default procedural test image
  const drawSampleImage = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.6);
    skyGrad.addColorStop(0, '#1a2a6c');
    skyGrad.addColorStop(0.5, '#b21f1f');
    skyGrad.addColorStop(1, '#fdbb2d');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height * 0.6);

    ctx.fillStyle = '#FFF5C0';
    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.45, width * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4a2545';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.6);
    ctx.lineTo(width * 0.3, height * 0.35);
    ctx.lineTo(width * 0.65, height * 0.6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#1b1b2f';
    ctx.beginPath();
    ctx.moveTo(width * 0.25, height * 0.6);
    ctx.lineTo(width * 0.7, height * 0.28);
    ctx.lineTo(width, height * 0.6);
    ctx.closePath();
    ctx.fill();

    const landGrad = ctx.createLinearGradient(0, height * 0.6, 0, height);
    landGrad.addColorStop(0, '#0f3443');
    landGrad.addColorStop(1, '#34e89e');
    ctx.fillStyle = landGrad;
    ctx.fillRect(0, height * 0.6, width, height * 0.4);
  };

  // Initialize sample canvas on mount
  useEffect(() => {
    if (initialImageSrc) {
      loadImageFromUrl(initialImageSrc);
    } else {
      const origCanvas = originalCanvasRef.current;
      if (!origCanvas) return;
      const ctx = origCanvas.getContext('2d');
      if (!ctx) return;

      origCanvas.width = 600;
      origCanvas.height = 400;
      drawSampleImage(ctx, 600, 400);
      setImageLoaded(true);
    }
  }, [initialImageSrc]);

  // Handle Eyedropper click on canvas to pick exact custom color
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isEyedropperActive) return;
    const canvas = originalCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const pickedHex = rgbToHex(pixel[0], pixel[1], pixel[2]);

    addPinnedColor(pickedHex);
    setIsEyedropperActive(false);
  };

  // Add custom pinned locked color
  const addPinnedColor = (hex: string) => {
    const formatted = hex.toLowerCase();
    if (!pinnedColors.includes(formatted)) {
      const updated = [...pinnedColors, formatted];
      setPinnedColors(updated);
      if (paletteSize < updated.length) {
        setPaletteSize(updated.length);
        setCurrentStep(updated.length);
      }
    }
  };

  // Remove pinned color
  const removePinnedColor = (hex: string) => {
    setPinnedColors(pinnedColors.filter((c) => c.toLowerCase() !== hex.toLowerCase()));
  };

  // Process Quantization & Rendering Pipeline
  const processImage = () => {
    const origCanvas = originalCanvasRef.current;
    const procCanvas = canvasRef.current;
    if (!origCanvas || !procCanvas) return;

    const origCtx = origCanvas.getContext('2d');
    const procCtx = procCanvas.getContext('2d');
    if (!origCtx || !procCtx) return;

    setIsProcessing(true);
    procCanvas.width = origCanvas.width;
    procCanvas.height = origCanvas.height;

    const width = origCanvas.width;
    const height = origCanvas.height;
    const imgData = origCtx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // Step 1: Spatial Box Blur (Simulating block gougeability & noise reduction)
    const blurCanvas = document.createElement('canvas');
    blurCanvas.width = width;
    blurCanvas.height = height;
    const blurCtx = blurCanvas.getContext('2d')!;
    blurCtx.putImageData(imgData, 0, 0);

    if (blurRadius > 0) {
      blurCtx.filter = `blur(${blurRadius}px)`;
      blurCtx.drawImage(blurCanvas, 0, 0);
      blurCtx.filter = 'none';
    }

    const blurredData = blurCtx.getImageData(0, 0, width, height).data;

    // Step 2: Semi-Supervised K-Means++ with Pinned Locked Colors
    const samplePoints: [number, number, number][] = [];
    const step = Math.max(1, Math.floor(data.length / 4000));
    for (let i = 0; i < blurredData.length; i += step * 4) {
      samplePoints.push([blurredData[i], blurredData[i + 1], blurredData[i + 2]]);
    }

    let centroids: [number, number, number][] = [];
    const pinnedRgbList = pinnedColors.map(hexToRgb);

    // Initialize locked user-pinned centroids first
    pinnedRgbList.forEach((c) => {
      centroids.push([c.r, c.g, c.b]);
    });

    // Fill remaining centroid slots using K-Means++ distance sampling
    if (samplePoints.length > 0) {
      while (centroids.length < paletteSize) {
        let maxDist = -1;
        let bestCandidate = samplePoints[0];

        for (const p of samplePoints) {
          let minDistToCentroids = Infinity;
          for (const c of centroids) {
            const dist = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2;
            if (dist < minDistToCentroids) {
              minDistToCentroids = dist;
            }
          }
          if (minDistToCentroids > maxDist) {
            maxDist = minDistToCentroids;
            bestCandidate = p;
          }
        }
        centroids.push([...bestCandidate]);
      }
    }

    // Run 6 iterations of K-Means clustering (preserving pinned centroids)
    const numPinned = pinnedRgbList.length;
    for (let iter = 0; iter < 6; iter++) {
      const clusters: [number, number, number][][] = Array.from({ length: paletteSize }, () => []);
      for (const p of samplePoints) {
        let minDist = Infinity;
        let bestK = 0;
        for (let k = 0; k < paletteSize; k++) {
          const dist =
            (p[0] - centroids[k][0]) ** 2 +
            (p[1] - centroids[k][1]) ** 2 +
            (p[2] - centroids[k][2]) ** 2;
          if (dist < minDist) {
            minDist = dist;
            bestK = k;
          }
        }
        clusters[bestK].push(p);
      }

      // Update only unpinned centroids
      for (let k = numPinned; k < paletteSize; k++) {
        if (clusters[k].length > 0) {
          const sum = clusters[k].reduce(
            (acc, curr) => [acc[0] + curr[0], acc[1] + curr[1], acc[2] + curr[2]],
            [0, 0, 0]
          );
          centroids[k] = [
            Math.round(sum[0] / clusters[k].length),
            Math.round(sum[1] / clusters[k].length),
            Math.round(sum[2] / clusters[k].length),
          ];
        }
      }
    }

    // Step 3: Mother Color Harmony Integration
    const motherRgb = hexToRgb(motherHex);
    const mixRatio = motherMix / 100;

    const harmonizedCentroids = centroids.map(([r, g, b], idx) => {
      // Keep pinned colors un-mixed if user wants exact color match, or harmonized
      if (idx < numPinned && motherMix === 0) {
        return [r, g, b];
      }
      return [
        Math.round(r * (1 - mixRatio) + motherRgb.r * mixRatio),
        Math.round(g * (1 - mixRatio) + motherRgb.g * mixRatio),
        Math.round(b * (1 - mixRatio) + motherRgb.b * mixRatio),
      ];
    });

    // Step 4: Deduplicate Swatches & Sort by Perceived Luminance (Lightest to Darkest)
    const pinnedSet = new Set(pinnedColors.map((h) => h.toLowerCase()));

    const rawSwatches = harmonizedCentroids.map(([r, g, b]) => {
      const lum = getLuminance(r, g, b);
      const hex = rgbToHex(r, g, b);
      return {
        r,
        g,
        b,
        hex,
        luminance: Math.round(lum),
        inkPass: 1,
        isPinned: pinnedSet.has(hex.toLowerCase()),
      };
    });

    // Deduplicate swatches by hex code
    const uniqueSwatchesMap = new Map<string, ColorSwatch>();
    for (const s of rawSwatches) {
      if (!uniqueSwatchesMap.has(s.hex)) {
        uniqueSwatchesMap.set(s.hex, s);
      }
    }

    const swatchesList: ColorSwatch[] = Array.from(uniqueSwatchesMap.values()).sort(
      (a, b) => b.luminance - a.luminance
    );

    // Assign sequential ink pass order numbers (1 = Lightest, K = Darkest)
    swatchesList.forEach((s, idx) => {
      s.inkPass = idx + 1;
    });

    setSwatches(swatchesList);

    // Step 5: Render Quantized Image & Layer Stepper Filter (Mimicking prep_transfer_cumulative.py)
    const outputImgData = procCtx.createImageData(width, height);
    const outData = outputImgData.data;

    for (let i = 0; i < blurredData.length; i += 4) {
      const r = blurredData[i];
      const g = blurredData[i + 1];
      const b = blurredData[i + 2];

      let minDist = Infinity;
      let closestSwatch = swatchesList[0];

      for (const swatch of swatchesList) {
        const dist = (r - swatch.r) ** 2 + (g - swatch.g) ** 2 + (b - swatch.b) ** 2;
        if (dist < minDist) {
          minDist = dist;
          closestSwatch = swatch;
        }
      }

      const pixelPass = closestSwatch.inkPass;
      const targetStep = Math.min(currentStep, swatchesList.length);

      if (isCumulativeMode) {
        // prep_transfer_cumulative.py Cumulative Transfer Logic:
        // At Pass S (currentStep), uncarved regions (final pass >= S) receive Pass S ink color.
        // Carved regions (final pass < S) retain ink from their final pass.
        if (pixelPass >= targetStep) {
          const stepSwatch = swatchesList.find((s) => s.inkPass === targetStep) || closestSwatch;
          outData[i] = stepSwatch.r;
          outData[i + 1] = stepSwatch.g;
          outData[i + 2] = stepSwatch.b;
          outData[i + 3] = 255;
        } else {
          outData[i] = closestSwatch.r;
          outData[i + 1] = closestSwatch.g;
          outData[i + 2] = closestSwatch.b;
          outData[i + 3] = 255;
        }
      } else {
        // Standard Layer Mask View: Show only active passes up to currentStep
        if (pixelPass <= targetStep) {
          outData[i] = closestSwatch.r;
          outData[i + 1] = closestSwatch.g;
          outData[i + 2] = closestSwatch.b;
          outData[i + 3] = 255;
        } else {
          outData[i] = 250;
          outData[i + 1] = 248;
          outData[i + 2] = 245;
          outData[i + 3] = 255;
        }
      }
    }

    procCtx.putImageData(outputImgData, 0, 0);
    setIsProcessing(false);
  };

  // Re-run pipeline when parameters change
  useEffect(() => {
    if (imageLoaded) {
      processImage();
    }
  }, [paletteSize, blurRadius, motherMix, motherHex, currentStep, pinnedColors, isCumulativeMode, imageLoaded]);

  // Handle custom image upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const origCanvas = originalCanvasRef.current;
        if (!origCanvas) return;
        const ctx = origCanvas.getContext('2d');
        if (!ctx) return;

        const maxDim = 800;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        origCanvas.width = w;
        origCanvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        setImageLoaded(true);
        processImage();
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full bg-paper-bg dark:bg-carbon-bg border border-paper-border dark:border-carbon-border rounded-xl shadow-md p-4 sm:p-6 my-8 font-sans">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-paper-border dark:border-carbon-border pb-4 mb-6 gap-3">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest font-semibold text-blue-600 dark:text-blue-400">
            Interactive Reduction Linocut Studio
          </span>
          <h2 className="font-serif text-2xl font-bold text-paper-text dark:text-carbon-text mt-1">
            Quantization & Cumulative Transfer Engine
          </h2>
        </div>

        {/* Preset Select & Upload Custom File Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            id={presetSelectId}
            aria-label="Choose Image Preset"
            value={selectedPreset}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedPreset(val);
              if (val === 'sunset') {
                const origCanvas = originalCanvasRef.current;
                if (origCanvas) {
                  const ctx = origCanvas.getContext('2d');
                  if (ctx) {
                    origCanvas.width = 600;
                    origCanvas.height = 400;
                    drawSampleImage(ctx, 600, 400);
                    setImageLoaded(true);
                    processImage();
                  }
                }
              } else if (val === 'initial' && initialImageSrc) {
                loadImageFromUrl(initialImageSrc);
              }
            }}
            className="text-xs px-2.5 py-1.5 rounded border border-paper-border dark:border-carbon-border bg-paper-bg dark:bg-carbon-bg text-paper-text dark:text-carbon-text font-medium"
          >
            <option value="sunset">🌄 Mountain Sunset Preset</option>
            {initialImageSrc && <option value="initial">🖼️ Custom Studio Artwork</option>}
          </select>

          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              setSelectedPreset('custom');
              handleFileUpload(e);
            }}
            accept="image/*"
            className="hidden"
            id={fileInputId}
          />
          <label
            htmlFor={fileInputId}
            className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded bg-paper-accent dark:bg-carbon-accent text-white hover:opacity-90 transition-opacity"
          >
            📷 Upload Custom Image
          </label>
        </div>
      </div>

      {/* Control Sliders Grid (Extended up to 20 Inks) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 bg-paper-border/20 dark:bg-carbon-border/20 p-4 rounded-lg text-xs">
        
        {/* Palette Size K Slider (3 to 20 Inks) */}
        <div>
          <div className="flex justify-between font-medium mb-1">
            <label htmlFor={kSliderId}>Total Ink Swatches (K):</label>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{paletteSize} Inks</span>
          </div>
          <input
            id={kSliderId}
            type="range"
            min="3"
            max="20"
            value={paletteSize}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setPaletteSize(val);
              if (currentStep > val) setCurrentStep(val);
            }}
            className="w-full accent-blue-600"
          />
        </div>

        {/* Spatial Blur Slider */}
        <div>
          <div className="flex justify-between font-medium mb-1">
            <label htmlFor={blurSliderId}>Carving Blur Radius:</label>
            <span className="font-mono font-bold">{blurRadius}px</span>
          </div>
          <input
            id={blurSliderId}
            type="range"
            min="0"
            max="25"
            value={blurRadius}
            onChange={(e) => setBlurRadius(parseInt(e.target.value))}
            className="w-full accent-blue-600"
          />
        </div>

        {/* Mother Color Mix Slider & Picker */}
        <div>
          <div className="flex justify-between font-medium mb-1">
            <label htmlFor={motherMixSliderId}>Mother Color Undertone:</label>
            <span className="font-mono font-bold">{motherMix}%</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              id={motherMixSliderId}
              type="range"
              min="0"
              max="30"
              value={motherMix}
              onChange={(e) => setMotherMix(parseInt(e.target.value))}
              className="w-full accent-blue-600"
            />
            <input
              id={motherColorPickerId}
              type="color"
              aria-label="Mother Color Undertone Picker"
              value={motherHex}
              onChange={(e) => setMotherHex(e.target.value)}
              className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
              title="Change Mother Color undertone"
            />
          </div>
        </div>

        {/* Ink Pass Stepper Slider */}
        <div>
          <div className="flex justify-between font-medium mb-1">
            <label htmlFor={stepSliderId}>Print Pass Stepper:</label>
            <span className="font-mono font-bold text-green-600 dark:text-green-400">
              Pass {currentStep} of {swatches.length || paletteSize}
            </span>
          </div>
          <input
            id={stepSliderId}
            type="range"
            min="1"
            max={swatches.length || paletteSize}
            value={currentStep}
            onChange={(e) => setCurrentStep(parseInt(e.target.value))}
            className="w-full accent-green-600"
          />
        </div>

      </div>

      {/* Toolbar: Pinned Colors & Transfer Modes */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-paper-border/10 dark:bg-carbon-border/10 rounded-lg mb-6 text-xs">
        
        {/* Eyedropper & Pinned Color Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsEyedropperActive(!isEyedropperActive)}
            className={`px-3 py-1.5 rounded font-semibold transition-colors flex items-center gap-1.5 ${
              isEyedropperActive
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-paper-text text-paper-bg dark:bg-carbon-text dark:text-carbon-bg hover:opacity-90'
            }`}
          >
            📌 {isEyedropperActive ? 'Click Image to Pick Color...' : 'Eyedropper (Pick Image Color)'}
          </button>

          <input
            id={customColorInputId}
            type="color"
            onChange={(e) => addPinnedColor(e.target.value)}
            className="w-7 h-7 rounded cursor-pointer border-none bg-transparent"
            title="Add Custom Locked Ink Color"
          />

          {/* Pinned Swatches List */}
          {pinnedColors.length > 0 && (
            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-[11px] font-semibold text-paper-muted dark:text-carbon-muted">Pinned ({pinnedColors.length}):</span>
              {pinnedColors.map((hex) => (
                <span
                  key={hex}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border bg-paper-bg dark:bg-carbon-bg"
                >
                  <span className="w-2.5 h-2.5 rounded-full border inline-block" style={{ backgroundColor: hex }} />
                  {hex.toUpperCase()}
                  <button
                    onClick={() => removePinnedColor(hex)}
                    className="text-red-500 hover:text-red-700 font-bold ml-1"
                    title="Remove pinned color"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Transfer & Mirror Mode Toggles */}
        <div className="flex items-center gap-3 font-medium">
          {/* Cumulative Transfer Mode Toggle */}
          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isCumulativeMode}
              onChange={(e) => setIsCumulativeMode(e.target.checked)}
              className="accent-blue-600 rounded"
            />
            <span>Cumulative Transfer Mode (GIMP Plugin)</span>
          </label>

          {/* Press Mirror View Toggle */}
          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isMirrored}
              onChange={(e) => setIsMirrored(e.target.checked)}
              className="accent-blue-600 rounded"
            />
            <span>🪞 Press Transfer Mirror</span>
          </label>
        </div>

      </div>

      {/* Tab Navigation Controls */}
      <div className="flex border-b border-paper-border dark:border-carbon-border mb-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('canvas')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'canvas'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-paper-muted dark:text-carbon-muted hover:text-paper-text'
          }`}
        >
          🖼️ Studio Canvas View
        </button>
        <button
          onClick={() => setActiveTab('swatches')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'swatches'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-paper-muted dark:text-carbon-muted hover:text-paper-text'
          }`}
        >
          🎨 Ink Palette ({swatches.length})
        </button>
        <button
          onClick={() => setActiveTab('script')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'script'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-paper-muted dark:text-carbon-muted hover:text-paper-text'
          }`}
        >
          📜 Carving Script Guide
        </button>
      </div>

      {/* Tab Content: Canvas View (Kept mounted to preserve canvas pixel buffer) */}
      <div className={activeTab === 'canvas' ? 'grid grid-cols-1 md:grid-cols-2 gap-4 items-center' : 'hidden'}>
        {/* Source Image Canvas */}
        <div className="flex flex-col items-center">
          <span className="text-xs font-mono uppercase tracking-wider text-paper-muted dark:text-carbon-muted mb-2">
            Continuous Tone Input {isEyedropperActive && '(Click Image to Pick Color)'}
          </span>
          <div className="w-full overflow-hidden rounded-lg border border-paper-border dark:border-carbon-border bg-black/5 flex items-center justify-center p-2">
            <canvas
              ref={originalCanvasRef}
              onClick={handleCanvasClick}
              className={`max-w-full h-auto rounded shadow-sm transition-transform duration-300 ${
                isEyedropperActive ? 'cursor-crosshair ring-2 ring-red-500' : ''
              } ${isMirrored ? '-scale-x-100' : ''}`}
            />
          </div>
        </div>

        {/* Quantized & Cumulative Reduction Output Canvas */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-paper-muted dark:text-carbon-muted">
              Reduction Layer Output (Pass 1–{currentStep})
            </span>
            {isProcessing && <span className="text-xs text-blue-500 animate-pulse">Calculating...</span>}
          </div>
          <div className="w-full overflow-hidden rounded-lg border border-paper-border dark:border-carbon-border bg-black/5 flex items-center justify-center p-2">
            <canvas
              ref={canvasRef}
              className={`max-w-full h-auto rounded shadow-sm transition-transform duration-300 ${
                isMirrored ? '-scale-x-100' : ''
              }`}
            />
          </div>
        </div>
      </div>

      {/* Tab Content: Ink Swatches Grid */}
      <div className={activeTab === 'swatches' ? 'grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3' : 'hidden'}>
        {swatches.map((swatch) => (
          <div
            key={swatch.hex}
            className={`p-3 rounded-lg border text-xs flex flex-col items-center transition-all ${
              swatch.inkPass <= currentStep
                ? 'border-paper-text/40 dark:border-carbon-text/40 bg-paper-border/10 dark:bg-carbon-border/10'
                : 'opacity-40 border-dashed border-gray-400'
            }`}
          >
            <div
              className="w-full h-12 rounded border shadow-inner mb-2 relative flex items-center justify-center"
              style={{ backgroundColor: swatch.hex }}
            >
              {swatch.isPinned && (
                <span className="text-sm bg-black/40 text-white rounded-full px-1.5 py-0.5" title="User Pinned Locked Ink">
                  📌
                </span>
              )}
            </div>
            <span className="font-mono font-bold uppercase flex items-center gap-1">
              {swatch.hex}
            </span>
            <span className="text-[10px] text-paper-muted dark:text-carbon-muted">
              Pass {swatch.inkPass} • Lum: {swatch.luminance}
            </span>
          </div>
        ))}
      </div>

      {/* Tab Content: Generated Carving Script */}
      <div className={activeTab === 'script' ? 'bg-paper-bg dark:bg-carbon-bg p-4 rounded-lg border border-paper-border dark:border-carbon-border text-xs font-mono leading-relaxed space-y-3' : 'hidden'}>
        <div className="text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
          --- AUTOMATED REDUCTION CARVING INSTRUCTIONS ---
        </div>
        <div>Organized by Perceived Luminance (Lightest to Darkest).</div>
        
        <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-yellow-800 dark:text-yellow-200">
          <strong>Step 0 (Initial Highlight Carve):</strong><br />
          Carve away all paper-white highlight areas on the un-inked linoleum block before printing Pass 1.
        </div>

        {swatches.map((swatch, idx) => (
          <div key={swatch.hex} className="p-2 border border-paper-border dark:border-carbon-border rounded flex items-center justify-between">
            <div>
              <strong>Step {idx + 1}: Print Ink Pass {swatch.inkPass} ({swatch.hex}) {swatch.isPinned ? '📌 [Pinned Ink]' : ''}</strong>
              <div className="text-[11px] text-paper-muted dark:text-carbon-muted font-sans mt-0.5">
                {idx < swatches.length - 1
                  ? `After printing, carve away all regions that should remain ${swatch.hex} on paper.`
                  : 'Final pass completed! Lock in final dark outlines and detail cuts.'}
              </div>
            </div>
            <div className="w-6 h-6 rounded border flex-shrink-0" style={{ backgroundColor: swatch.hex }} />
          </div>
        ))}
      </div>

    </div>
  );
};
