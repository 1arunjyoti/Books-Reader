import 'package:flutter_cache_manager/flutter_cache_manager.dart';

/// Custom cache manager for book cover images
/// Provides optimized caching with size limits and stale period
class BookCoverCacheManager {
  static const key = 'bookCovers';
  static CacheManager? _instance;

  /// Get the singleton instance of the cache manager
  static CacheManager get instance {
    _instance ??= CacheManager(
      Config(
        key,
        stalePeriod: const Duration(days: 30), // Cache for 30 days
        maxNrOfCacheObjects: 200, // Maximum 200 cached images
        repo: JsonCacheInfoRepository(databaseName: key),
        fileSystem: IOFileSystem(key),
        fileService: HttpFileService(),
      ),
    );
    return _instance!;
  }
}
