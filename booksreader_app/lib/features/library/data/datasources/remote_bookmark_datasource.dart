import '../../../../core/network/api_client.dart';
import '../models/bookmark_model.dart';

class RemoteBookmarkDataSource {
  final ApiClient apiClient;

  RemoteBookmarkDataSource(this.apiClient);

  Future<BookmarkModel> createBookmark(
    String bookId,
    int pageNumber,
    String? note,
  ) async {
    final response = await apiClient.post(
      '/bookmarks',
      data: {'bookId': bookId, 'pageNumber': pageNumber, 'note': note},
    );
    return BookmarkModel.fromJson(response.data['bookmark']);
  }

  Future<List<BookmarkModel>> getBookmarksByBook(String bookId) async {
    final response = await apiClient.get('/bookmarks/$bookId');
    final List<dynamic> data = response.data['bookmarks'];
    return data.map((json) => BookmarkModel.fromJson(json)).toList();
  }

  Future<void> deleteBookmark(String id) async {
    await apiClient.delete('/bookmarks/$id');
  }
}
