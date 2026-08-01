/**
 * @file src/lib/env.ts
 * @description Safe Environment Variable Reader for dual Browser (Vite/Astro) and Node.js execution.
 */

/**
 * Reads an environment variable safely across client (browser/Vite) and server/Node environments.
 * 
 * @param {string} key - Environment variable name (e.g. 'PUBLIC_FIREBASE_API_KEY' or 'HYGRAPH_ENDPOINT').
 * @param {string} [fallback=''] - Optional fallback default value.
 * @returns {string} Value of the environment variable or fallback string.
 */
export function getEnvVar(key: string, fallback = ''): string {
  // 1. Check Vite / Astro import.meta.env (Client & SSG build)
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      if (import.meta.env[key] !== undefined && import.meta.env[key] !== '') {
        return import.meta.env[key];
      }
      // Check prefix fallback (e.g. PUBLIC_HYGRAPH_ENDPOINT or HYGRAPH_ENDPOINT)
      const altKey = key.startsWith('PUBLIC_') ? key.replace('PUBLIC_', '') : `PUBLIC_${key}`;
      if (import.meta.env[altKey] !== undefined && import.meta.env[altKey] !== '') {
        return import.meta.env[altKey];
      }
    }
  } catch (_e) {
    // Ignore import.meta access errors
  }

  // 2. Check Node.js process.env (Build scripts / SSR)
  try {
    if (typeof process !== 'undefined' && process.env) {
      if (process.env[key] !== undefined && process.env[key] !== '') {
        return process.env[key];
      }
      const altKey = key.startsWith('PUBLIC_') ? key.replace('PUBLIC_', '') : `PUBLIC_${key}`;
      if (process.env[altKey] !== undefined && process.env[altKey] !== '') {
        return process.env[altKey];
      }
    }
  } catch (_e) {
    // Ignore process access errors
  }

  return fallback;
}
