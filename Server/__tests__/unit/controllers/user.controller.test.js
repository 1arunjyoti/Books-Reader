/**
 * Unit tests for User Controller
 */

const userController = require('../../../controllers/user.controller');
const prisma = require('../../../config/database');
const logger = require('../../../utils/logger');
const userService = require('../../../services/user.service');
const { fetchAuth0UserInfo } = require('../../../utils/auth0-userinfo');

jest.mock('../../../config/database', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    upsert: jest.fn(),
    findFirst: jest.fn()
  }
}));

jest.mock('../../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

jest.mock('../../../services/user.service', () => ({
  deleteUserAccount: jest.fn()
}));

jest.mock('../../../utils/auth0-userinfo', () => ({
  fetchAuth0UserInfo: jest.fn()
}));

describe('UserController', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      auth: {
        payload: {
          sub: 'user-123',
          email: 'user@example.com',
          name: 'Test User'
        }
      },
      query: {},
      body: {},
      headers: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis()
    };

    jest.clearAllMocks();
  });

  describe('getUserProfile', () => {
    test('returns user profile when exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-123', email: 'user@example.com' });

      await userController.getUserProfile(req, res);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: expect.any(Object)
      });
      expect(res.json).toHaveBeenCalledWith({ user: { id: 'user-123', email: 'user@example.com' } });
    });

    test('creates user from Auth0 when missing and email absent in JWT', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'user-123', email: 'auth0@example.com' });
      req.auth.payload.email = undefined;
      req.headers.authorization = 'Bearer test-token';
      fetchAuth0UserInfo.mockResolvedValue({ email: 'auth0@example.com', name: 'Auth0 User' });

      await userController.getUserProfile(req, res);

      expect(prisma.user.create).toHaveBeenCalled();
      expect(fetchAuth0UserInfo).toHaveBeenCalledWith('test-token');
      expect(res.json).toHaveBeenCalledWith({ user: { id: 'user-123', email: 'auth0@example.com' } });
    });

    test('returns 401 when unauthenticated', async () => {
      req.auth = null;

      await userController.getUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });
  });

  describe('updateUserName', () => {
    test('updates user name and returns updated user', async () => {
      prisma.user.upsert.mockResolvedValue({ id: 'user-123', name: 'Updated' });
      req.body = { name: '  Updated  ' };

      await userController.updateUserName(req, res);

      expect(prisma.user.upsert).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Name updated successfully',
        user: { id: 'user-123', name: 'Updated' }
      }));
    });

    test('returns 400 when name invalid', async () => {
      req.body = { name: '' };

      await userController.updateUserName(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Name is required and must be a string' });
    });

    test('returns 400 when sanitized name empty', async () => {
      req.body = { name: '   ' };

      await userController.updateUserName(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Name cannot be empty' });
    });

    test('returns 401 when unauthenticated', async () => {
      req.auth = null;
      req.body = { name: 'Valid' };

      await userController.updateUserName(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });
  });

  describe('syncUserProfile', () => {
    test('syncs profile using upsert', async () => {
      prisma.user.upsert.mockResolvedValue({ id: 'user-123', email: 'user@example.com' });

      await userController.syncUserProfile(req, res);

      expect(prisma.user.upsert).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'Profile synced', user: expect.any(Object) });
    });

    test('fetches email from Auth0 when missing', async () => {
      prisma.user.upsert.mockResolvedValue({ id: 'user-123', email: 'fetched@example.com' });
      req.auth.payload.email = undefined;
      req.headers.authorization = 'Bearer token';
      fetchAuth0UserInfo.mockResolvedValue({ email: 'fetched@example.com' });

      await userController.syncUserProfile(req, res);

      expect(fetchAuth0UserInfo).toHaveBeenCalledWith('token');
      expect(prisma.user.upsert).toHaveBeenCalled();
    });

    test('returns 401 when unauthenticated', async () => {
      req.auth = null;

      await userController.syncUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });
  });

  describe('deleteUserAccount', () => {
    test('calls service with provided credentials', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-123', email: 'user@example.com' });
      userService.deleteUserAccount.mockResolvedValue({
        success: true,
        deletedFromAuth0: true,
        deletedFromDatabase: true,
        databaseStats: { books: 1, bookmarks: 0, annotations: 0, highlights: 0, readingSessions: 0, readingGoals: 0, collections: 0 },
        filesDeleted: { booksDeleted: 1, coversDeleted: 0 }
      });
      req.body = { email: 'user@example.com', password: 'secret' };

      await userController.deleteUserAccount(req, res);

      expect(userService.deleteUserAccount).toHaveBeenCalledWith('user-123', 'user@example.com', 'secret');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Account deleted successfully',
        deleted: expect.objectContaining({
          database: true,
          auth0: true,
          stats: expect.objectContaining({ books: 1 })
        })
      }));
    });

    test('returns 400 when email mismatch', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-123', email: 'different@example.com' });
      req.body = { email: 'user@example.com', password: 'secret' };

      await userController.deleteUserAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email does not match your account' });
    });

    test('returns 500 on service error', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-123', email: 'user@example.com' });
      userService.deleteUserAccount.mockRejectedValue(new Error('Service failure'));
      req.body = { email: 'user@example.com', password: 'secret' };

      await userController.deleteUserAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to delete account' });
    });

    test('returns 401 when unauthenticated', async () => {
      req.auth = null;
      req.body = { email: 'user@example.com', password: 'secret' };

      await userController.deleteUserAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    test('returns 404 when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.findFirst = jest.fn().mockResolvedValue(null);
      req.body = { email: 'missing@example.com', password: 'secret' };

      await userController.deleteUserAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });
  });
});
