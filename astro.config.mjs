/**
 * Astro Configuration Module
 * 
 * Configures the static site generator (SSG) output mode alongside
 * integrations for React (enabling Radix UI components) and Tailwind CSS.
 * 
 * @type {import('astro').AstroUserConfig}
 */
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'static',
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
});
