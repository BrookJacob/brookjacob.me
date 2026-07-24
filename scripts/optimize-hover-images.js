/**
 * Programmatic Image Optimization Utility
 * 
 * Uses Sharp to scan high-res screenshot images in `public/images/previews/raw/`,
 * resizes them to 600x338 (16:9 hover card aspect ratio), converts them to optimized WebP
 * (quality 80%), and outputs them to `public/images/previews/{able|satori}/`.
 * 
 * Usage:
 *   1. Drop raw PNG/JPG images into:
 *      - public/images/previews/raw/able/
 *      - public/images/previews/raw/satori/
 *   2. Run: npm run optimize-images
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const rawDir = path.join(projectRoot, 'public', 'images', 'previews', 'raw');
const outputBaseDir = path.join(projectRoot, 'public', 'images', 'previews');

const TARGET_WIDTH = 600;
const TARGET_HEIGHT = 338; // ~16:9 ratio
const WEBP_QUALITY = 80;

const subdirs = ['able', 'satori'];

async function optimizeImages() {
  console.log('🚀 Starting programmatic image optimization for hover cards...\n');

  // Ensure raw directories exist for user convenience
  for (const dir of subdirs) {
    const rawSubDir = path.join(rawDir, dir);
    const outSubDir = path.join(outputBaseDir, dir);
    if (!fs.existsSync(rawSubDir)) {
      fs.mkdirSync(rawSubDir, { recursive: true });
    }
    if (!fs.existsSync(outSubDir)) {
      fs.mkdirSync(outSubDir, { recursive: true });
    }
  }

  let processedCount = 0;

  for (const dir of subdirs) {
    const rawSubDir = path.join(rawDir, dir);
    const outSubDir = path.join(outputBaseDir, dir);

    const files = fs.readdirSync(rawSubDir);
    const imageFiles = files.filter((f) => /\.(png|jpg|jpeg|webp|tiff)$/i.test(f));

    if (imageFiles.length === 0) {
      console.log(`ℹ️  No raw images found in public/images/previews/raw/${dir}/`);
      console.log(`   (Drop PNG/JPG screenshots into public/images/previews/raw/${dir}/ and re-run)\n`);
      continue;
    }

    console.log(`📂 Processing ${imageFiles.length} image(s) for '${dir}'...`);

    let index = 1;
    for (const file of imageFiles) {
      const srcPath = path.join(rawSubDir, file);
      const outFileName = `slide${index}.webp`;
      const destPath = path.join(outSubDir, outFileName);

      const srcStats = fs.statSync(srcPath);

      await sharp(srcPath)
        .resize(TARGET_WIDTH, TARGET_HEIGHT, {
          fit: 'cover',
          position: 'top',
        })
        .webp({ quality: WEBP_QUALITY })
        .toFile(destPath);

      const destStats = fs.statSync(destPath);
      const savings = (((srcStats.size - destStats.size) / srcStats.size) * 100).toFixed(1);

      console.log(
        `  ✅ [${dir}] ${file} -> ${outFileName} (${(srcStats.size / 1024).toFixed(1)} KB -> ${(destStats.size / 1024).toFixed(1)} KB, -${savings}%)`
      );
      index++;
      processedCount++;
    }
    console.log('');
  }

  if (processedCount > 0) {
    console.log(`🎉 Successfully optimized ${processedCount} image(s)!`);
  } else {
    console.log('💡 Tip: You can place screenshots in public/images/previews/raw/able and raw/satori whenever you have images ready.');
  }
}

optimizeImages().catch((err) => {
  console.error('❌ Error optimizing images:', err);
  process.exit(1);
});
