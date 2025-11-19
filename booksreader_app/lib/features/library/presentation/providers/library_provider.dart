import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/book.dart';
import '../../domain/usecases/get_books.dart';
import '../../data/datasources/library_service.dart';
import '../../data/repositories/library_repository_impl.dart';

// Data Source
final libraryServiceProvider = Provider<LibraryService>(
  (ref) => LibraryService(),
);

// Repository
final libraryRepositoryProvider = Provider<LibraryRepositoryImpl>((ref) {
  return LibraryRepositoryImpl(ref.read(libraryServiceProvider));
});

// Use Cases
final getBooksProvider = Provider<GetBooks>((ref) {
  return GetBooks(ref.read(libraryRepositoryProvider));
});

// State
class LibraryState {
  final List<Book> books;
  final List<Book> filteredBooks;
  final bool isLoading;
  final String? error;
  final String searchQuery;
  final BookStatus? statusFilter;
  final bool isGridView;

  const LibraryState({
    this.books = const [],
    this.filteredBooks = const [],
    this.isLoading = false,
    this.error,
    this.searchQuery = '',
    this.statusFilter,
    this.isGridView = true,
  });

  LibraryState copyWith({
    List<Book>? books,
    List<Book>? filteredBooks,
    bool? isLoading,
    String? error,
    String? searchQuery,
    BookStatus? statusFilter,
    bool forceStatusFilterNull = false,
    bool? isGridView,
  }) {
    return LibraryState(
      books: books ?? this.books,
      filteredBooks: filteredBooks ?? this.filteredBooks,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      searchQuery: searchQuery ?? this.searchQuery,
      statusFilter: forceStatusFilterNull
          ? null
          : (statusFilter ?? this.statusFilter),
      isGridView: isGridView ?? this.isGridView,
    );
  }
}

class LibraryNotifier extends Notifier<LibraryState> {
  late final GetBooks _getBooks;

  @override
  LibraryState build() {
    _getBooks = ref.read(getBooksProvider);
    // Schedule loading to start after build to avoid modifying state during build
    Future.microtask(() => loadBooks());
    return const LibraryState(isLoading: true);
  }

  Future<void> loadBooks() async {
    state = state.copyWith(isLoading: true, error: null);
    final result = await _getBooks(NoParams());
    result.fold(
      (failure) =>
          state = state.copyWith(isLoading: false, error: failure.message),
      (books) {
        state = state.copyWith(
          isLoading: false,
          books: books,
          filteredBooks: _filterBooks(
            books,
            state.searchQuery,
            state.statusFilter,
          ),
        );
      },
    );
  }

  void setSearchQuery(String query) {
    state = state.copyWith(
      searchQuery: query,
      filteredBooks: _filterBooks(state.books, query, state.statusFilter),
    );
  }

  void setStatusFilter(BookStatus? status) {
    // If clicking the same filter, toggle it off (set to null)
    final shouldClear = state.statusFilter == status;
    final newStatus = shouldClear ? null : status;

    state = state.copyWith(
      statusFilter: newStatus,
      forceStatusFilterNull: shouldClear,
      filteredBooks: _filterBooks(state.books, state.searchQuery, newStatus),
    );
  }

  void toggleViewMode() {
    state = state.copyWith(isGridView: !state.isGridView);
  }

  List<Book> _filterBooks(List<Book> books, String query, BookStatus? status) {
    return books.where((book) {
      final matchesQuery =
          book.title.toLowerCase().contains(query.toLowerCase()) ||
          book.author.toLowerCase().contains(query.toLowerCase());
      final matchesStatus = status == null || book.status == status;
      return matchesQuery && matchesStatus;
    }).toList();
  }
}

final libraryProvider = NotifierProvider<LibraryNotifier, LibraryState>(
  LibraryNotifier.new,
);
