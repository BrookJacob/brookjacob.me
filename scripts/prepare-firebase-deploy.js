/**
 * Prepare Firebase Multi-Site Deployment Script
 * 
 * Separates Astro build output (dist) into 3 isolated deployment targets:
 *  1. dist/portal -> deployed to root-portal (brookjacob.studio / brookjacob.me)
 *  2. dist/prints -> deployed to prints-portfolio (printmaker.brookjacob.studio)
 *  3. dist/code   -> deployed to code-portfolio (developer.brookjacob.studio)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const distDir = path.join(projectRoot, 'dist');
const portalDir = path.join(distDir, 'portal');
const printsDir = path.join(distDir, 'prints');
const codeDir = path.join(distDir, 'code');

console.log('🚀 Preparing isolated Firebase multi-site deployment targets...');

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

// Read initial root entries right after astro build
const rootEntries = fs.readdirSync(distDir, { withFileTypes: true });

// 1. Prepare Portal Target (dist/portal)
// Contains portal index.html, blog, images, _astro, but NO prints/ or code/
fs.mkdirSync(portalDir, { recursive: true });
for (const entry of rootEntries) {
  if (entry.name !== 'portal' && entry.name !== 'prints' && entry.name !== 'code') {
    const srcPath = path.join(distDir, entry.name);
    const destPath = path.join(portalDir, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
console.log('✅ Created isolated dist/portal output (no /prints or /code routes present)');

// 2. Prepare Prints Target (dist/prints)
if (fs.existsSync(printsDir)) {
  const tempPrintsDir = path.join(distDir, '_temp_prints');
  copyDirSync(printsDir, tempPrintsDir);

  fs.rmSync(printsDir, { recursive: true, force: true });
  fs.mkdirSync(printsDir, { recursive: true });

  for (const entry of rootEntries) {
    if (entry.name !== 'portal' && entry.name !== 'prints' && entry.name !== 'code' && entry.name !== 'index.html' && entry.name !== 'blog') {
      const srcPath = path.join(distDir, entry.name);
      const destPath = path.join(printsDir, entry.name);
      if (entry.isDirectory()) {
        copyDirSync(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  copyDirSync(tempPrintsDir, printsDir);
  fs.rmSync(tempPrintsDir, { recursive: true, force: true });
  console.log('✅ Created isolated dist/prints output for printmaker.brookjacob.studio');
}

// 3. Prepare Code Target (dist/code)
if (fs.existsSync(codeDir)) {
  const tempCodeDir = path.join(distDir, '_temp_code');
  copyDirSync(codeDir, tempCodeDir);

  fs.rmSync(codeDir, { recursive: true, force: true });
  fs.mkdirSync(codeDir, { recursive: true });

  for (const entry of rootEntries) {
    if (entry.name !== 'portal' && entry.name !== 'prints' && entry.name !== 'code' && entry.name !== 'index.html' && entry.name !== 'blog') {
      const srcPath = path.join(distDir, entry.name);
      const destPath = path.join(codeDir, entry.name);
      if (entry.isDirectory()) {
        copyDirSync(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  copyDirSync(tempCodeDir, codeDir);
  fs.rmSync(tempCodeDir, { recursive: true, force: true });
  console.log('✅ Created isolated dist/code output for developer.brookjacob.studio');
}

console.log('🎉 Isolated multi-site build preparation complete!');
