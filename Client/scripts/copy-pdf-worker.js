/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Post-install script to copy PDF.js worker file to public directory
 * This ensures the worker is available for the PDF viewer component
 */

const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..');
// react-pdf-highlighter uses pdfjs-dist 4.4.168, we must use that version's worker
const highlighterWorker = path.join(
  baseDir,
  'node_modules',
  'react-pdf-highlighter',
  'node_modules',
  'pdfjs-dist',
  'build',
  'pdf.worker.min.mjs',
);
const rootWorker = path.join(baseDir, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');

// Prefer the react-pdf-highlighter version since that's what the library expects
const source = fs.existsSync(highlighterWorker) ? highlighterWorker : rootWorker;
const destination = path.join(baseDir, 'public', 'pdf.worker.min.mjs');

console.log('Looking for PDF.js worker...');
console.log('Highlighter worker path:', highlighterWorker);
console.log('Highlighter worker exists:', fs.existsSync(highlighterWorker));
console.log('Root worker path:', rootWorker);
console.log('Root worker exists:', fs.existsSync(rootWorker));

try {
  // Check if source file exists
  if (!fs.existsSync(source)) {
    console.error('❌ PDF.js worker file not found at:', source);
    process.exit(1);
  }

  // Ensure public directory exists
  const publicDir = path.dirname(destination);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Copy the worker file
  fs.copyFileSync(source, destination);
  console.log('✅ PDF.js worker file copied from:', source.includes('react-pdf-highlighter') ? 'react-pdf-highlighter/node_modules/pdfjs-dist' : 'node_modules/pdfjs-dist');
} catch (error) {
  console.error('❌ Error copying PDF.js worker file:', error.message);
  process.exit(1);
}
