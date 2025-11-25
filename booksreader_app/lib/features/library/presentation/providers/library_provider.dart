import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';
import '../../../../core/usecases/usecase.dart';
import '../../../../core/providers/api_client_provider.dart';
import '../../domain/entities/book.dart';
import '../../domain/usecases/get_books.dart';
import '../../data/datasources/library_service.dart';
import '../../data/datasources/upload_service.dart';
import '../../data/repositories/library_repository_impl.dart';
import '../widgets/advanced_filters_bottom_sheet.dart';

// Data Source
final libraryServiceProvider = Provider<LibraryService>(
  (ref) => LibraryService(ref.watch(apiClientProvider)),
);

// Repository
final libraryRepositoryProvider = Provider<LibraryRepositoryImpl>((ref) {
  return LibraryRepositoryImpl(ref.watch(libraryServiceProvider));
});

// Use Cases
final getBooksProvider = Provider<GetBooks>((ref) {
  return GetBooks(ref.watch(libraryRepositoryProvider));
});

// State
class LibraryState {
  final List<Book> books;
  final List<Book> filteredBooks;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;
  final String searchQuery;
  final BookStatus? statusFilter;
  final bool isGridView;

  // Pagination
  final int currentPage;
  final int itemsPerPage;
  final bool hasMore;

  // Advanced Filters
  final AdvancedFilters advancedFilters;

  const LibraryState({
    this.books = const [],
    this.filteredBooks = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.error,
    this.searchQuery = '',
    this.statusFilter,
    this.isGridView = true,
    this.currentPage = 1,
    this.itemsPerPage = 30,
    this.hasMore = true,
    this.advancedFilters = const AdvancedFilters(),
  });

  LibraryState copyWith({
    List<Book>? books,
    List<Book>? filteredBooks,
    bool? isLoading,
    bool? isLoadingMore,
    String? error,
    String? searchQuery,
    BookStatus? statusFilter,
    bool forceStatusFilterNull = false,
    bool? isGridView,
    int? currentPage,
    int? itemsPerPage,
    bool? hasMore,
    AdvancedFilters? advancedFilters,
  }) {
    return LibraryState(
      books: books ?? this.books,
      filteredBooks: filteredBooks ?? this.filteredBooks,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error: error,
      searchQuery: searchQuery ?? this.searchQuery,
      statusFilter: forceStatusFilterNull
          ? null
          : (statusFilter ?? this.statusFilter),
      isGridView: isGridView ?? this.isGridView,
      currentPage: currentPage ?? this.currentPage,
      itemsPerPage: itemsPerPage ?? this.itemsPerPage,
      hasMore: hasMore ?? this.hasMore,
      advancedFilters: advancedFilters ?? this.advancedFilters,
    );
  }
}

class LibraryNotifier extends Notifier<LibraryState> {
  late GetBooks _getBooks;

  @override
  LibraryState build() {
    // Watch the use case so we rebuild when auth state changes
    _getBooks = ref.watch(getBooksProvider);

    // Schedule loading to start after build to avoid modifying state during build
    Future.microtask(() => loadBooks());
    return const LibraryState(isLoading: true);
  }

  Future<void> loadBooks() async {
    state = state.copyWith(
      isLoading: true,
      error: null,
      currentPage: 1,
      hasMore: true,
    );
    final result = await _getBooks(NoParams());
    result.fold(
      (failure) =>
          state = state.copyWith(isLoading: false, error: failure.message),
      (books) {
        // Check if we have more books to load
        final hasMore = books.length >= state.itemsPerPage;

        state = state.copyWith(
          isLoading: false,
          books: books,
          filteredBooks: _filterBooks(
            books,
            state.searchQuery,
            state.statusFilter,
          ),
          hasMore: hasMore,
        );
      },
    );
  }

