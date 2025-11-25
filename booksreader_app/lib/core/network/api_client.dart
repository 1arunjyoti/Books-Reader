import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../config/api_config.dart';

/// API Client
/// Base Dio client with auth interceptors, error handling, caching, and request cancellation
class ApiClient {
  late final Dio _dio;
  String? _token;
  final Future<String?> Function()? _tokenProvider;

  // Request cancellation tokens
  final Map<String, CancelToken> _cancelTokens = {};

  /// Create an ApiClient instance
  /// [token] - Optional initial authentication token
  /// [tokenProvider] - Optional callback to get a fresh token on demand
  ApiClient({String? token, Future<String?> Function()? tokenProvider})
    : _token = token,
      _tokenProvider = tokenProvider {
    if (kDebugMode) {
      print(
        '🏗️ ApiClient created with token: ${_token != null ? "Present" : "NULL"}',
      );
    }
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConfig.baseUrl,
        connectTimeout: ApiConfig.connectTimeout,
        receiveTimeout: ApiConfig.receiveTimeout,
        sendTimeout: ApiConfig.sendTimeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // HTTP caching headers for better performance
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
      ),
    );

    _setupInterceptors();
  }

  /// Update the authentication token
  void updateToken(String? token) {
    _token = token;
  }

  void _setupInterceptors() {
    // Auth Interceptor - Add Bearer token to requests
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Get fresh token if provider is available
          if (_tokenProvider != null) {
            try {
              final freshToken = await _tokenProvider();
              if (freshToken != null) {
                _token = freshToken;
              }
            } catch (e) {
              if (kDebugMode) {
                print('⚠️ Failed to refresh token: $e');
              }
            }
          }

          // Add token if available
          if (_token != null && _token!.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $_token';
            if (kDebugMode) {
              print('🔑 Added Authorization header to ${options.path}');
            }
          } else {
            if (kDebugMode) {
              print('⚠️ No token available for ${options.path}');
            }
          }
          return handler.next(options);
        },
        onError: (error, handler) async {
          // Handle 401 Unauthorized - user needs to re-authenticate
          if (error.response?.statusCode == 401) {
            if (kDebugMode) {
              print('Unauthorized request - Session may be expired');
            }
          }
          return handler.next(error);
        },
      ),
    );

    // Logging Interceptor (Debug only)
    _dio.interceptors.add(
      LogInterceptor(
        requestBody: true,
        responseBody: true,
        error: true,
        logPrint: (obj) {
          // Only log in debug mode
          // In production, this will be no-op
          assert(() {
            if (kDebugMode) {
              print(obj);
            }
            return true;
          }());
        },
      ),
    );
  }

  /// GET request with optional request tag for cancellation
  Future<Response> get(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
    String? cancelTag,
  }) async {
    try {
      // Setup cancellation if tag provided
      CancelToken? cancelToken;
      if (cancelTag != null) {
        // Cancel any previous request with same tag
        _cancelTokens[cancelTag]?.cancel();
        cancelToken = CancelToken();
        _cancelTokens[cancelTag] = cancelToken;
      }

      final response = await _dio.get(
        path,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      );

      // Clean up cancel token after successful request
      if (cancelTag != null) {
        _cancelTokens.remove(cancelTag);
      }

      return response;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  /// POST request
  Future<Response> post(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    ProgressCallback? onSendProgress,
  }) async {
    try {
      return await _dio.post(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
        onSendProgress: onSendProgress,
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  /// PATCH request
  Future<Response> patch(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.patch(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  /// DELETE request
  Future<Response> delete(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.delete(
        path,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  /// PUT request
  Future<Response> put(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.put(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  /// Cancel a specific request by tag
  void cancelRequest(String tag) {
    _cancelTokens[tag]?.cancel('Request cancelled by user');
    _cancelTokens.remove(tag);
  }

  /// Cancel all pending requests
  void cancelAllRequests() {
    for (var token in _cancelTokens.values) {
      token.cancel('All requests cancelled');
    }
    _cancelTokens.clear();
  }

  /// Handle Dio errors and convert to app-friendly error messages
  Exception _handleError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return Exception(
          'Connection timeout. Please check your internet connection.',
        );

      case DioExceptionType.badResponse:
        final statusCode = error.response?.statusCode;
        final message =
            error.response?.data?['error'] ??
            error.response?.data?['message'] ??
            'Server error occurred';

        switch (statusCode) {
          case 400:
            return Exception('Bad request: $message');
          case 401:
            return Exception('Unauthorized. Please login again.');
          case 403:
            return Exception('Access forbidden');
          case 404:
            return Exception('Resource not found');
          case 413:
            return Exception('File too large');
          case 415:
            return Exception('Unsupported file type');
          case 500:
          default:
            return Exception('Server error: $message');
        }

      case DioExceptionType.cancel:
        return Exception('Request cancelled');

      case DioExceptionType.unknown:
      default:
        if (error.message?.contains('SocketException') ?? false) {
          return Exception('No internet connection');
        }
        return Exception('An unexpected error occurred: ${error.message}');
    }
  }
}
