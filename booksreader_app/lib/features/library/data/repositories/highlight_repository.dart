import '../../domain/entities/highlight.dart';
import '../datasources/remote_highlight_datasource.dart';

class HighlightRepository {
  final RemoteHighlightDataSource remoteDataSource;

  HighlightRepository(this.remoteDataSource);

  Future<List<Highlight>> getHighlightsForBook(String bookId) async {
    return await remoteDataSource.getHighlightsByBook(bookId);
  }

  Future<void> addHighlight(Highlight highlight) async {
    await remoteDataSource.createHighlight(
      bookId: highlight.bookId,
      text: highlight.text,
      color: highlight.color,
      hex: highlight.hex,
      cfiRange: highlight.cfiRange,
      pageNumber: highlight.pageNumber,
      rects: highlight.rects,
      note: highlight.note,
      source: highlight.source,
    );
  }

  Future<void> deleteHighlight(Highlight highlight) async {
    await remoteDataSource.deleteHighlight(highlight.id);
  }
}