  /// Load more books for pagination (simulated - waiting for backend pagination)
  Future<void> loadMoreBooks() async {
    // Don't load if already loading or no more books
    if (state.isLoadingMore || !state.hasMore) return;

    state = state.copyWith(isLoadingMore: true);

    // Note: This is a placeholder. In a real implementation,
    // you would call the API with page/limit parameters:
    // final result = await _getBooks(PaginationParams(
    //   page: state.currentPage + 1,
    //   limit: state.itemsPerPage,
    // ));

    // For now, we'll simulate by doing nothing since the backend
    // doesn't support pagination yet. This structure is ready
    // for when pagination is added to the API.

    await Future.delayed(const Duration(milliseconds: 500));

    state = state.copyWith(
      isLoadingMore: false,
      // When backend supports pagination, update:
      // currentPage: state.currentPage + 1,
      // books: [...state.books, ...newBooks],
      // hasMore: newBooks.length >= state.itemsPerPage,
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
    var filtered = books.where((book) {
      // Text search
      final matchesQuery =
          book.title.toLowerCase().contains(query.toLowerCase()) ||
          book.author.toLowerCase().contains(query.toLowerCase());

      // Status filter
      final matchesStatus = status == null || book.status == status;

      return matchesQuery && matchesStatus;
    }).toList();

    // Apply advanced filters
    filtered = _applyAdvancedFilters(filtered, state.advancedFilters);

    return filtered;
  }

  /// Apply advanced filters (genres, language, formats, dates)
  List<Book> _applyAdvancedFilters(List<Book> books, AdvancedFilters filters) {
    var filtered = books;

    // Filter by formats (file type)
    if (filters.formats.isNotEmpty) {
      filtered = filtered.where((book) {
        final fileType = book.fileType.toUpperCase();
        return filters.formats.any(
          (format) => fileType == format.toUpperCase(),
        );
      }).toList();
    }

    // Filter by language
    if (filters.language.isNotEmpty) {
      // Note: Book entity would need a language field
      // For now, this is a placeholder
      // filtered = filtered.where((book) =>
      //   book.language == filters.language
      // ).toList();
    }

    // Filter by date range
    if (filters.dateFrom.isNotEmpty || filters.dateTo.isNotEmpty) {
      // Note: Book entity would need an uploadedAt field
      // For now, this is a placeholder
      // filtered = filtered.where((book) {
      //   final uploadDate = book.uploadedAt;
      //   if (uploadDate == null) return false;
      //
      //   if (filters.dateFrom.isNotEmpty) {
      //     if (uploadDate.isBefore(DateTime.parse(filters.dateFrom))) {
      //       return false;
      //     }
      //   }
      //
      //   if (filters.dateTo.isNotEmpty) {
      //     if (uploadDate.isAfter(DateTime.parse(filters.dateTo))) {
      //       return false;
      //     }
      //   }
      //
      //   return true;
      // }).toList();
    }

    // Apply sorting
    filtered = _sortBooks(filtered, filters.sortBy, filters.sortOrder);

    return filtered;
  }

  /// Sort books based on criteria
  List<Book> _sortBooks(List<Book> books, String sortBy, String sortOrder) {
    final sorted = List<Book>.from(books);

    sorted.sort((a, b) {
      int comparison = 0;

      switch (sortBy) {
        case 'title':
          comparison = a.title.compareTo(b.title);
          break;
        case 'author':
          comparison = a.author.compareTo(b.author);
          break;
        case 'progress':
          comparison = (a.progress).compareTo(b.progress);
          break;
        case 'uploadedAt':
        case 'lastReadAt':
        default:
          // Would need these fields in Book entity
          comparison = 0;
      }

      return sortOrder == 'asc' ? comparison : -comparison;
    });

    return sorted;
  }

  /// Apply advanced filters
  void applyAdvancedFilters(AdvancedFilters filters) {
    state = state.copyWith(
      advancedFilters: filters,
      filteredBooks: _filterBooks(
        state.books,
        state.searchQuery,
        state.statusFilter,
      ),
    );
  }

  /// Clear advanced filters
  void clearAdvancedFilters() {
    state = state.copyWith(
      advancedFilters: const AdvancedFilters(),
      filteredBooks: _filterBooks(
        state.books,
        state.searchQuery,
        state.statusFilter,
      ),
    );
  }

  /// Pick and upload a file
  Future<void> pickAndUploadFile(BuildContext context) async {
    try {
      // Pick file
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'epub', 'txt'],
      );

      if (result == null || result.files.isEmpty) {
        return; // User cancelled
      }

      final file = result.files.first;
      if (file.path == null) {
        throw Exception('Unable to access the selected file');
      }

      // Show upload dialog
      if (!context.mounted) return;
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const AlertDialog(
          content: Row(
            children: [
              CircularProgressIndicator(),
              SizedBox(width: 16),
              Text('Uploading...'),
            ],
          ),
        ),
      );

      // Create upload service with authenticated API client
      final apiClient = ref.read(apiClientProvider);
      final uploadService = UploadService(apiClient);

      // Upload file
      await uploadService.uploadFile(File(file.path!));

      // Close dialog
      if (!context.mounted) return;
      Navigator.of(context).pop();

      // Reload books
      await loadBooks();

      // Show success message
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('File uploaded successfully!'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      // Close dialog if open
      if (context.mounted && Navigator.of(context).canPop()) {
        Navigator.of(context).pop();
      }

      // Show error message
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Upload failed: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}

final libraryProvider = NotifierProvider<LibraryNotifier, LibraryState>(
  LibraryNotifier.new,
);
