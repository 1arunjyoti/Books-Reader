/**
 * PDF.js Worker Initialization
 * 
 * This file MUST be imported before any PDF viewer components to ensure
 * the worker is properly configured before pdf js-dist tries to load from CDN.
 * 
 * react-pdf-highlighter bundles pdfjs-dist@4.4.168 which tries to load
 * the worker from unpkg.com, but our CSP blocks external scripts.
 * 
 * We must set GlobalWorkerOptions BEFORE any PDF loading occurs.
 */

import { logger } from './logger';

const WORKER_SRC = '/pdf.worker.min.mjs';

type WindowWithPdfJs = typeof window & {
  pdfjsLib?: {
    GlobalWorkerOptions?: {
      workerSrc?: string;
    };
  };
};

let workerInitPromise: Promise<void> | null = null;

/**
 * Ensure the local PDF.js worker is configured exactly once on the client.
 */
export function ensurePdfWorker(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  if (!workerInitPromise) {
    workerInitPromise = import('pdfjs-dist')
      .then((pdfjsLib) => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_SRC;

        // Configure fallback instance exposed via window if present
        const anyWindow = window as WindowWithPdfJs;
        if (anyWindow.pdfjsLib?.GlobalWorkerOptions) {
          anyWindow.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_SRC;
        }
      })
      .catch((err) => {
        logger.error('[PDF Init] Failed to configure worker:', err);
        workerInitPromise = null; // Allow retry on next call
        throw err;
      });
  }

  return workerInitPromise;
}

// Kick off worker configuration on module load for convenience
if (typeof window !== 'undefined') {
  void ensurePdfWorker();
}

export {}; 
