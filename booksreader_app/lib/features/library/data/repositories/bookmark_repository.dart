import '../../domain/entities/bookmark.dart';
import '../datasources/remote_bookmark_datasource.dart';

class BookmarkRepository {
  final RemoteBookmarkDataSource remoteDataSource;

  BookmarkRepository(this.remoteDataSource);

  Future<List<Bookmark>> getBookmarksForBook(String bookId) async {
    return await remoteDataSource.getBookmarksByBook(bookId);
  }

  Future<void> addBookmark(Bookmark bookmark) async {
    // We only need bookId, pageNumber, and note for creation
    await remoteDataSource.createBookmark(
      bookmark.bookId,
      bookmark.pageNumber,
      bookmark.note,
    );
  }

  Future<void> deleteBookmark(Bookmark bookmark) async {
    await remoteDataSource.deleteBookmark(bookmark.id);
  }
}
