/**
 * Unit tests for storage configuration
 */

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(),
  PutObjectCommand: jest.fn().mockImplementation((args) => args),
  GetObjectCommand: jest.fn().mockImplementation((args) => args),
  DeleteObjectCommand: jest.fn().mockImplementation((args) => args)
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn()
}));

describe('Storage configuration', () => {
  const setEnv = () => {
    process.env.B2_ENDPOINT = 's3.us-west-002.backblazeb2.com';
    process.env.B2_KEY_ID = 'key';
    process.env.B2_APPLICATION_KEY = 'secret';
    process.env.B2_BUCKET_NAME = 'bucket';
  };

  const loadStorage = () => {
    let storage;
    jest.isolateModules(() => {
      storage = require('../../../config/storage');
    });
    return storage;
  };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('initializes storage client with B2 configuration', () => {
    setEnv();
    const { S3Client } = require('@aws-sdk/client-s3');
    const mockSend = jest.fn();
    S3Client.mockImplementation(() => ({ send: mockSend }));

    const storage = loadStorage();

    expect(S3Client.mock.calls[0][0]).toEqual(expect.objectContaining({
      endpoint: expect.stringContaining(process.env.B2_ENDPOINT),
      credentials: expect.objectContaining({ accessKeyId: 'key', secretAccessKey: 'secret' })
    }));
    expect(storage.storageClient).toBeDefined();
  });

  test('uploadToB2 sends PutObjectCommand', async () => {
    setEnv();
    const { S3Client } = require('@aws-sdk/client-s3');
    const mockSend = jest.fn().mockResolvedValue({ ETag: '123' });
    S3Client.mockImplementation(() => ({ send: mockSend }));
    const { uploadToB2, storageClient } = loadStorage();

    const result = await uploadToB2(Buffer.from('data'), 'file.pdf', { originalName: 'doc.pdf', size: 10 });

    expect(storageClient.send).toHaveBeenCalledWith(expect.objectContaining({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: 'file.pdf'
    }));
    expect(result).toEqual(expect.objectContaining({ success: true, fileName: 'file.pdf' }));
  });

  test('generatePresignedUrl calls getSignedUrl', async () => {
    setEnv();
    const { S3Client } = require('@aws-sdk/client-s3');
    const presigner = require('@aws-sdk/s3-request-presigner');
    const mockSend = jest.fn();
    S3Client.mockImplementation(() => ({ send: mockSend }));
    presigner.getSignedUrl.mockResolvedValue('https://signed');
    const { generatePresignedUrl } = loadStorage();

    const url = await generatePresignedUrl('file.pdf');

    expect(presigner.getSignedUrl).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: 'file.pdf'
    }), { expiresIn: 3600 });
    expect(url).toBe('https://signed');
  });

  test('deleteFromB2 sends DeleteObjectCommand', async () => {
    setEnv();
    const { S3Client } = require('@aws-sdk/client-s3');
    const mockSend = jest.fn().mockResolvedValue({});
    S3Client.mockImplementation(() => ({ send: mockSend }));
    const { deleteFromB2, storageClient } = loadStorage();

    const result = await deleteFromB2('file.pdf');

    expect(storageClient.send).toHaveBeenCalledWith(expect.objectContaining({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: 'file.pdf'
    }));
    expect(result).toEqual(expect.objectContaining({ deleted: true }));
  });
});
