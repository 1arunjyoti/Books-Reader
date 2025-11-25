import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/user_api_service.dart';
import 'api_client_provider.dart';

/// Provider for UserApiService
/// Automatically uses the authenticated ApiClient
final userApiServiceProvider = Provider<UserApiService>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return UserApiService(apiClient);
});
