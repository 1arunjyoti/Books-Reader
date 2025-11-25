import 'package:flutter/foundation.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';
import '../models/collection_model.dart';

/// Collections Service
/// Handles all collection-related API operations
class CollectionsService {
  final ApiClient _apiClient;

  CollectionsService(this._apiClient);

  /// Get all collections for the authenticated user
  Future<List<CollectionModel>> getCollections() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.collections);

      // Parse response
      final data = response.data;

      if (data is List) {
        return data
            .map(
              (json) => CollectionModel.fromJson(json as Map<String, dynamic>),
            )
            .toList();
      } else if (data is Map<String, dynamic> &&
          data.containsKey('collections')) {
        final collections = data['collections'] as List;
        return collections
            .map(
              (json) => CollectionModel.fromJson(json as Map<String, dynamic>),
            )
            .toList();
      }

      if (kDebugMode) {
        print('⚠️ CollectionsService: Unexpected response format');
      }
      return [];
    } catch (e) {
      if (kDebugMode) {
        print('❌ CollectionsService Error fetching collections: $e');
      }
      rethrow;
    }
  }

  /// Create a new collection
  Future<CollectionModel> createCollection({
    required String name,
    String? description,
    String? color,
    String? icon,
  }) async {
    try {
      final response = await _apiClient.post(
        ApiEndpoints.collections,
        data: {
          'name': name,
          if (description != null) 'description': description,
          if (color != null) 'color': color,
          if (icon != null) 'icon': icon,
        },
      );

      return CollectionModel.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      if (kDebugMode) {
        print('❌ CollectionsService Error creating collection: $e');
      }
      rethrow;
    }
  }

  /// Update a collection
  Future<CollectionModel> updateCollection(
    String id, {
    String? name,
    String? description,
    String? color,
    String? icon,
  }) async {
    try {
      final response = await _apiClient.patch(
        ApiEndpoints.collectionById(id),
        data: {
          if (name != null) 'name': name,
          if (description != null) 'description': description,
          if (color != null) 'color': color,
          if (icon != null) 'icon': icon,
        },
      );

      return CollectionModel.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      if (kDebugMode) {
        print('❌ CollectionsService Error updating collection: $e');
      }
      rethrow;
    }
  }

  /// Delete a collection
  Future<void> deleteCollection(String id) async {
    try {
      await _apiClient.delete(ApiEndpoints.collectionById(id));
      if (kDebugMode) {
        print('✅ CollectionsService: Collection deleted successfully');
      }
    } catch (e) {
      if (kDebugMode) {
        print('❌ CollectionsService Error deleting collection: $e');
      }
      rethrow;
    }
  }

  /// Add books to a collection
  Future<CollectionModel> addBooksToCollection(
    String collectionId,
    List<String> bookIds,
  ) async {
    try {
      final response = await _apiClient.post(
        ApiEndpoints.collectionBooks(collectionId),
        data: {'bookIds': bookIds},
      );

      return CollectionModel.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      if (kDebugMode) {
        print('❌ CollectionsService Error adding books to collection: $e');
      }
      rethrow;
    }
  }

  /// Remove books from a collection
  /// Note: The server expects bookIds in the request body for DELETE
  Future<CollectionModel> removeBooksFromCollection(
    String collectionId,
    List<String> bookIds,
  ) async {
    try {
      // Dio's delete method doesn't support data in the body by default
      // We'll send bookIds as query parameters instead
      final response = await _apiClient.delete(
        ApiEndpoints.collectionBooks(collectionId),
        queryParameters: {'bookIds': bookIds.join(',')},
      );

      return CollectionModel.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      if (kDebugMode) {
        print('❌ CollectionsService Error removing books from collection: $e');
      }
      rethrow;
    }
  }

  /// Get books in a collection
  Future<Map<String, dynamic>> getCollectionBooks(String collectionId) async {
    try {
      final response = await _apiClient.get(
        ApiEndpoints.collectionBooks(collectionId),
      );

      return response.data as Map<String, dynamic>;
    } catch (e) {
      if (kDebugMode) {
        print('❌ CollectionsService Error fetching collection books: $e');
      }
      rethrow;
    }
  }
}
