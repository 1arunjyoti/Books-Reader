import 'dart:io';
import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';
import '../models/book_model.dart';

/// Upload Service
/// Handles file uploads to the server
class UploadService {
  final ApiClient _apiClient;

  UploadService(this._apiClient);

  /// Upload a file to the server
  /// Returns the uploaded book metadata
  Future<BookModel> uploadFile(
    File file, {
    Function(int sent, int total)? onProgress,
  }) async {
    try {
      // Get file name and extension
      final fileName = file.path.split('/').last;
      final extension = fileName.split('.').last.toLowerCase();

      // Validate file type
      const allowedExtensions = ['pdf', 'epub', 'txt'];
      if (!allowedExtensions.contains(extension)) {
        throw Exception(
          'Unsupported file type. Only PDF, EPUB, and TXT files are allowed.',
        );
      }

      // Validate file size (100MB max)
      final fileSize = await file.length();
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (fileSize > maxSize) {
        throw Exception('File too large. Maximum size is 100MB.');
      }

      // Create form data
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(file.path, filename: fileName),
      });

      // Upload file
      final response = await _apiClient.post(
        ApiEndpoints.upload,
        data: formData,
        onSendProgress: onProgress,
      );

      // Parse response - server should return book metadata
      // Adjust parsing based on actual server response format
      final bookData = response.data;

      // If server returns a wrapper object, extract the book data
      final book = bookData is Map<String, dynamic>
          ? (bookData['book'] ?? bookData)
          : bookData;

      return BookModel.fromJson(book as Map<String, dynamic>);
    } on DioException catch (e) {
      if (e.response?.statusCode == 413) {
        throw Exception('File too large');
      } else if (e.response?.statusCode == 415) {
        throw Exception('Unsupported file type');
      }
      rethrow;
    }
  }

  /// Cancel ongoing upload
  void cancelUpload(CancelToken cancelToken) {
    cancelToken.cancel('Upload cancelled by user');
  }
}
