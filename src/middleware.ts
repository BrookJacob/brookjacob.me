/**
 * Astro Middleware
 * 
 * Intercepts requests to check host domain and path.
 * Restricts direct access to /prints and /code routes on the root domain,
 * redirecting them to printmaker.brookjacob.studio and developer.brookjacob.studio.
 */

import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async ({ url, redirect }, next) => {
  const hostname = url.hostname || '';
  const pathname = url.pathname;

  const isPrintsRoute = pathname === '/prints' || pathname.startsWith('/prints/');
  const isCodeRoute = pathname === '/code' || pathname.startsWith('/code/');

  // Check if request is hitting root domain (or root local dev host)
  const isRootDomain =
    hostname.includes('brookjacob.studio') &&
    !hostname.startsWith('printmaker.') &&
    !hostname.startsWith('developer.');

  const isRootLocal = hostname.includes('localhost') || hostname.includes('127.0.0.1');

  if (isRootDomain || isRootLocal) {
    if (isPrintsRoute) {
      return redirect(`https://printmaker.brookjacob.studio${pathname}`, 307);
    }
    if (isCodeRoute) {
      return redirect(`https://developer.brookjacob.studio${pathname}`, 307);
    }
  }

  return next();
});
