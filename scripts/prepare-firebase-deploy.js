/**
 * Prepare Firebase Multi-Site Deployment Script
 * 
 * Copies built bundle assets (_astro directory) and public static assets
 * into dist/prints and dist/code target sub-directories so that multi-domain
 * Firebase hosting targets (printmaker.brookjacob.studio and developer.brookjacob.studio)
 * have full access to CSS stylesheets, JS hydration chunks, and image assets.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const distDir = path.join(projectRoot, 'dist');
const astroAssetsDir = path.join(distDir, '_astro');

const targets = ['prints', 'code'];

console.log('🚀 Preparing Firebase multi-site deployment assets...');

if (!fs.existsSync(distDir)) {
  console.error('❌ dist directory not found. Please run astro build first.');
  process.exit(1);
}

// Copy directory recursively
function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy _astro CSS/JS assets to each hosting target
for (const target of targets) {
  const targetDir = path.join(distDir, target);
  if (fs.existsSync(targetDir)) {
    // Copy _astro folder
    const targetAstroDir = path.join(targetDir, '_astro');
    copyDirSync(astroAssetsDir, targetAstroDir);
    console.log(`✅ Copied _astro assets to dist/${target}/_astro`);

    // Copy root public assets (e.g. avatar.jpg, avatar.jpg.jpg, favicon.svg)
    const files = fs.readdirSync(distDir);
    for (const file of files) {
      const filePath = path.join(distDir, file);
      const stat = fs.statSync(filePath);
      if (!stat.isDirectory() && file !== 'index.html') {
        fs.copyFileSync(filePath, path.join(targetDir, file));
      }
    }
    console.log(`✅ Copied static root assets to dist/${target}/`);
  }
}

console.log('🎉 Firebase deployment asset preparation complete!');
