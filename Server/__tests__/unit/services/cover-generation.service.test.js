jest.mock('fs');
jest.mock('sharp');
jest.mock('file-type');
jest.mock('../../../utils/helpers', () => ({
  randomFileName: jest.fn()
}));

const fs = require('fs');
const sharp = require('sharp');
const FileType = require('file-type');
const { randomFileName } = require('../../../utils/helpers');
const CoverGenerationService = require('../../../services/cover-generation.service');

const uploadServiceMock = {
  uploadFileToStorage: jest.fn()
};

const coverService = new CoverGenerationService(uploadServiceMock);

describe('CoverGenerationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    randomFileName.mockReset();
  });

  describe('processAndUploadCover', () => {
    test('uploads original and thumbnail covers', async () => {
      const buffer = Buffer.from('cover');
      randomFileName
        .mockReturnValueOnce('original-name')
        .mockReturnValueOnce('thumb-name');
      FileType.fromBuffer.mockResolvedValue({ ext: 'jpg', mime: 'image/jpeg' });
      uploadServiceMock.uploadFileToStorage
        .mockResolvedValueOnce({ fileName: 'covers/originals/original-name.jpg' })
        .mockResolvedValueOnce({ fileName: 'covers/thumbs/thumb-name.webp' });
      sharp.mockReturnValue({ resize: jest.fn().mockReturnThis(), webp: jest.fn().mockReturnThis(), toBuffer: jest.fn().mockResolvedValue(buffer) });

      const result = await coverService.processAndUploadCover(buffer, 'book', 'user-1');

      expect(uploadServiceMock.uploadFileToStorage).toHaveBeenCalledTimes(2);
      expect(uploadServiceMock.uploadFileToStorage).toHaveBeenNthCalledWith(
        1,
        buffer,
        'covers/originals/original-name.jpg',
        expect.objectContaining({ originalName: 'book-cover.jpg', userId: 'user-1' }),
        'image/jpeg'
      );
      expect(uploadServiceMock.uploadFileToStorage).toHaveBeenNthCalledWith(
        2,
        buffer,
        'covers/thumbs/thumb-name.webp',
        expect.objectContaining({ originalName: 'book-thumb.webp', userId: 'user-1' }),
        'image/webp'
      );
      expect(result).toEqual({
        original: { fileName: 'covers/originals/original-name.jpg' },
        thumbnail: { fileName: 'covers/thumbs/thumb-name.webp' }
      });
    });

    test('defaults file type when detection fails', async () => {
      const buffer = Buffer.from('cover');
      randomFileName
        .mockReturnValueOnce('original-name')
        .mockReturnValueOnce('thumb-name');
      FileType.fromBuffer.mockResolvedValue(null);
      uploadServiceMock.uploadFileToStorage
        .mockResolvedValueOnce({ fileName: 'covers/originals/original-name.png' })
        .mockResolvedValueOnce({ fileName: 'covers/thumbs/thumb-name.webp' });
      sharp.mockReturnValue({ resize: jest.fn().mockReturnThis(), webp: jest.fn().mockReturnThis(), toBuffer: jest.fn().mockResolvedValue(buffer) });

      const result = await coverService.processAndUploadCover(buffer, 'book', 'user-1');

      expect(uploadServiceMock.uploadFileToStorage).toHaveBeenNthCalledWith(
        1,
        buffer,
        'covers/originals/original-name.png',
        expect.objectContaining({ originalName: 'book-cover.png', userId: 'user-1' }),
        'image/png'
      );
      expect(result.thumbnail.fileName).toBe('covers/thumbs/thumb-name.webp');
    });
  });
});
