import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/providers/api_client_provider.dart';
import '../../domain/entities/collection.dart';
import '../../data/datasources/collections_service.dart';
import '../../data/models/collection_model.dart';

// Service Provider
final collectionsServiceProvider = Provider<CollectionsService>(
  (ref) => CollectionsService(ref.watch(apiClientProvider)),
);

// Collections State
class CollectionsState {
  final List<Collection> collections;
  final bool isLoading;
  final String? error;

  const CollectionsState({
    this.collections = const [],
    this.isLoading = false,
    this.error,
  });

  CollectionsState copyWith({
    List<Collection>? collections,
    bool? isLoading,
    String? error,
  }) {
    return CollectionsState(
      collections: collections ?? this.collections,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

// Collections Notifier
class CollectionsNotifier extends Notifier<CollectionsState> {
  late CollectionsService _service;

  @override
  CollectionsState build() {
    _service = ref.watch(collectionsServiceProvider);
    // Load collections on initialization
    Future.microtask(() => loadCollections());
    return const CollectionsState(isLoading: true);
  }

  /// Load all collections from the server
  Future<void> loadCollections() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final collections = await _service.getCollections();
      state = state.copyWith(collections: collections, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  /// Create a new collection
  Future<CollectionModel?> createCollection({
    required String name,
    String? description,
    String? color,
    String? icon,
  }) async {
    try {
      final collection = await _service.createCollection(
        name: name,
        description: description,
        color: color,
        icon: icon,
      );

      // Reload collections to reflect the new addition
      await loadCollections();
      return collection;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return null;
    }
  }

  /// Delete a collection
  Future<bool> deleteCollection(String id) async {
    try {
      await _service.deleteCollection(id);
      // Reload collections to reflect the deletion
      await loadCollections();
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  /// Add books to a collection
  Future<bool> addBooksToCollection(
    String collectionId,
    List<String> bookIds,
  ) async {
    try {
      await _service.addBooksToCollection(collectionId, bookIds);
      // Reload collections to reflect updated book count
      await loadCollections();
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  /// Remove books from a collection
  Future<bool> removeBooksFromCollection(
    String collectionId,
    List<String> bookIds,
  ) async {
    try {
      await _service.removeBooksFromCollection(collectionId, bookIds);
      // Reload collections to reflect updated book count
      await loadCollections();
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  /// Update a collection
  Future<bool> updateCollection(
    String id, {
    String? name,
    String? description,
    String? color,
    String? icon,
  }) async {
    try {
      await _service.updateCollection(
        id,
        name: name,
        description: description,
        color: color,
        icon: icon,
      );
      // Reload collections to reflect the update
      await loadCollections();
      return true;
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return false;
    }
  }

  /// Get books in a collection
  Future<Map<String, dynamic>?> getCollectionBooks(String collectionId) async {
    try {
      return await _service.getCollectionBooks(collectionId);
    } catch (e) {
      state = state.copyWith(error: e.toString());
      return null;
    }
  }
}

// Collections Provider
final collectionsProvider =
    NotifierProvider<CollectionsNotifier, CollectionsState>(
      CollectionsNotifier.new,
    );
