import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/providers/api_client_provider.dart';
import '../../data/datasources/remote_highlight_datasource.dart';
import '../../data/repositories/highlight_repository.dart';
import '../../domain/entities/highlight.dart';

final highlightRepositoryProvider = Provider<HighlightRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final remoteDataSource = RemoteHighlightDataSource(apiClient);
  return HighlightRepository(remoteDataSource);
});

final highlightListProvider = FutureProvider.family<List<Highlight>, String>((
  ref,
  bookId,
) async {
  final repository = ref.read(highlightRepositoryProvider);
  return repository.getHighlightsForBook(bookId);
});

class HighlightController {
  final Ref ref;
  final String bookId;

  HighlightController(this.ref, this.bookId);

  Future<void> addHighlight(Highlight highlight) async {
    final repository = ref.read(highlightRepositoryProvider);
    await repository.addHighlight(highlight);
    ref.invalidate(highlightListProvider(bookId));
  }

  Future<void> deleteHighlight(Highlight highlight) async {
    final repository = ref.read(highlightRepositoryProvider);
    await repository.deleteHighlight(highlight);
    ref.invalidate(highlightListProvider(bookId));
  }
}

final highlightControllerProvider =
    Provider.family<HighlightController, String>((ref, bookId) {
      return HighlightController(ref, bookId);
    });
