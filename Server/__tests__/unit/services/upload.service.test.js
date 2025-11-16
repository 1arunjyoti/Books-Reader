/**
 * Unit tests for Upload Service
 */

const coverServiceMockInstance = {
  tryGenerateCoverSync: jest.fn(),
  generateCoverInBackground: jest.fn()
};

jest.mock('axios', () => jest.fn());
jest.mock('file-type', () => ({ fromBuffer: jest.fn() }));
jest.mock('uuid', () => ({ v4: jest.fn() }));
jest.mock('../../../config/storage', () => ({ uploadToB2: jest.fn() }));
jest.mock('../../../utils/pdfUtils', () => ({ extractPdfMetadata: jest.fn() }));
jest.mock('../../../utils/epubUtils', () => ({ extractEpubMetadata: jest.fn(), isValidEpub: jest.fn() }));
jest.mock('../../../utils/txtUtils', () => ({ extractTxtMetadata: jest.fn(), isValidTxt: jest.fn() }));
jest.mock('../../../utils/helpers', () => ({ randomFileName: jest.fn() }));
jest.mock('../../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));
jest.mock('../../../services/cover-generation.service', () =>
  jest.fn().mockImplementation(() => coverServiceMockInstance)
);

jest.mock('../../../config/database', () => ({
  book: {
    create: jest.fn()
  }
}));

const FileType = require('file-type');
const { v4: uuidv4 } = require('uuid');
const { uploadToB2 } = require('../../../config/storage');
const { extractPdfMetadata } = require('../../../utils/pdfUtils');
const { extractEpubMetadata, isValidEpub } = require('../../../utils/epubUtils');
const { extractTxtMetadata, isValidTxt } = require('../../../utils/txtUtils');
const { randomFileName } = require('../../../utils/helpers');
const prisma = require('../../../config/database');
const CoverGenerationService = require('../../../services/cover-generation.service');
const uploadService = require('../../../services/upload.service');

describe('UploadService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    coverServiceMockInstance.tryGenerateCoverSync.mockReset();
    coverServiceMockInstance.generateCoverInBackground.mockReset();
  });

  describe('determineFileType', () => {
    test('detects epub and txt extensions', () => {
      expect(uploadService.determineFileType('book.epub')).toBe('epub');
      expect(uploadService.determineFileType('notes.TXT')).toBe('txt');
      expect(uploadService.determineFileType('file.pdf')).toBe('pdf');
    });
  });

  describe('validateFile', () => {
    test('rejects files larger than 100MB', async () => {
      const buffer = Buffer.alloc((100 * 1024 * 1024) + 1);

      await expect(
        uploadService.validateFile(buffer, 'pdf', 'big.pdf')
      ).rejects.toThrow('File size exceeds 100MB limit');
    });

    test('validates pdf mime type', async () => {
      const buffer = Buffer.from('pdf');
      FileType.fromBuffer.mockResolvedValue({ mime: 'application/pdf' });

      await expect(
        uploadService.validateFile(buffer, 'pdf', 'doc.pdf')
      ).resolves.not.toThrow();

      FileType.fromBuffer.mockResolvedValue({ mime: 'text/plain' });

      await expect(
        uploadService.validateFile(buffer, 'pdf', 'doc.pdf')
      ).rejects.toThrow('Invalid file type. Only PDF files are allowed.');
    });

    test('validates epub files', async () => {
      const buffer = Buffer.from('epub');
      isValidEpub.mockReturnValue(true);

      await expect(uploadService.validateFile(buffer, 'epub', 'book.epub')).resolves.not.toThrow();

      isValidEpub.mockReturnValue(false);
      await expect(uploadService.validateFile(buffer, 'epub', 'book.epub')).rejects.toThrow('Invalid EPUB file.');
    });
  });

  describe('processFileUpload', () => {
    const buffer = Buffer.from('pdf-file');

    beforeEach(() => {
      randomFileName.mockReturnValue('random-name');
      uuidv4.mockReturnValue('book-id');
      extractPdfMetadata.mockResolvedValue({
        title: 'Test Title',
        author: 'Author',
        totalPages: 120,
        rawMetadata: { pages: 120 }
      });
      uploadToB2.mockResolvedValue({ fileUrl: 'https://cdn/file.pdf', fileId: 'file-1' });
      prisma.book.create.mockResolvedValue({ id: 'book-id', title: 'Test Title' });
      coverServiceMockInstance.tryGenerateCoverSync.mockResolvedValue({ fileName: 'covers/thumb.webp' });
    });

    test('processes PDF upload successfully with synchronous cover', async () => {
      FileType.fromBuffer.mockResolvedValue({ mime: 'application/pdf' });

      const result = await uploadService.processFileUpload(buffer, 'sample.pdf', buffer.length, 'user-1');

      expect(uploadToB2).toHaveBeenCalledWith(
        buffer,
        'random-name.pdf',
        expect.objectContaining({ originalName: 'sample.pdf', userId: 'user-1' }),
        undefined
      );
      expect(prisma.book.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'book-id',
          fileName: 'random-name.pdf',
          coverUrl: 'covers/thumb.webp'
        })
      });
      expect(result).toEqual(expect.objectContaining({
        success: true,
        coverGenerating: false,
        book: { id: 'book-id', title: 'Test Title' }
      }));
    });

    test('schedules background cover generation when sync result missing', async () => {
      FileType.fromBuffer.mockResolvedValue({ mime: 'application/pdf' });
      coverServiceMockInstance.tryGenerateCoverSync.mockResolvedValue(null);
      const setImmediateSpy = jest.spyOn(global, 'setImmediate').mockImplementation((fn) => fn());

      await uploadService.processFileUpload(buffer, 'sample.pdf', buffer.length, 'user-1');

      expect(coverServiceMockInstance.generateCoverInBackground).toHaveBeenCalledWith(
        'book-id',
        buffer,
        'pdf',
        'sample.pdf',
        'user-1'
      );

      setImmediateSpy.mockRestore();
    });
  });
});
