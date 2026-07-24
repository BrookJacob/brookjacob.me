/**
 * Environment-Aware Domain URL Utility
 * 
 * In local development (DEV mode), links automatically route to Astro's dev server paths:
 *  - Portal: http://localhost:4321 (src/pages/index.astro)
 *  - Printmaker Studio: http://localhost:4321/prints (src/pages/prints/index.astro)
 *  - Developer Showcase: http://localhost:4321/code (src/pages/code/index.astro)
 *  - Blog: http://localhost:4321/blog (src/pages/blog/index.astro)
 * 
 * In production builds, links resolve to live production subdomains:
 *  - Portal: https://brookjacob.studio
 *  - Printmaker Studio: https://printmaker.brookjacob.studio
 *  - Developer Showcase: https://developer.brookjacob.studio
 *  - Blog: https://brookjacob.studio/blog
 */

const IS_DEV = import.meta.env.DEV;

export const DOMAINS = {
  portal: IS_DEV ? 'http://localhost:4321' : 'https://brookjacob.studio',
  prints: IS_DEV ? 'http://localhost:4321/prints' : 'https://printmaker.brookjacob.studio',
  code: IS_DEV ? 'http://localhost:4321/code' : 'https://developer.brookjacob.studio',
  blog: IS_DEV ? 'http://localhost:4321/blog' : 'https://brookjacob.studio/blog',
};
