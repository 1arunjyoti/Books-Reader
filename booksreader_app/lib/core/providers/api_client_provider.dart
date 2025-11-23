import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../network/api_client.dart';
import 'clerk_token_provider.dart';

/// Provider for ApiClient that watches the Clerk token and updates automatically
final apiClientProvider = Provider<ApiClient>((ref) {
  final token = ref.watch(clerkTokenProvider);
  return ApiClient(token: token);
});
