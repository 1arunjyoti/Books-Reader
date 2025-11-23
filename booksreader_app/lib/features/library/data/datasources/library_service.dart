import 'package:flutter/foundation.dart';

import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';
import '../models/book_model.dart';

/// Library Service
/// Handles fetching books from the server
class LibraryService {
  final ApiClient _apiClient;

  LibraryService(this._apiClient);

  /// Get all books for the authenticated user
  Future<List<BookModel>> getBooks() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.books);

      // Parse response - server returns { "books": [...] }
      final data = response.data;
      if (data is Map<String, dynamic>) {
        if (kDebugMode) {
          print('📚 LibraryService: Response is Map. Keys: ${data.keys}');
        }
        if (data.containsKey('books')) {
          if (kDebugMode) {
            print(
              '📚 LibraryService: Found "books" key. Length: ${(data['books'] as List).length}',
            );
          }
        } else {
          if (kDebugMode) {
            print('⚠️ LibraryService: "books" key MISSING');
          }
        }
      } else {
        if (kDebugMode) {
          print('📚 LibraryService: Response is ${data.runtimeType}');
        }
      }

      final booksJson = data is Map<String, dynamic>
          ? (data['books'] as List<dynamic>?)
          : (data as List<dynamic>?);

      if (booksJson == null) {
        if (kDebugMode) {
          print('⚠️ LibraryService: booksJson is NULL');
        }
        return [];
      }

      final books = <BookModel>[];
      for (final item in booksJson) {
        try {
          if (item is! Map<String, dynamic>) {
            if (kDebugMode) {
              print('⚠️ LibraryService: Skipping non-map item: $item');
            }
            continue;
          }

          final json = Map<String, dynamic>.from(item);

          // Patch missing fileType if needed
          if (json['fileType'] == null) {
            if (json['fileName'] != null) {
              final fileName = json['fileName'] as String;
              final ext = fileName.split('.').last;
              json['fileType'] = ext;
              if (kDebugMode) {
                print(
                  '🔧 LibraryService: Patched fileType for "${json['title']}" -> $ext',
                );
              }
            } else {
              // Fallback if both fileType and fileName are missing
              json['fileType'] = 'unknown';
              if (kDebugMode) {
                print(
                  '⚠️ LibraryService: No fileType/fileName for "${json['title']}". Defaulting to "unknown"',
                );
              }
            }
          }

          // Patch missing author if needed
          if (json['author'] == null) {
            json['author'] = 'Unknown Author';
            if (kDebugMode) {
              print(
                '🔧 LibraryService: Patched author for "${json['title']}" -> Unknown Author',
              );
            }
          }

          // Map fileUrl to assetPath if assetPath is missing
          if (json['assetPath'] == null && json['fileUrl'] != null) {
            json['assetPath'] = json['fileUrl'];
            if (kDebugMode) {
              print(
                '🔧 LibraryService: Mapped fileUrl to assetPath for "${json['title']}"',
              );
            }
          }

          books.add(BookModel.fromJson(json));
        } catch (e) {
          if (kDebugMode) {
            print('❌ LibraryService: Failed to parse book: $item');
          }
          if (kDebugMode) {
            print('   Error: $e');
          }
          // Continue to next book instead of failing everything
        }
      }

      if (kDebugMode) {
        print(
          '✅ LibraryService: Parsed ${books.length} books (skipped ${booksJson.length - books.length})',
        );
      }
      return books;
    } catch (e) {
      if (kDebugMode) {
        print('❌ LibraryService Error: $e');
      }
      // Log error and return empty list or rethrow
      // For now, rethrow to let error handling happen upstream
      rethrow;
    }
  }
}
