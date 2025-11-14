const fs = require('fs');
const path = require('path');
// Before loading upload.service, stub out heavy external dependencies (Prisma and storage)
const Module = require('module');

// Helper to create a simple cached module export
function mockModule(modulePath, exportsObj) {
  const resolved = require.resolve(modulePath);
  const m = new Module(resolved, module);
  m.filename = resolved;
  m.exports = exportsObj;
  m.loaded = true;
  require.cache[resolved] = m;
}

// Mock database (Prisma) to avoid real DB connection during this test
mockModule(path.join(__dirname, '..', 'config', 'database.js'), {
  book: {
    create: async ({ data }) => {
      // return a fake book record
      return { id: 'mock-book-id', ...data, uploadedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    }
  }
});

// Mock storage to avoid real B2/S3 uploads
mockModule(path.join(__dirname, '..', 'config', 'storage.js'), {
  uploadToB2: async (buffer, fileName, metadata = {}, contentType = 'application/pdf') => {
    return {
      success: true,
      fileUrl: fileName,
      fileName,
      fileId: 'mock-file-id',
      uploadedAt: metadata.uploadedAt || new Date().toISOString()
    };
  },
  generatePresignedUrl: async (fileName, expiresIn = 3600) => {
    return `https://fake-storage.local/${fileName}`;
  }
});

const uploadService = require('../services/upload.service');

(async () => {
  try {
    const samples = [
      { rel: ['..', 'Cover_Image_Generator', 'Test', 'Python_Handbook.pdf'], label: 'PDF sample' },
      { rel: ['..', 'Cover_Image_Generator', 'Test', 'India.epub'], label: 'EPUB sample' },
      { rel: ['..', 'Cover_Image_Generator', 'Test', 'Project_plan.txt'], label: 'TXT sample' }
    ];

    const userId = process.env.TEST_USER_ID || 'test-user';

    console.log('Running processFileUpload on sample files (Python+Poppler required to actually create PNG for PDFs/EPUBs)');

    for (const s of samples) {
      const samplePath = path.join(__dirname, ...s.rel);
      if (!fs.existsSync(samplePath)) {
        console.warn(`${s.label} not found at ${samplePath}, skipping.`);
        continue;
      }

      try {
        console.log('\n---');
        console.log(`Processing ${s.label}:`, samplePath);
        const buffer = await fs.promises.readFile(samplePath);
        const origName = path.basename(samplePath);
        const size = buffer.length;

        const result = await uploadService.processFileUpload(buffer, origName, size, userId);
        console.log(`${s.label} result:`, JSON.stringify(result, null, 2));
      } catch (fileErr) {
        console.error(`${s.label} error:`, fileErr);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error('Error running test-gen-cover:', err);
    process.exit(2);
  }
})();
