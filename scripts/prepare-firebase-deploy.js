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

  // Copy top-level prints gallery index.html and print slug pages into dist/prints (resolves /nora, /whiskey, etc.)
  copyDirSync(tempPrintsDir, printsDir);

  // Mirror individual print slug subdirectories into dist/prints/prints/[slug] (resolves /prints/nora, /prints/whiskey, etc.)
  const nestedPrintsDir = path.join(printsDir, 'prints');
  fs.mkdirSync(nestedPrintsDir, { recursive: true });
  const printEntries = fs.readdirSync(tempPrintsDir, { withFileTypes: true });
  for (const entry of printEntries) {
    if (entry.isDirectory()) {
      copyDirSync(path.join(tempPrintsDir, entry.name), path.join(nestedPrintsDir, entry.name));
    }
  }

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

  // Copy top-level code showcase index.html and project slug pages into dist/code (resolves /able-roadmap, /satori-trailheads, etc.)
  copyDirSync(tempCodeDir, codeDir);

  // Mirror individual project slug subdirectories into dist/code/code/[slug] (resolves /code/able-roadmap, /code/satori-trailheads, etc.)
  const nestedCodeDir = path.join(codeDir, 'code');
  fs.mkdirSync(nestedCodeDir, { recursive: true });
  const codeEntries = fs.readdirSync(tempCodeDir, { withFileTypes: true });
  for (const entry of codeEntries) {
    if (entry.isDirectory()) {
      copyDirSync(path.join(tempCodeDir, entry.name), path.join(nestedCodeDir, entry.name));
    }
  }

  fs.rmSync(tempCodeDir, { recursive: true, force: true });
  console.log('✅ Created isolated dist/code output for developer.brookjacob.studio');
}

console.log('🎉 Isolated multi-site build preparation complete!');
