/**
 * Astro Middleware
 * 
 * Clean pass-through middleware for static monorepo routing.
 */

import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  return next();
});
