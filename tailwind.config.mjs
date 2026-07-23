/**
 * Tailwind CSS Configuration Module
 * 
 * Defines theme design tokens for Paper & Charcoal Ink palette,
 * font stacks for editorial serif typography and clean sans-serif body,
 * and dark mode configuration via media preference.
 * 
 * @type {import('tailwindcss').Config}
 */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        paper: {
          bg: '#FBF9F5',
          text: '#1C1B1A',
          muted: '#6B6965',
          border: '#E5E2DA',
          accent: '#C85A32',
        },
        carbon: {
          bg: '#141413',
          text: '#E6E4DD',
          muted: '#9E9C96',
          border: '#2A2927',
          accent: '#E07A5F',
        },
      },
      fontFamily: {
        serif: ['Charter', 'Bitstream Charter', 'Sitka Text', 'Cambria', 'Georgia', 'serif'],
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
