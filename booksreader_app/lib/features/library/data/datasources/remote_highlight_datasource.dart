import '../../../../core/network/api_client.dart';
import '../models/highlight_model.dart';

class RemoteHighlightDataSource {
  final ApiClient apiClient;

  RemoteHighlightDataSource(this.apiClient);

  Future<HighlightModel> createHighlight({
    required String bookId,
    required String text,
    required String color,
    required String hex,
    String? cfiRange,
    int? pageNumber,
    List<dynamic>? rects,
    String? note,
    required String source,
  }) async {
    final response = await apiClient.post(
      '/highlights',
      data: {
        'bookId': bookId,
        'text': text,
        'color': color,
        'hex': hex,
        'cfiRange': cfiRange,
        'pageNumber': pageNumber,
        'rects': rects,
        'note': note,
        'source': source,
      },
    );
    if (response.data == null) {
      throw Exception('Server returned null response data');
    }
    // print('Highlight response data: ${response.data}'); // Debug logging
    return HighlightModel.fromJson(response.data);
  }

  Future<List<HighlightModel>> getHighlightsByBook(String bookId) async {
    final response = await apiClient.get('/highlights/book/$bookId');
    final List<dynamic> data = response.data;
    return data.map((json) => HighlightModel.fromJson(json)).toList();
  }

  Future<void> deleteHighlight(String id) async {
    await apiClient.delete('/highlights/$id');
  }
}
