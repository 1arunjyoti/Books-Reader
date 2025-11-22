import 'package:flutter_dotenv/flutter_dotenv.dart';

/// API Configuration
/// Contains base URLs and API keys loaded from environment variables
class ApiConfig {
  // Server Base URL
  static String get baseUrl =>
      dotenv.env['SERVER_BASE_URL'] ??
      dotenv.env['API_BASE_URL'] ??
      'http://localhost:3001/api';

  // Clerk Configuration
  static String get clerkPublishableKey =>
      dotenv.env['CLERK_PUBLISHABLE_KEY'] ??
      dotenv.env['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'] ??
      '';

  // API Timeouts
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
  static const Duration sendTimeout = Duration(minutes: 5); // For file uploads

  // File Upload Limits
  static const int maxFileSizeBytes = 100 * 1024 * 1024; // 100MB
  static const List<String> allowedFileExtensions = ['pdf', 'epub', 'txt'];
}
