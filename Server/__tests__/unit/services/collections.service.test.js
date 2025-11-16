/**
 * Unit tests for Collections Service
 */

jest.mock('../../../config/database', () => ({
  collection: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  book: {
    findMany: jest.fn()
  }
}));

jest.mock('../../../config/storage', () => ({
  generatePresignedUrl: jest.fn()
}));

jest.mock('../../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

const collectionsService = require('../../../services/collections.service');
const prisma = require('../../../config/database');
const { generatePresignedUrl } = require('../../../config/storage');
const logger = require('../../../utils/logger');

describe('CollectionsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCollections', () => {
    test('returns sorted collections', async () => {
      const collections = [{ id: 'col-1' }];
      prisma.collection.findMany.mockResolvedValue(collections);

      const result = await collectionsService.getAllCollections('user-1');

      expect(prisma.collection.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }]
      });
      expect(result).toBe(collections);
      expect(logger.debug).toHaveBeenCalledWith('Collections fetched', expect.any(Object));
    });
  });

  describe('createCollection', () => {
    test('creates collection when name valid', async () => {
      prisma.collection.findFirst.mockResolvedValueOnce(null);
      const created = { id: 'col-1', name: 'Favorites' };
      prisma.collection.create.mockResolvedValue(created);

      const result = await collectionsService.createCollection('user-1', {
        name: ' Favorites ',
        description: ' My favs '
      });

      expect(prisma.collection.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          name: 'Favorites',
          description: 'My favs',
          color: '#3b82f6',
          icon: 'folder'
        })
      });
      expect(result).toBe(created);
    });

    test('throws when name missing', async () => {
      await expect(
        collectionsService.createCollection('user-1', { description: 'test' })
      ).rejects.toThrow('Collection name is required');
    });

    test('throws when name already exists', async () => {
      prisma.collection.findFirst.mockResolvedValueOnce({ id: 'col-1' });

      await expect(
        collectionsService.createCollection('user-1', { name: 'Favorites' })
      ).rejects.toThrow('Collection with this name already exists');
    });
  });

  describe('updateCollection', () => {
    test('updates allowed fields when ownership verified', async () => {
      prisma.collection.findUnique.mockResolvedValue({
        id: 'col-1',
        userId: 'user-1',
        name: 'Old name'
      });
      prisma.collection.findFirst.mockResolvedValueOnce(null);
      const updated = { id: 'col-1', name: 'New name' };
      prisma.collection.update.mockResolvedValue(updated);

      const result = await collectionsService.updateCollection('col-1', 'user-1', {
        name: 'New name',
        description: '  Desc  '
      });

      expect(prisma.collection.update).toHaveBeenCalledWith({
        where: { id: 'col-1' },
        data: { name: 'New name', description: 'Desc' }
      });
      expect(result).toBe(updated);
    });

    test('throws when collection not found', async () => {
      prisma.collection.findUnique.mockResolvedValue(null);

      await expect(
        collectionsService.updateCollection('missing', 'user-1', {})
      ).rejects.toThrow('Collection not found');
    });

    test('throws when new name already exists', async () => {
      prisma.collection.findUnique.mockResolvedValue({
        id: 'col-1',
        userId: 'user-1',
        name: 'Old'
      });
      prisma.collection.findFirst.mockResolvedValueOnce({ id: 'col-2' });

      await expect(
        collectionsService.updateCollection('col-1', 'user-1', { name: 'Existing' })
      ).rejects.toThrow('Collection with this name already exists');
    });
  });

  describe('deleteCollection', () => {
    test('deletes collection when not default', async () => {
      prisma.collection.findUnique.mockResolvedValue({ id: 'col-1', userId: 'user-1', isDefault: false });

      await collectionsService.deleteCollection('col-1', 'user-1');

      expect(prisma.collection.delete).toHaveBeenCalledWith({ where: { id: 'col-1' } });
    });

    test('throws when trying to delete default collection', async () => {
      prisma.collection.findUnique.mockResolvedValue({ id: 'col-1', userId: 'user-1', isDefault: true });

      await expect(
        collectionsService.deleteCollection('col-1', 'user-1')
      ).rejects.toThrow('Cannot delete default collection');
    });
  });

  describe('addBooksToCollection', () => {
    test('adds unique books to collection', async () => {
      prisma.collection.findUnique.mockResolvedValue({ id: 'col-1', userId: 'user-1', bookIds: ['book-1'] });
      prisma.book.findMany.mockResolvedValue([{ id: 'book-2' }]);
      const updated = { id: 'col-1', bookIds: ['book-1', 'book-2'] };
      prisma.collection.update.mockResolvedValue(updated);

      const result = await collectionsService.addBooksToCollection('col-1', 'user-1', ['book-2']);

      expect(prisma.collection.update).toHaveBeenCalledWith({
        where: { id: 'col-1' },
        data: { bookIds: ['book-1', 'book-2'] }
      });
      expect(result).toBe(updated);
    });

    test('throws when bookIds not array', async () => {
      await expect(
        collectionsService.addBooksToCollection('col-1', 'user-1', 'book-1')
      ).rejects.toThrow('bookIds must be a non-empty array');
    });

    test('throws when books missing', async () => {
      prisma.collection.findUnique.mockResolvedValue({ id: 'col-1', userId: 'user-1', bookIds: [] });
      prisma.book.findMany.mockResolvedValue([{ id: 'book-1' }]);

      await expect(
        collectionsService.addBooksToCollection('col-1', 'user-1', ['book-1', 'book-2'])
      ).rejects.toThrow('Some books not found or do not belong to you');
    });
  });

  describe('removeBooksFromCollection', () => {
    test('removes specified books from collection', async () => {
      prisma.collection.findUnique.mockResolvedValue({ id: 'col-1', userId: 'user-1', bookIds: ['book-1', 'book-2'] });
      const updated = { id: 'col-1', bookIds: ['book-1'] };
      prisma.collection.update.mockResolvedValue(updated);

      const result = await collectionsService.removeBooksFromCollection('col-1', 'user-1', ['book-2']);

      expect(prisma.collection.update).toHaveBeenCalledWith({
        where: { id: 'col-1' },
        data: { bookIds: ['book-1'] }
      });
      expect(result).toBe(updated);
    });

    test('throws when bookIds invalid', async () => {
      await expect(
        collectionsService.removeBooksFromCollection('col-1', 'user-1', [])
      ).rejects.toThrow('bookIds must be a non-empty array');
    });
  });

  describe('getCollectionBooks', () => {
    test('returns collection with presigned cover URLs', async () => {
      prisma.collection.findUnique.mockResolvedValue({ id: 'col-1', userId: 'user-1', bookIds: ['book-1'] });
      prisma.book.findMany.mockResolvedValue([
        { id: 'book-1', userId: 'user-1', coverUrl: 'covers/book-1.png', uploadedAt: new Date() }
      ]);
      generatePresignedUrl.mockResolvedValue('https://cdn.example.com/book-1.png');

      const result = await collectionsService.getCollectionBooks('col-1', 'user-1');

      expect(generatePresignedUrl).toHaveBeenCalledWith('covers/book-1.png', expect.any(Number));
      expect(result.books[0]).toEqual(expect.objectContaining({
        id: 'book-1',
        coverKey: 'covers/book-1.png',
        coverUrl: 'https://cdn.example.com/book-1.png'
      }));
    });

    test('throws when collection not found', async () => {
      prisma.collection.findUnique.mockResolvedValue(null);

      await expect(
        collectionsService.getCollectionBooks('missing', 'user-1')
      ).rejects.toThrow('Collection not found');
    });
  });
});
