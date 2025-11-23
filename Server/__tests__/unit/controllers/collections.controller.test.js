/**
 * Unit tests for Collections Controller
 */
const collectionsController = require('../../../controllers/collections.controller');
const collectionsService = require('../../../services/collections.service');
const logger = require('../../../utils/logger');

jest.mock('../../../services/collections.service');
jest.mock('../../../utils/logger');

describe('CollectionsController', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      auth: {
        userId: 'user-123'
      },
      params: {},
      body: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    jest.clearAllMocks();
  });

  describe('getAllCollections', () => {
    test('should return collections for authenticated user', async () => {
      const mockCollections = [{ id: 'col-1' }];
      collectionsService.getAllCollections = jest.fn().mockResolvedValue(mockCollections);

      await collectionsController.getAllCollections(req, res);

      expect(collectionsService.getAllCollections).toHaveBeenCalledWith('user-123');
      expect(res.json).toHaveBeenCalledWith(mockCollections);
    });

    test('should return 401 when user not authenticated', async () => {
      req.auth = null;

      await collectionsController.getAllCollections(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    test('should handle service errors', async () => {
      collectionsService.getAllCollections = jest.fn().mockRejectedValue(new Error('DB error'));

      await collectionsController.getAllCollections(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch collections' });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('createCollection', () => {
    test('should create collection', async () => {
      const payload = { name: 'Favorites' };
      req.body = payload;
      const mockCollection = { id: 'col-1', ...payload };
      collectionsService.createCollection = jest.fn().mockResolvedValue(mockCollection);

      await collectionsController.createCollection(req, res);

      expect(collectionsService.createCollection).toHaveBeenCalledWith('user-123', payload);
      expect(res.json).toHaveBeenCalledWith(mockCollection);
    });

    test('should return 401 when user not authenticated', async () => {
      req.auth = null;

      await collectionsController.createCollection(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    test('should return 400 on validation errors', async () => {
      req.body = {};
      collectionsService.createCollection = jest.fn().mockRejectedValue(new Error('name is required'));

      await collectionsController.createCollection(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'name is required' });
    });

    test('should return 400 when collection already exists', async () => {
      req.body = { name: 'Favorites' };
      collectionsService.createCollection = jest.fn().mockRejectedValue(new Error('Collection already exists'));

      await collectionsController.createCollection(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Collection already exists' });
    });

    test('should handle unexpected errors', async () => {
      collectionsService.createCollection = jest.fn().mockRejectedValue(new Error('DB error'));

      await collectionsController.createCollection(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to create collection' });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('updateCollection', () => {
    beforeEach(() => {
      req.params.id = 'col-1';
      req.body = { name: 'Updated' };
    });

    test('should update collection', async () => {
      const updated = { id: 'col-1', name: 'Updated' };
      collectionsService.updateCollection = jest.fn().mockResolvedValue(updated);

      await collectionsController.updateCollection(req, res);

      expect(collectionsService.updateCollection).toHaveBeenCalledWith('col-1', 'user-123', req.body);
      expect(res.json).toHaveBeenCalledWith(updated);
    });

    test('should return 401 when user not authenticated', async () => {
      req.auth = null;

      await collectionsController.updateCollection(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    test('should return 404 when collection not found', async () => {
      collectionsService.updateCollection = jest.fn().mockRejectedValue(new Error('Collection not found'));

      await collectionsController.updateCollection(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Collection not found' });
    });

    test('should return 400 when name already exists', async () => {
      collectionsService.updateCollection = jest.fn().mockRejectedValue(new Error('Collection already exists'));

      await collectionsController.updateCollection(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Collection already exists' });
    });

    test('should handle unexpected errors', async () => {
      collectionsService.updateCollection = jest.fn().mockRejectedValue(new Error('DB error'));

      await collectionsController.updateCollection(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to update collection' });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('deleteCollection', () => {
    beforeEach(() => {
      req.params.id = 'col-1';
    });

    test('should delete collection', async () => {
      collectionsService.deleteCollection = jest.fn().mockResolvedValue();

      await collectionsController.deleteCollection(req, res);

      expect(collectionsService.deleteCollection).toHaveBeenCalledWith('col-1', 'user-123');
      expect(res.json).toHaveBeenCalledWith({ message: 'Collection deleted successfully' });
    });

    test('should return 401 when user not authenticated', async () => {
      req.auth = null;

      await collectionsController.deleteCollection(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    test('should return 404 when collection not found', async () => {
      collectionsService.deleteCollection = jest.fn().mockRejectedValue(new Error('Collection not found'));

      await collectionsController.deleteCollection(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Collection not found' });
    });

    test('should return 400 when attempting to delete default collection', async () => {
      collectionsService.deleteCollection = jest.fn().mockRejectedValue(new Error('Cannot delete default collection'));

      await collectionsController.deleteCollection(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Cannot delete default collection' });
    });

    test('should handle unexpected errors', async () => {
      collectionsService.deleteCollection = jest.fn().mockRejectedValue(new Error('DB error'));

      await collectionsController.deleteCollection(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to delete collection' });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('addBooksToCollection', () => {
    beforeEach(() => {
      req.params.id = 'col-1';
      req.body.bookIds = ['book-1'];
    });

    test('should add books to collection', async () => {
      const updated = { id: 'col-1', books: ['book-1'] };
      collectionsService.addBooksToCollection = jest.fn().mockResolvedValue(updated);

      await collectionsController.addBooksToCollection(req, res);

      expect(collectionsService.addBooksToCollection).toHaveBeenCalledWith('col-1', 'user-123', ['book-1']);
      expect(res.json).toHaveBeenCalledWith(updated);
    });

    test('should return 401 when user not authenticated', async () => {
      req.auth = null;

      await collectionsController.addBooksToCollection(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    test('should return 404 when collection not found', async () => {
      collectionsService.addBooksToCollection = jest.fn().mockRejectedValue(new Error('Collection not found'));

      await collectionsController.addBooksToCollection(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Collection not found' });
    });

    test('should return 400 on validation errors', async () => {
      collectionsService.addBooksToCollection = jest.fn().mockRejectedValue(new Error('Book IDs must be an array'));

      await collectionsController.addBooksToCollection(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Book IDs must be an array' });
    });

    test('should handle unexpected errors', async () => {
      collectionsService.addBooksToCollection = jest.fn().mockRejectedValue(new Error('DB error'));

      await collectionsController.addBooksToCollection(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to add books to collection' });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('removeBooksFromCollection', () => {
    beforeEach(() => {
      req.params.id = 'col-1';
      req.body.bookIds = ['book-1'];
    });

    test('should remove books from collection', async () => {
      const updated = { id: 'col-1', books: [] };
      collectionsService.removeBooksFromCollection = jest.fn().mockResolvedValue(updated);

      await collectionsController.removeBooksFromCollection(req, res);

      expect(collectionsService.removeBooksFromCollection).toHaveBeenCalledWith('col-1', 'user-123', ['book-1']);
      expect(res.json).toHaveBeenCalledWith(updated);
    });

    test('should return 401 when user not authenticated', async () => {
      req.auth = null;

      await collectionsController.removeBooksFromCollection(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    test('should return 404 when collection not found', async () => {
      collectionsService.removeBooksFromCollection = jest.fn().mockRejectedValue(new Error('Collection not found'));

      await collectionsController.removeBooksFromCollection(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Collection not found' });
    });

    test('should return 400 on validation errors', async () => {
      collectionsService.removeBooksFromCollection = jest.fn().mockRejectedValue(new Error('Book IDs must be an array'));

      await collectionsController.removeBooksFromCollection(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Book IDs must be an array' });
    });

    test('should handle unexpected errors', async () => {
      collectionsService.removeBooksFromCollection = jest.fn().mockRejectedValue(new Error('DB error'));

      await collectionsController.removeBooksFromCollection(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to remove books from collection' });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getCollectionBooks', () => {
    beforeEach(() => {
      req.params.id = 'col-1';
    });

    test('should return books in collection', async () => {
      const result = { collection: { id: 'col-1' }, books: [] };
      collectionsService.getCollectionBooks = jest.fn().mockResolvedValue(result);

      await collectionsController.getCollectionBooks(req, res);

      expect(collectionsService.getCollectionBooks).toHaveBeenCalledWith('col-1', 'user-123');
      expect(res.json).toHaveBeenCalledWith(result);
    });

    test('should return 401 when user not authenticated', async () => {
      req.auth = null;

      await collectionsController.getCollectionBooks(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    test('should return 404 when collection not found', async () => {
      collectionsService.getCollectionBooks = jest.fn().mockRejectedValue(new Error('Collection not found'));

      await collectionsController.getCollectionBooks(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Collection not found' });
    });

    test('should handle unexpected errors', async () => {
      collectionsService.getCollectionBooks = jest.fn().mockRejectedValue(new Error('DB error'));

      await collectionsController.getCollectionBooks(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch collection books' });
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
