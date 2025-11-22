import 'package:hive/hive.dart';
import '../../domain/entities/bookmark.dart';

class BookmarkRepository {
  static const String boxName = 'bookmarks';

  Future<Box<Bookmark>> _getBox() async {
    if (!Hive.isBoxOpen(boxName)) {
      return await Hive.openBox<Bookmark>(boxName);
    }
    return Hive.box<Bookmark>(boxName);
  }

  Future<void> addBookmark(Bookmark bookmark) async {
    final box = await _getBox();
    await box.add(bookmark);
  }

  Future<void> deleteBookmark(Bookmark bookmark) async {
    await bookmark.delete();
  }

  Future<List<Bookmark>> getBookmarksForBook(String bookId) async {
    final box = await _getBox();
    return box.values.where((b) => b.bookId == bookId).toList();
  }
}
