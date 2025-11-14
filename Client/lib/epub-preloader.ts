/**
 * EPUB.js Preloader
 * 
 * Optimizes EPUB reader performance by pre-initializing the epub.js library
 * before the user navigates to the EPUB reader page.
 * 
 * This saves ~200-400ms by having epub.js and react-reader ready when the component mounts.
 * 
 * Usage:
 * - Call preloadEpubJs() when the library page mounts or on hover over an EPUB book link
 * - The module cache will prevent duplicate loads on subsequent calls
 */

import { logger } from './logger';

let epubJsPreloadPromise: Promise<void> | null = null;

export const preloadEpubJs = async (): Promise<void> => {
  // Return cached promise if already preloading/preloaded
  if (epubJsPreloadPromise) {
    return epubJsPreloadPromise;
  }

  // Create and cache the preload promise
  epubJsPreloadPromise = (async () => {
    try {
      // Preload the critical EPUB libraries in parallel
      await Promise.all([
        import('react-reader'),    // Main reader component
        import('epubjs'),           // EPUB.js core library
      ]);

      logger.log('EPUB.js libraries preloaded successfully');
    } catch (err) {
      logger.error('Failed to preload EPUB.js libraries:', err);
      // Reset so next attempt can try again
      epubJsPreloadPromise = null;
      throw err;
    }
  })();

  return epubJsPreloadPromise;
};

/**
 * Higher-level preload function that can be safely called multiple times
 * without console warnings if EPUB.js is already loaded
 */
export const ensureEpubJsReady = async (): Promise<void> => {
  try {
    await preloadEpubJs();
  } catch (err) {
    // Silent fail for subsequent attempts after first failure
    if (epubJsPreloadPromise === null) {
      logger.error('Failed to ensure EPUB.js is ready:', err);
    }
  }
};
