/**
 * QuantizationStudio Component
 * 
 * Interactive JavaScript / React browser studio simulating the Python Image Quantization engine (`main.py`).
 * Runs HTML5 Canvas 2D image quantization, directional blur smoothing, Mother Color palette blending,
 * subtractive reduction ink layer accumulation stepping, and automated linocut carving script generation.
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
}

export const QuantizationStudio: React.FC = () => {
  const [paletteSize, setPaletteSize] = useState<number>(5);
  const [blurRadius, setBlurRadius] = useState<number>(8);
  const [motherMix, setMotherMix] = useState<number>(10);
  const [motherHex, setMotherHex] = useState<string>('#80828C');
  const [currentStep, setCurrentStep] = useState<number>(5);
  const [activeTab, setActiveTab] = useState<'canvas' | 'script' | 'swatches'>('canvas');
  const [swatches, setSwatches] = useState<ColorSwatch[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const kSliderId = useId();
  const blurSliderId = useId();
  const motherMixSliderId = useId();
  const motherColorPickerId = useId();
  const stepSliderId = useId();
  const fileInputId = useId();

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

  // Draw default procedural test image (High contrast sunset over mountains for printmaking test)
  const drawSampleImage = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.6);
    skyGrad.addColorStop(0, '#1a2a6c');
    skyGrad.addColorStop(0.5, '#b21f1f');
    skyGrad.addColorStop(1, '#fdbb2d');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height * 0.6);

    // Sun
    ctx.fillStyle = '#FFF5C0';
    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.45, width * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // Mountain 1 (Distant)
    ctx.fillStyle = '#4a2545';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.6);
    ctx.lineTo(width * 0.3, height * 0.35);
    ctx.lineTo(width * 0.65, height * 0.6);
    ctx.closePath();
    ctx.fill();

    // Mountain 2 (Foreground)
    ctx.fillStyle = '#1b1b2f';
    ctx.beginPath();
    ctx.moveTo(width * 0.25, height * 0.6);
    ctx.lineTo(width * 0.7, height * 0.28);
    ctx.lineTo(width, height * 0.6);
    ctx.closePath();
    ctx.fill();

    // Water/Land Foreground
    const landGrad = ctx.createLinearGradient(0, height * 0.6, 0, height);
    landGrad.addColorStop(0, '#0f3443');
    landGrad.addColorStop(1, '#34e89e');
    ctx.fillStyle = landGrad;
    ctx.fillRect(0, height * 0.6, width, height * 0.4);
  };

  // Initialize sample canvas on mount
  useEffect(() => {
    const origCanvas = originalCanvasRef.current;
    if (!origCanvas) return;
    const ctx = origCanvas.getContext('2d');
    if (!ctx) return;

    origCanvas.width = 600;
    origCanvas.height = 400;
    drawSampleImage(ctx, 600, 400);
    setImageLoaded(true);
  }, []);

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

    // Step 2: Simplified K-Means Quantization (Grid sampling centroids)
    const samplePoints: [number, number, number][] = [];
    const step = Math.max(1, Math.floor(data.length / 4000));
    for (let i = 0; i < blurredData.length; i += step * 4) {
      samplePoints.push([blurredData[i], blurredData[i + 1], blurredData[i + 2]]);
    }

    // Initialize K centroids uniformly
    let centroids: [number, number, number][] = [];
    for (let i = 0; i < paletteSize; i++) {
      const idx = Math.floor((i / paletteSize) * samplePoints.length);
      centroids.push([...samplePoints[idx]]);
    }

    // Run 5 iterations of K-Means clustering
    for (let iter = 0; iter < 5; iter++) {
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

      for (let k = 0; k < paletteSize; k++) {
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

    const harmonizedCentroids = centroids.map(([r, g, b]) => [
      Math.round(r * (1 - mixRatio) + motherRgb.r * mixRatio),
      Math.round(g * (1 - mixRatio) + motherRgb.g * mixRatio),
      Math.round(b * (1 - mixRatio) + motherRgb.b * mixRatio),
    ]);

    // Step 4: Sort Swatches by Perceived Luminance (Lightest ink pass to Darkest)
    const swatchesList: ColorSwatch[] = harmonizedCentroids
      .map(([r, g, b]) => {
        const lum = getLuminance(r, g, b);
        return {
          r,
          g,
          b,
          hex: rgbToHex(r, g, b),
          luminance: Math.round(lum),
          inkPass: 1,
        };
      })
      .sort((a, b) => b.luminance - a.luminance);

    // Assign sequential ink pass order numbers (1 = Lightest, K = Darkest)
    swatchesList.forEach((s, idx) => {
      s.inkPass = idx + 1;
    });

    setSwatches(swatchesList);

    // Step 5: Render Quantized Image & Layer Stepper Filter
    const outputImgData = procCtx.createImageData(width, height);
    const outData = outputImgData.data;

    // Filter active swatches based on current reduction step slider
    const maxActivePass = Math.min(currentStep, paletteSize);
    const activeHexSet = new Set(swatchesList.slice(0, maxActivePass).map((s) => s.hex));

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

      // Check if this ink pass is active under the reduction slider
      if (activeHexSet.has(closestSwatch.hex)) {
        outData[i] = closestSwatch.r;
        outData[i + 1] = closestSwatch.g;
        outData[i + 2] = closestSwatch.b;
        outData[i + 3] = 255;
      } else {
        // Paper White Background for unprinted/carved areas
        outData[i] = 250;
        outData[i + 1] = 248;
        outData[i + 2] = 245;
        outData[i + 3] = 255;
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
  }, [paletteSize, blurRadius, motherMix, motherHex, currentStep, imageLoaded]);

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

        // Scale down max dimension to 800px for instant browser performance
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
            Quantization & Layer Stepper Engine
          </h2>
        </div>

        {/* Upload Custom File Button */}
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
            id={fileInputId}
          />
          <label
            htmlFor={fileInputId}
            className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded bg-paper-accent dark:bg-carbon-accent text-white hover:opacity-90 transition-opacity"
          >
            📷 Upload Image
          </label>
        </div>
      </div>

      {/* Control Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-paper-border/20 dark:bg-carbon-border/20 p-4 rounded-lg text-xs">
        
        {/* Palette Size K Slider */}
        <div>
          <div className="flex justify-between font-medium mb-1">
            <label htmlFor={kSliderId}>Ink Swatches (K):</label>
            <span className="font-mono font-bold">{paletteSize} Inks</span>
          </div>
          <input
            id={kSliderId}
            type="range"
            min="3"
            max="10"
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

        {/* Ink Pass Reduction Layer Stepper Slider */}
        <div>
          <div className="flex justify-between font-medium mb-1">
            <label htmlFor={stepSliderId}>Print Pass Stepper:</label>
            <span className="font-mono font-bold">Pass {currentStep} of {paletteSize}</span>
          </div>
          <input
            id={stepSliderId}
            type="range"
            min="1"
            max={paletteSize}
            value={currentStep}
            onChange={(e) => setCurrentStep(parseInt(e.target.value))}
            className="w-full accent-green-600"
          />
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
            Continuous Tone Input
          </span>
          <div className="w-full overflow-hidden rounded-lg border border-paper-border dark:border-carbon-border bg-black/5 flex items-center justify-center p-2">
            <canvas ref={originalCanvasRef} className="max-w-full h-auto rounded shadow-sm" />
          </div>
        </div>

        {/* Quantized & Smoothed Studio Canvas */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-paper-muted dark:text-carbon-muted">
              Reduction Layer Output (Pass 1–{currentStep})
            </span>
            {isProcessing && <span className="text-xs text-blue-500 animate-pulse">Calculating...</span>}
          </div>
          <div className="w-full overflow-hidden rounded-lg border border-paper-border dark:border-carbon-border bg-black/5 flex items-center justify-center p-2">
            <canvas ref={canvasRef} className="max-w-full h-auto rounded shadow-sm" />
          </div>
        </div>
      </div>

      {/* Tab Content: Ink Swatches Grid */}
      <div className={activeTab === 'swatches' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3' : 'hidden'}>
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
              className="w-full h-12 rounded border shadow-inner mb-2"
              style={{ backgroundColor: swatch.hex }}
            />
            <span className="font-mono font-bold uppercase">{swatch.hex}</span>
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
              <strong>Step {idx + 1}: Print Ink Pass {swatch.inkPass} ({swatch.hex})</strong>
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
