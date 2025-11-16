/**
 * Unit tests for Upload Controller
 */
jest.mock('epub', () => jest.fn(), { virtual: true });

const uploadController = require('../../../controllers/upload.controller');
const uploadService = require('../../../services/upload.service');
const logger = require('../../../utils/logger');

jest.mock('../../../services/upload.service');
jest.mock('../../../utils/logger');

describe('UploadController', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      auth: {
        payload: {
          sub: 'user-123'
        }
      },
      file: {
        buffer: Buffer.from('file'),
        originalname: 'book.epub',
        size: 1234
      },
      body: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      headersSent: false
    };

    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    test('should process file upload successfully', async () => {
      const result = { id: 'upload-1' };
      uploadService.processFileUpload = jest.fn().mockResolvedValue(result);

      await uploadController.uploadFile(req, res);

      expect(uploadService.processFileUpload).toHaveBeenCalledWith(
        req.file.buffer,
        req.file.originalname,
        req.file.size,
        'user-123'
      );
      expect(res.json).toHaveBeenCalledWith(result);
    });

    test('should default userId to anonymous when auth missing', async () => {
      req.auth = null;
      const result = { id: 'upload-1' };
      uploadService.processFileUpload = jest.fn().mockResolvedValue(result);

      await uploadController.uploadFile(req, res);

      expect(uploadService.processFileUpload).toHaveBeenCalledWith(
        req.file.buffer,
        req.file.originalname,
        req.file.size,
        'anonymous'
      );
    });

    test('should return 400 when file missing', async () => {
      req.file = null;

      await uploadController.uploadFile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'No file uploaded' });
      expect(uploadService.processFileUpload).not.toHaveBeenCalled();
    });

    test('should return 400 for validation errors', async () => {
      uploadService.processFileUpload = jest.fn().mockRejectedValue(new Error('Invalid file type'));

      await uploadController.uploadFile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid file type' });
    });

    test('should return 504 for timeout errors', async () => {
      uploadService.processFileUpload = jest.fn().mockRejectedValue(new Error('Processing timeout'));

      await uploadController.uploadFile(req, res);

      expect(res.status).toHaveBeenCalledWith(504);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Upload processing timed out',
        message: 'The file upload is taking too long. Please try a smaller file or try again later.'
      });
    });

    test('should return 500 for other errors', async () => {
      uploadService.processFileUpload = jest.fn().mockRejectedValue(new Error('Unexpected failure'));

      await uploadController.uploadFile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to upload file',
        message: 'Unexpected failure'
      });
      expect(logger.error).toHaveBeenCalled();
    });

    test('should not send response if headers already sent', async () => {
      res.headersSent = true;
      uploadService.processFileUpload = jest.fn().mockRejectedValue(new Error('Unexpected failure'));

      await uploadController.uploadFile(req, res);

      expect(res.status).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        'Headers already sent, cannot send error response'
      );
    });
  });

  describe('uploadFromUrl', () => {
    beforeEach(() => {
      req.body.url = 'https://example.com/book.epub';
    });

    test('should process upload from URL successfully', async () => {
      const result = { id: 'upload-2' };
      uploadService.processUrlUpload = jest.fn().mockResolvedValue(result);

      await uploadController.uploadFromUrl(req, res);

      expect(uploadService.processUrlUpload).toHaveBeenCalledWith(req.body.url, 'user-123');
      expect(res.json).toHaveBeenCalledWith(result);
    });

    test('should default userId to anonymous when auth missing', async () => {
      req.auth = null;
      const result = { id: 'upload-2' };
      uploadService.processUrlUpload = jest.fn().mockResolvedValue(result);

      await uploadController.uploadFromUrl(req, res);

      expect(uploadService.processUrlUpload).toHaveBeenCalledWith(req.body.url, 'anonymous');
    });

    test('should return 400 when url missing', async () => {
      req.body.url = '';

      await uploadController.uploadFromUrl(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'URL is required' });
      expect(uploadService.processUrlUpload).not.toHaveBeenCalled();
    });

    test('should return 408 for timeout errors', async () => {
      uploadService.processUrlUpload = jest.fn().mockRejectedValue(new Error('Download timeout'));

      await uploadController.uploadFromUrl(req, res);

      expect(res.status).toHaveBeenCalledWith(408);
      expect(res.json).toHaveBeenCalledWith({ error: 'Download timeout' });
    });

    test('should return 400 for invalid URL errors', async () => {
      uploadService.processUrlUpload = jest.fn().mockRejectedValue(new Error('Invalid URL provided'));

      await uploadController.uploadFromUrl(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid URL provided' });
    });

    test('should handle other errors with 500', async () => {
      uploadService.processUrlUpload = jest.fn().mockRejectedValue(new Error('Unexpected failure'));

      await uploadController.uploadFromUrl(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to upload file from URL',
        message: 'Unexpected failure'
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
