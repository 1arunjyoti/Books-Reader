/// API Endpoints Constants
/// Matches server routes as documented in API_ENDPOINTS.md
class ApiEndpoints {
  // Books
  static const String books = '/books';
  static String bookById(String id) => '/books/$id';
  static String presignedUrl(String id) => '/books/$id/presigned-url';

  // Upload
  static const String upload = '/upload';
  static const String uploadFromUrl = '/upload/from-url';

  // Bookmarks
  static const String bookmarks = '/bookmarks';
  static String bookmarksByBook(String bookId) => '/bookmarks/$bookId';
  static String bookmarkById(String id) => '/bookmarks/$id';

  // Highlights
  static const String highlights = '/highlights';
  static String highlightsByBook(String bookId) => '/highlights/$bookId';
  static String highlightById(String id) => '/highlights/$id';

  // Analytics
  static const String analyticsSession = '/analytics/session';
  static const String analyticsStats = '/analytics/stats';
  static const String analyticsGoals = '/analytics/goals';
  static String analyticsGoalById(String id) => '/analytics/goals/$id';

  // Collections
  static const String collections = '/collections';
  static String collectionById(String id) => '/collections/$id';
  static String collectionBooks(String id) => '/collections/$id/books';

  // User
  static const String userProfile = '/user/profile';
  static const String userSync = '/user/sync';
  static const String userUpdateName = '/user/update-name';
  static const String userWelcomeStatus = '/user/welcome-status';
  static const String userWelcomeShown = '/user/welcome-shown';
}
