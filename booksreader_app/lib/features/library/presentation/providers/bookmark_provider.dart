import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/repositories/bookmark_repository.dart';
import '../../domain/entities/bookmark.dart';

final bookmarkRepositoryProvider = Provider<BookmarkRepository>((ref) {
  return BookmarkRepository();
});

final bookmarkListProvider = FutureProvider.family<List<Bookmark>, String>((
  ref,
  bookId,
) async {
  final repository = ref.read(bookmarkRepositoryProvider);
  return repository.getBookmarksForBook(bookId);
});

class BookmarkController {
  final Ref ref;
  final String bookId;

  BookmarkController(this.ref, this.bookId);

  Future<void> addBookmark(Bookmark bookmark) async {
    final repository = ref.read(bookmarkRepositoryProvider);
    await repository.addBookmark(bookmark);
    ref.invalidate(bookmarkListProvider(bookId));
  }

  Future<void> deleteBookmark(Bookmark bookmark) async {
    final repository = ref.read(bookmarkRepositoryProvider);
    await repository.deleteBookmark(bookmark);
    ref.invalidate(bookmarkListProvider(bookId));
  }
}

final bookmarkControllerProvider = Provider.family<BookmarkController, String>((
  ref,
  bookId,
) {
  return BookmarkController(ref, bookId);
});
