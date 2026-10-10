/**
 * QuantizationStudio Component
 * 
 * Interactive browser studio simulating the reduction linocut workflows
 * developed in the GIMP 3.0 `prep_transfer_cumulative.py` Python plugin.
 * 
 * Features:
 * - HTML5 Canvas 2D K-Means++ Color Quantization (Supports up to 30 inks)
 * - Pinned Custom Colors & Semi-Supervised K-Means (Eyedropper canvas picking)
 * - Cumulative Layer Reduction Transfer (Matching GIMP plugin pre-press logic)
 * - Press Mirror View (Horizontal Flip toggle for hand transfer registration)
 * - Directional Blur Smoothing & Mother Color Harmony blending
 * - Automated Perceived Luminance Linocut Carving Script Generator
 * 
 * @component
 */

import { useState, useEffect, useRef, useId, type FC, type MouseEvent, type ChangeEvent } from 'react';

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

export const QuantizationStudio: FC<QuantizationStudioProps> = ({ initialImageSrc }) => {
  const [paletteSize, setPaletteSize] = useState<number>(6);
  const [blurRadius, setBlurRadius] = useState<number>(0);
  const [motherMix, setMotherMix] = useState<number>(10);
  const [motherHex, setMotherHex] = useState<string>('#80828C');
  const [pendingMotherHex, setPendingMotherHex] = useState<string>('#80828C');
  const [currentStep, setCurrentStep] = useState<number>(6);
  const [activeTab, setActiveTab] = useState<'canvas' | 'script' | 'swatches'>('canvas');
  const [swatches, setSwatches] = useState<ColorSwatch[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [selectedPreset, setSelectedPreset] = useState<string>(initialImageSrc ? 'initial' : 'sunset');

  const [pinnedColors, setPinnedColors] = useState<string[]>([]);
  const [pendingCustomColor, setPendingCustomColor] = useState<string>('#3b82f6');
  const [isEyedropperActive, setIsEyedropperActive] = useState<boolean>(false);
  const [isCumulativeMode, setIsCumulativeMode] = useState<boolean>(true);
  const [isMirrored, setIsMirrored] = useState<boolean>(false);
  const [colorSpace, setColorSpace] = useState<'lab' | 'false-lab' | 'rgb'>('lab');
  const [quantizedImageUrl, setQuantizedImageUrl] = useState<string>('');
  const [saveFeedback, setSaveFeedback] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const clusterAssignmentsRef = useRef<{
    indices: Uint8Array;
    swatches: ColorSwatch[];
    width: number;
    height: number;
  } | null>(null);

  const kSliderId = useId();
  const blurSliderId = useId();
  const motherMixSliderId = useId();
  const motherColorPickerId = useId();
  const stepSliderId = useId();
  const fileInputId = useId();
  const presetSelectId = useId();
  const customColorInputId = useId();
  const colorSpaceSelectId = useId();

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

  // Helper: Convert sRGB to CIELAB (L*a*b*) matching main.py (cv2.COLOR_RGB2Lab)
  const rgbToLab = (r: number, g: number, b: number): [number, number, number] => {
    let sr = r / 255;
    let sg = g / 255;
    let sb = b / 255;

    sr = sr > 0.04045 ? Math.pow((sr + 0.055) / 1.055, 2.4) : sr / 12.92;
    sg = sg > 0.04045 ? Math.pow((sg + 0.055) / 1.055, 2.4) : sg / 12.92;
    sb = sb > 0.04045 ? Math.pow((sb + 0.055) / 1.055, 2.4) : sb / 12.92;

    let x = (sr * 0.4124564 + sg * 0.3575761 + sb * 0.1804375) / 0.95047;
    let y = (sr * 0.2126729 + sg * 0.7151522 + sb * 0.0721750) / 1.00000;
    let z = (sr * 0.0193339 + sg * 0.1191920 + sb * 0.9503041) / 1.08883;

    const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    const fx = f(x);
    const fy = f(y);
    const fz = f(z);

    return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
  };

  // Helper: Perceived Delta E distance in LAB space
  const labDistSq = (c1: [number, number, number], c2: [number, number, number]): number => {
    const dL = c1[0] - c2[0];
    const da = c1[1] - c2[1];
    const db = c1[2] - c2[2];
    return dL * dL + da * da + db * db;
  };

  // Helper: False CIELAB conversion - falsely interprets sRGB [R, G, B] bytes directly as [L*, a*, b*]
  // This happy accident produced the iconic palette in the physical print "View From A Distance"!
  const rgbToFalseLab = (r: number, g: number, b: number): [number, number, number] => {
    const L = (r / 255) * 100;
    const a = g - 128;
    const bVal = b - 128;
    return [L, a, bVal];
  };

  // Helper: Convert CIELAB [L*, a*, b*] back to sRGB [R, G, B]
  const labToRgb = (L: number, a: number, b: number): [number, number, number] => {
    const fy = (L + 16) / 116;
    const fx = a / 500 + fy;
    const fz = fy - b / 200;

    const fInv = (t: number) => {
      const t3 = t * t * t;
      return t3 > 0.008856 ? t3 : (t - 16 / 116) / 7.787;
    };

    const x = fInv(fx) * 0.95047;
    const y = fInv(fy) * 1.00000;
    const z = fInv(fz) * 1.08883;

    const rLinear = x * 3.2406 + y * -1.5372 + z * -0.4986;
    const gLinear = x * -0.9689 + y * 1.8758 + z * 0.0415;
    const bLinear = x * 0.0557 + y * -0.2040 + z * 1.0570;

    const gamma = (v: number) => {
      if (v <= 0) return 0;
      return v > 0.0031308 ? 1.055 * Math.pow(v, 1 / 2.4) - 0.055 : 12.92 * v;
    };

    return [
      Math.min(255, Math.max(0, Math.round(gamma(rLinear) * 255))),
      Math.min(255, Math.max(0, Math.round(gamma(gLinear) * 255))),
      Math.min(255, Math.max(0, Math.round(gamma(bLinear) * 255))),
    ];
  };

  // Draw default procedural test image 1: Mountain Sunset
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

  // Draw procedural test image 2: Ocean Wave Contour
  const drawWaveImage = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#f4ecd8');
    sky.addColorStop(0.5, '#e8d4b8');
    sky.addColorStop(1, '#c27d38');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#b72a2a';
    ctx.beginPath();
    ctx.arc(width * 0.75, height * 0.4, width * 0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2c5d63';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.65);
    ctx.quadraticCurveTo(width * 0.25, height * 0.45, width * 0.5, height * 0.65);
    ctx.quadraticCurveTo(width * 0.75, height * 0.85, width, height * 0.6);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#1e3843';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.75);
    ctx.quadraticCurveTo(width * 0.3, height * 0.5, width * 0.6, height * 0.75);
    ctx.quadraticCurveTo(width * 0.85, height * 0.95, width, height * 0.7);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#faf6ed';
    ctx.beginPath();
    ctx.arc(width * 0.3, height * 0.52, width * 0.04, 0, Math.PI * 2);
    ctx.arc(width * 0.35, height * 0.54, width * 0.03, 0, Math.PI * 2);
    ctx.arc(width * 0.25, height * 0.55, width * 0.035, 0, Math.PI * 2);
    ctx.fill();
  };

  // Draw procedural test image 3: Foggy Pine Forest
  const drawForestImage = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#101820');
    sky.addColorStop(0.6, '#2c3e50');
    sky.addColorStop(1, '#86a8e7');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#fbfbfb';
    ctx.beginPath();
    ctx.arc(width * 0.2, height * 0.25, width * 0.07, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4b6584';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.55);
    ctx.lineTo(width * 0.4, height * 0.38);
    ctx.lineTo(width * 0.8, height * 0.6);
    ctx.lineTo(width, height * 0.5);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#1e272e';
    for (let x = 0; x < width; x += 40) {
      const treeH = height * 0.3 + (x % 3) * 30;
      ctx.beginPath();
      ctx.moveTo(x - 25, height * 0.8);
      ctx.lineTo(x, height * 0.8 - treeH);
      ctx.lineTo(x + 25, height * 0.8);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = '#0f171e';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.75);
    ctx.lineTo(width * 0.6, height * 0.68);
    ctx.lineTo(width, height * 0.8);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
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

  // Synchronize quantized image export when mirror toggle changes
  useEffect(() => {
    if (canvasRef.current && imageLoaded) {
      updateQuantizedImageUrl(canvasRef.current, isMirrored);
    }
  }, [isMirrored]);

  // Synchronize pending mother color when active motherHex changes
  useEffect(() => {
    setPendingMotherHex(motherHex);
  }, [motherHex]);

  // Handle Esc key to cancel active eyedropper
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEyedropperActive) {
        setIsEyedropperActive(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEyedropperActive]);

  // Update quantized image data URL (baking in press-mirror flip if active)
  const updateQuantizedImageUrl = (sourceCanvas: HTMLCanvasElement, mirrored: boolean) => {
    if (!mirrored) {
      setQuantizedImageUrl(sourceCanvas.toDataURL('image/png'));
      return;
    }
    const mirrorCanvas = document.createElement('canvas');
    mirrorCanvas.width = sourceCanvas.width;
    mirrorCanvas.height = sourceCanvas.height;
    const mCtx = mirrorCanvas.getContext('2d');
    if (mCtx) {
      mCtx.save();
      mCtx.translate(sourceCanvas.width, 0);
      mCtx.scale(-1, 1);
      mCtx.drawImage(sourceCanvas, 0, 0);
      mCtx.restore();
      setQuantizedImageUrl(mirrorCanvas.toDataURL('image/png'));
    } else {
      setQuantizedImageUrl(sourceCanvas.toDataURL('image/png'));
    }
  };

  // Handle Save Image download process (Single primary save action)
  const handleSaveImage = async () => {
    if (!quantizedImageUrl) return;

    const passSuffix = `pass-${currentStep}-of-${swatches.length || paletteSize}`;
    const mirrorSuffix = isMirrored ? '-mirrored' : '';
    const fileName = `linocut-${selectedPreset}-${passSuffix}${mirrorSuffix}.png`;

    try {
      const res = await fetch(quantizedImageUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(blobUrl), 4000);

      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 2200);
    } catch {
      const link = document.createElement('a');
      link.href = quantizedImageUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 2200);
    }
  };

  // Helper: Sample pixel color from either canvas with support for mirror transformation
  const sampleColorAtPoint = (
    canvas: HTMLCanvasElement | null,
    clientX: number,
    clientY: number
  ): string | null => {
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    let x = Math.floor(((clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.floor(((clientY - rect.top) / rect.height) * canvas.height);
    if (isMirrored) {
      x = canvas.width - 1 - x;
    }

    const clampedX = Math.max(0, Math.min(canvas.width - 1, x));
    const clampedY = Math.max(0, Math.min(canvas.height - 1, y));

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const pixel = ctx.getImageData(clampedX, clampedY, 1, 1).data;
    return rgbToHex(pixel[0], pixel[1], pixel[2]);
  };

  // Eyedropper activation: tries native EyeDropper API first, falls back to in-canvas picker
  const handleToggleEyedropper = async () => {
    if (isEyedropperActive) {
      setIsEyedropperActive(false);
      return;
    }

    if (typeof window !== 'undefined' && 'EyeDropper' in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          addPinnedColor(result.sRGBHex);
          return;
        }
      } catch {
        // User cancelled native prompt or pressed Esc
        return;
      }
    }

    setIsEyedropperActive(true);
  };

  // Sample click/tap from Source continuous tone canvas
  const handleSourceClick = (e: MouseEvent<HTMLElement>) => {
    if (!isEyedropperActive) return;
    const hex = sampleColorAtPoint(originalCanvasRef.current, e.clientX, e.clientY);
    if (hex) {
      addPinnedColor(hex);
      setIsEyedropperActive(false);
    }
  };

  // Sample click/tap from Output quantized image
  const handleOutputClick = (e: MouseEvent<HTMLElement>) => {
    if (!isEyedropperActive) return;
    const hex = sampleColorAtPoint(canvasRef.current, e.clientX, e.clientY);
    if (hex) {
      addPinnedColor(hex);
      setIsEyedropperActive(false);
    }
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

    // Step 3: Mother Color Harmony Integration & False CIELAB Translation
    const motherRgb = hexToRgb(motherHex);
    const mixRatio = motherMix / 100;

    const harmonizedCentroids = centroids.map(([r, g, b], idx) => {
      // Pinned colors (indices 0 to numPinned - 1) MUST stay locked to user's exact chosen swatch!
      if (idx < numPinned) {
        return [r, g, b];
      }

      // Unpinned centroids receive mother color harmony undertone
      let cr = r;
      let cg = g;
      let cb = b;
      if (motherMix > 0) {
        cr = Math.round(r * (1 - mixRatio) + motherRgb.r * mixRatio);
        cg = Math.round(g * (1 - mixRatio) + motherRgb.g * mixRatio);
        cb = Math.round(b * (1 - mixRatio) + motherRgb.b * mixRatio);
      }

      // If False CIELAB mode is active, falsely interpret unpinned sRGB bytes as [L*, a*, b*]
      if (colorSpace === 'false-lab') {
        const [fl, fa, fb] = rgbToFalseLab(cr, cg, cb);
        return labToRgb(fl, fa, fb);
      }

      return [cr, cg, cb];
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

    // Pre-calculate LAB coordinates for each swatch based on active colorSpace mode
    const swatchLabs = swatchesList.map((s) => ({
      swatch: s,
      lab: colorSpace === 'false-lab' ? rgbToFalseLab(s.r, s.g, s.b) : rgbToLab(s.r, s.g, s.b),
    }));

    // If blurRadius == 0, use crisp raw un-blurred image data to guarantee razor-sharp edge contours
    const renderSourceData = blurRadius > 0 ? blurredData : data;

    // Step 5: Assign each pixel to closest swatch index and cache in Uint8Array
    const numPixels = width * height;
    const indices = new Uint8Array(numPixels);

    for (let p = 0, i = 0; p < numPixels; p++, i += 4) {
      const r = renderSourceData[i];
      const g = renderSourceData[i + 1];
      const b = renderSourceData[i + 2];

      let minDist = Infinity;
      let bestIdx = 0;

      if (colorSpace === 'lab' || colorSpace === 'false-lab') {
        const pixLab = colorSpace === 'false-lab' ? rgbToFalseLab(r, g, b) : rgbToLab(r, g, b);
        for (let sIdx = 0; sIdx < swatchLabs.length; sIdx++) {
          const dist = labDistSq(pixLab, swatchLabs[sIdx].lab);
          if (dist < minDist) {
            minDist = dist;
            bestIdx = sIdx;
          }
        }
      } else {
        for (let sIdx = 0; sIdx < swatchesList.length; sIdx++) {
          const swatch = swatchesList[sIdx];
          const dist = (r - swatch.r) ** 2 + (g - swatch.g) ** 2 + (b - swatch.b) ** 2;
          if (dist < minDist) {
            minDist = dist;
            bestIdx = sIdx;
          }
        }
      }

      indices[p] = bestIdx;
    }

    clusterAssignmentsRef.current = { indices, swatches: swatchesList, width, height };

    // Render the output pass using the fast mapping loop
    renderPassOutput(currentStep, isCumulativeMode, swatchesList, indices, width, height);
  };

  // Fast Pass Output Renderer: Renders cached cluster indices in ~1-2ms without re-running K-Means
  const renderPassOutput = (
    step: number,
    cumulative: boolean,
    swatchesList: ColorSwatch[],
    indices: Uint8Array,
    width: number,
    height: number
  ) => {
    const procCanvas = canvasRef.current;
    if (!procCanvas) return;
    const procCtx = procCanvas.getContext('2d');
    if (!procCtx) return;

    procCanvas.width = width;
    procCanvas.height = height;

    const outputImgData = procCtx.createImageData(width, height);
    const outData = outputImgData.data;

    const targetStep = Math.min(step, swatchesList.length);
    const stepSwatch = swatchesList.find((s) => s.inkPass === targetStep) || swatchesList[0];

    for (let p = 0, i = 0; p < indices.length; p++, i += 4) {
      const closestSwatch = swatchesList[indices[p]] || swatchesList[0];
      const pixelPass = closestSwatch.inkPass;

      if (cumulative) {
        if (pixelPass >= targetStep) {
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
    updateQuantizedImageUrl(procCanvas, isMirrored);
    setIsProcessing(false);
  };

  // Re-run heavy K-Means clustering pipeline only when palette parameters change
  useEffect(() => {
    if (imageLoaded) {
      processImage();
    }
  }, [paletteSize, blurRadius, motherMix, motherHex, pinnedColors, colorSpace, imageLoaded]);

  // Fast re-render when dragging print pass step or toggling cumulative transfer mode
  useEffect(() => {
    if (clusterAssignmentsRef.current) {
      const { swatches: sList, indices, width, height } = clusterAssignmentsRef.current;
      renderPassOutput(currentStep, isCumulativeMode, sList, indices, width, height);
    }
  }, [currentStep, isCumulativeMode]);

  // Handle custom image upload
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
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
    <div className="w-full max-w-full overflow-hidden bg-paper-bg dark:bg-carbon-bg border border-paper-border dark:border-carbon-border rounded-xl shadow-md p-3 sm:p-6 my-8 font-sans min-w-0">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-paper-border dark:border-carbon-border pb-4 mb-6 gap-3 min-w-0">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest font-semibold text-blue-600 dark:text-blue-400">
            Interactive Reduction Linocut Studio
          </span>
          <h2 className="font-serif text-2xl font-bold text-paper-text dark:text-carbon-text mt-1">
            Quantization & Cumulative Transfer Engine
          </h2>
        </div>

        {/* Preset Select & Upload Custom File Controls */}
        <div className="flex flex-wrap items-center gap-2 max-w-full min-w-0">
          <select
            id={presetSelectId}
            aria-label="Choose Image Preset"
            value={selectedPreset}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedPreset(val);
              const origCanvas = originalCanvasRef.current;
              if (origCanvas) {
                const ctx = origCanvas.getContext('2d');
                if (ctx) {
                  origCanvas.width = 600;
                  origCanvas.height = 400;
                  if (val === 'sunset') {
                    drawSampleImage(ctx, 600, 400);
                    setImageLoaded(true);
                    processImage();
                  } else if (val === 'wave') {
                    drawWaveImage(ctx, 600, 400);
                    setImageLoaded(true);
                    processImage();
                  } else if (val === 'forest') {
                    drawForestImage(ctx, 600, 400);
                    setImageLoaded(true);
                    processImage();
                  } else if (val === 'initial' && initialImageSrc) {
                    loadImageFromUrl(initialImageSrc);
                  }
                }
              }
            }}
            className="text-xs px-2.5 py-1.5 rounded border border-paper-border dark:border-carbon-border bg-paper-bg dark:bg-carbon-bg text-paper-text dark:text-carbon-text font-medium cursor-pointer max-w-full truncate min-w-0"
          >
            <option value="sunset">🌄 Mountain Sunset Preset</option>
            <option value="wave">🌊 Ocean Wave Preset</option>
            <option value="forest">🌲 Foggy Pine Forest Preset</option>
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
            className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded bg-paper-accent dark:bg-carbon-accent text-white hover:opacity-90 transition-opacity shrink-0"
          >
            📷 Upload Custom Image
          </label>
        </div>
      </div>

      {/* Control Sliders Grid (Extended up to 30 Inks) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4 bg-paper-border/20 dark:bg-carbon-border/20 p-4 rounded-lg text-xs min-w-0">
        
        {/* Palette Size Slider & Number Text Box (3 to 30 Inks) */}
        <div className="min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center font-medium mb-1 gap-1.5">
              <label htmlFor={kSliderId} className="truncate" title="Total Ink Colors (K-Means Clusters)">
                Total Ink Colors (K-Means):
              </label>
              <div className="flex items-center gap-1 shrink-0">
                <input
                  type="number"
                  min="3"
                  max="30"
                  value={paletteSize}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) {
                      const clamped = Math.min(30, Math.max(3, val));
                      setPaletteSize(clamped);
                      setCurrentStep(clamped);
                    }
                  }}
                  aria-label="Total Ink Colors (K-Means Clusters)"
                  className="w-12 px-1 py-0.5 text-xs text-center font-mono font-bold rounded border border-paper-border dark:border-carbon-border bg-paper-bg dark:bg-carbon-bg text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">Inks</span>
              </div>
            </div>
            <input
              id={kSliderId}
              type="range"
              min="3"
              max="30"
              value={paletteSize}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setPaletteSize(val);
                setCurrentStep(val);
              }}
              className="w-full accent-blue-600 min-w-0 cursor-pointer"
            />
          </div>
          <div className="text-[10px] text-paper-muted dark:text-carbon-muted mt-2 pt-1 border-t border-paper-border/30 dark:border-carbon-border/30 truncate">
            Up to 30 reduction layers
          </div>
        </div>

        {/* Spatial Blur Slider */}
        <div className="min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center font-medium mb-1">
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
              className="w-full accent-blue-600 min-w-0 cursor-pointer"
            />
          </div>
          <div className="text-[10px] text-paper-muted dark:text-carbon-muted mt-2 pt-1 border-t border-paper-border/30 dark:border-carbon-border/30 truncate">
            Simulates gouge stroke smoothing
          </div>
        </div>

        {/* Mother Color Mix Slider & Staged Picker */}
        <div className="min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center font-medium mb-1">
              <label htmlFor={motherMixSliderId}>Mother Color Undertone:</label>
              <span className="font-mono font-bold">{motherMix}%</span>
            </div>
            <input
              id={motherMixSliderId}
              type="range"
              min="0"
              max="30"
              value={motherMix}
              onChange={(e) => setMotherMix(parseInt(e.target.value))}
              className="w-full accent-blue-600 min-w-0 cursor-pointer"
            />
          </div>

          {/* Staged Mother Color Selector with explicit Set Color button */}
          <div className="flex items-center justify-between gap-1.5 mt-2 pt-1 border-t border-paper-border/30 dark:border-carbon-border/30">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border border-paper-border dark:border-carbon-border bg-paper-bg dark:bg-carbon-bg shrink-0">
              <input
                id={motherColorPickerId}
                type="color"
                aria-label="Mother Color Undertone Picker"
                value={pendingMotherHex}
                onChange={(e) => setPendingMotherHex(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setMotherHex(pendingMotherHex);
                  }
                }}
                className="w-4 h-4 rounded cursor-pointer border-none bg-transparent p-0 block"
                title="Select Mother Color undertone tint"
              />
              <span className="font-mono text-[11px] uppercase font-semibold text-paper-muted dark:text-carbon-muted">
                {pendingMotherHex}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMotherHex(pendingMotherHex)}
              disabled={pendingMotherHex.toLowerCase() === motherHex.toLowerCase()}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all shrink-0 ${
                pendingMotherHex.toLowerCase() !== motherHex.toLowerCase()
                  ? 'bg-paper-accent dark:bg-carbon-accent text-white hover:opacity-90 active:scale-95 shadow-xs cursor-pointer'
                  : 'bg-paper-border/30 dark:bg-carbon-border/30 text-paper-muted dark:text-carbon-muted opacity-50 cursor-not-allowed'
              }`}
              title={
                pendingMotherHex.toLowerCase() !== motherHex.toLowerCase()
                  ? 'Apply this undertone to palette'
                  : 'Undertone is already active'
              }
            >
              {pendingMotherHex.toLowerCase() !== motherHex.toLowerCase() ? '+ Set Color' : 'Active'}
            </button>
          </div>
        </div>

        {/* Ink Pass Stepper Slider (Smooth Draggable) */}
        <div className="min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center font-medium mb-1">
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
              className="w-full accent-green-600 min-w-0 cursor-pointer"
            />
          </div>
          <div className="text-[10px] text-paper-muted dark:text-carbon-muted mt-2 pt-1 border-t border-paper-border/30 dark:border-carbon-border/30 truncate">
            Drag to step through reduction cuts
          </div>
        </div>

      </div>

      {/* Settings & Inks Controls Toolbar (Spaced into distinct rows to prevent overlap) */}
      <div className="bg-paper-border/15 dark:bg-carbon-border/15 border border-paper-border/30 dark:border-carbon-border/30 rounded-xl p-4 mb-6 space-y-4 text-xs min-w-0">
        
        {/* Row 1: Engine Color Science & Press Transfer Settings */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-paper-border/20 dark:border-carbon-border/20 min-w-0">
          
          {/* Color Space Selector */}
          <div className="flex items-center gap-2 min-w-0 flex-wrap sm:flex-nowrap">
            <label htmlFor={colorSpaceSelectId} className="font-semibold text-paper-muted dark:text-carbon-muted shrink-0">
              Color Space:
            </label>
            <select
              id={colorSpaceSelectId}
              aria-label="Color Space"
              value={colorSpace}
              onChange={(e) => setColorSpace(e.target.value as 'lab' | 'false-lab' | 'rgb')}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-paper-border dark:border-carbon-border bg-paper-bg dark:bg-carbon-bg text-paper-text dark:text-carbon-text cursor-pointer font-medium max-w-full sm:max-w-xs truncate min-w-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="lab">✨ CIELAB Perceptual (GIMP Plugin Standard)</option>
              <option value="false-lab">🔮 Serendipitous False CIELAB ("View From A Distance")</option>
              <option value="rgb">🎨 Standard sRGB</option>
            </select>
          </div>

          {/* Toggle Switches: Cumulative Mode & Press Mirror */}
          <div className="flex items-center gap-4 font-medium flex-wrap shrink-0">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isCumulativeMode}
                onChange={(e) => setIsCumulativeMode(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
              <span className="text-paper-text dark:text-carbon-text">Cumulative Transfer Mode</span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isMirrored}
                onChange={(e) => setIsMirrored(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
              <span className="text-paper-text dark:text-carbon-text">🪞 Press Mirror</span>
            </label>
          </div>
        </div>

        {/* Row 2: Eyedropper & Staged Custom Ink Picker */}
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={handleToggleEyedropper}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 shadow-xs active:scale-95 ${
                isEyedropperActive
                  ? 'bg-red-600 text-white ring-2 ring-red-400 animate-pulse'
                  : 'bg-paper-text text-paper-bg dark:bg-carbon-text dark:text-carbon-bg hover:opacity-90'
              }`}
              title="Pick a color from either image to lock it into your ink palette"
            >
              <span>🎯</span>
              <span>{isEyedropperActive ? 'Click Image to Pick (Esc to Cancel)' : 'Eyedropper (Pick Color)'}</span>
            </button>

            {/* Staged Custom Color Picker with explicit Add button */}
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-paper-border dark:border-carbon-border bg-paper-bg dark:bg-carbon-bg shrink-0">
              <input
                id={customColorInputId}
                type="color"
                value={pendingCustomColor}
                onChange={(e) => setPendingCustomColor(e.target.value)}
                className="w-5 h-5 rounded cursor-pointer border-none bg-transparent p-0 block"
                title="Select a custom color to lock"
              />
              <span className="font-mono text-[11px] uppercase font-semibold text-paper-muted dark:text-carbon-muted">
                {pendingCustomColor}
              </span>
              <button
                type="button"
                onClick={() => addPinnedColor(pendingCustomColor)}
                className="px-2 py-0.5 rounded text-[11px] font-semibold bg-paper-accent dark:bg-carbon-accent text-white hover:opacity-90 active:scale-95 transition-all"
                title="Lock this color into the palette"
              >
                + Lock Color
              </button>
            </div>
          </div>

          {/* Pinned Swatches Chips */}
          {pinnedColors.length > 0 ? (
            <div className="flex items-center gap-1.5 flex-wrap min-w-0 pl-1 border-l border-paper-border/30 dark:border-carbon-border/30">
              <span className="text-[11px] font-semibold text-paper-muted dark:text-carbon-muted shrink-0">
                Locked Inks ({pinnedColors.length}):
              </span>
              {pinnedColors.map((hex) => (
                <span
                  key={hex}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono border border-paper-border dark:border-carbon-border bg-paper-bg dark:bg-carbon-bg shadow-2xs shrink-0"
                >
                  <span className="w-2.5 h-2.5 rounded-full border border-black/20 inline-block" style={{ backgroundColor: hex }} />
                  <span>{hex.toUpperCase()}</span>
                  <button
                    type="button"
                    onClick={() => removePinnedColor(hex)}
                    className="text-paper-muted hover:text-red-600 font-bold ml-1 transition-colors leading-none"
                    title="Remove locked color"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <span className="text-[11px] text-paper-muted dark:text-carbon-muted italic shrink-0">
              No locked colors. Click Eyedropper or + Custom Color to lock specific inks.
            </span>
          )}
        </div>

        {/* Eyedropper Active Banner */}
        {isEyedropperActive && (
          <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 font-medium text-xs flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <span className="animate-bounce">🎯</span>
              <span>Click or tap anywhere on either image below to lock that exact color into your ink palette.</span>
            </span>
            <button
              type="button"
              onClick={() => setIsEyedropperActive(false)}
              className="px-2 py-0.5 rounded border border-red-500/40 hover:bg-red-500/20 text-[11px] font-semibold shrink-0"
            >
              Cancel (Esc)
            </button>
          </div>
        )}

      </div>

      {/* Tab Navigation Controls (Scrollable on small screens without expanding page) */}
      <div className="flex border-b border-paper-border dark:border-carbon-border mb-4 text-xs font-semibold overflow-x-auto whitespace-nowrap max-w-full min-w-0">
        <button
          onClick={() => setActiveTab('canvas')}
          className={`px-4 py-2 border-b-2 transition-colors shrink-0 ${
            activeTab === 'canvas'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-paper-muted dark:text-carbon-muted hover:text-paper-text'
          }`}
        >
          🖼️ Studio Canvas View
        </button>
        <button
          onClick={() => setActiveTab('swatches')}
          className={`px-4 py-2 border-b-2 transition-colors shrink-0 ${
            activeTab === 'swatches'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-paper-muted dark:text-carbon-muted hover:text-paper-text'
          }`}
        >
          🎨 Ink Palette ({swatches.length})
        </button>
        <button
          onClick={() => setActiveTab('script')}
          className={`px-4 py-2 border-b-2 transition-colors shrink-0 ${
            activeTab === 'script'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-paper-muted dark:text-carbon-muted hover:text-paper-text'
          }`}
        >
          📜 Carving Script Guide
        </button>
      </div>

      {/* Tab Content: Canvas View (Kept mounted to preserve canvas pixel buffer) */}
      <div className={activeTab === 'canvas' ? 'grid grid-cols-1 md:grid-cols-2 gap-6 items-start min-w-0' : 'hidden'}>
        {/* Source Image Canvas */}
        <div className="flex flex-col items-center min-w-0 w-full">
          <div className="flex items-center justify-between w-full min-h-[38px] mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-paper-muted dark:text-carbon-muted">
              Continuous Tone Input
            </span>
            {isEyedropperActive ? (
              <span className="text-xs text-red-500 font-semibold animate-pulse flex items-center gap-1">
                <span>🎯</span>
                <span>Click image to sample</span>
              </span>
            ) : (
              <span className="text-[11px] font-mono text-paper-muted dark:text-carbon-muted">
                Original Input
              </span>
            )}
          </div>
          <div
            onClick={handleSourceClick}
            className={`w-full max-w-full overflow-hidden rounded-xl border border-paper-border dark:border-carbon-border bg-black/5 flex items-center justify-center p-2 min-w-0 transition-all ${
              isEyedropperActive ? 'cursor-crosshair ring-2 ring-red-500 shadow-md' : ''
            }`}
          >
            <canvas
              ref={originalCanvasRef}
              className={`max-w-full w-full h-auto rounded-lg shadow-sm transition-transform duration-300 block ${
                isMirrored ? '-scale-x-100' : ''
              }`}
            />
          </div>
        </div>

        {/* Quantized & Cumulative Reduction Output Canvas */}
        <div className="flex flex-col items-center min-w-0 w-full">
          <div className="flex items-center justify-between w-full min-h-[38px] mb-2 flex-wrap gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-mono uppercase tracking-wider text-paper-muted dark:text-carbon-muted truncate">
                Reduction Layer Output (Pass 1–{currentStep})
              </span>
              {isProcessing && (
                <span className="text-xs text-blue-500 animate-pulse font-medium shrink-0">Calculating...</span>
              )}
            </div>

            {/* The Singular Save Image Button */}
            <button
              type="button"
              onClick={handleSaveImage}
              disabled={!quantizedImageUrl || isProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-all bg-blue-600 hover:bg-blue-700 active:scale-95 text-white disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              title="Save quantized reduction image to your device"
            >
              {saveFeedback ? (
                <>
                  <span className="font-bold">✓</span>
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>Save Image</span>
                </>
              )}
            </button>
          </div>

          <div
            onClick={handleOutputClick}
            className={`w-full max-w-full overflow-hidden rounded-xl border border-paper-border dark:border-carbon-border bg-black/5 flex flex-col items-center justify-center p-2 min-w-0 relative group transition-all ${
              isEyedropperActive ? 'cursor-crosshair ring-2 ring-red-500 shadow-md' : ''
            }`}
          >
            {/* Calculation canvas kept mounted for pixel operations */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Displayed Image Element: Enables native mobile long-press (Save to Photos) & desktop right-click */}
            {quantizedImageUrl ? (
              <img
                src={quantizedImageUrl}
                alt={`Quantized Reduction Layer Output - Pass ${currentStep} of ${swatches.length || paletteSize}${
                  isMirrored ? ' (Mirrored for Block Transfer)' : ''
                }`}
                className="max-w-full w-full h-auto rounded-lg shadow-sm block transition-transform duration-300 pointer-events-auto"
                style={{
                  WebkitTouchCallout: 'default',
                }}
              />
            ) : (
              <div className="py-20 text-xs text-paper-muted dark:text-carbon-muted flex flex-col items-center gap-2">
                <span className="animate-spin text-lg">⏳</span>
                <span>Rendering preview...</span>
              </div>
            )}
          </div>

          {/* Clean helper caption without duplicate buttons */}
          <div className="w-full mt-2 text-xs">
            <p className="text-[11px] text-paper-muted dark:text-carbon-muted text-center sm:text-left">
              💡 Long-press on mobile or right-click on desktop to save/copy image, or click Save Image.
            </p>
          </div>
        </div>
      </div>

      {/* Tab Content: Ink Swatches Grid */}
      <div className={activeTab === 'swatches' ? 'grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 min-w-0' : 'hidden'}>
        {swatches.map((swatch) => (
          <div
            key={swatch.hex}
            className={`p-3 rounded-lg border text-xs flex flex-col items-center transition-all min-w-0 ${
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
      <div className={activeTab === 'script' ? 'bg-paper-bg dark:bg-carbon-bg p-4 rounded-lg border border-paper-border dark:border-carbon-border text-xs font-mono leading-relaxed space-y-3 min-w-0 overflow-x-auto' : 'hidden'}>
        <div className="text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
          --- AUTOMATED REDUCTION CARVING INSTRUCTIONS ---
        </div>
        <div>Organized by Perceived Luminance (Lightest to Darkest).</div>
        
        <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-yellow-800 dark:text-yellow-200">
          <strong>Step 0 (Initial Highlight Carve):</strong><br />
          Carve away all paper-white highlight areas on the un-inked linoleum block before printing Pass 1.
        </div>

        {swatches.map((swatch, idx) => (
          <div key={swatch.hex} className="p-2 border border-paper-border dark:border-carbon-border rounded flex items-center justify-between min-w-0 gap-2">
            <div className="min-w-0">
              <strong>Step {idx + 1}: Print Ink Pass {swatch.inkPass} ({swatch.hex}) {swatch.isPinned ? '📌 [Pinned Ink]' : ''}</strong>
              <div className="text-[11px] text-paper-muted dark:text-carbon-muted font-sans mt-0.5">
                {idx < swatches.length - 1
                  ? `After printing, carve away all regions that should remain ${swatch.hex} on paper.`
                  : 'Final pass completed! Lock in final dark outlines and detail cuts.'}
              </div>
            </div>
            <div className="w-6 h-6 rounded border shrink-0" style={{ backgroundColor: swatch.hex }} />
          </div>
        ))}
      </div>

    </div>
  );
};
