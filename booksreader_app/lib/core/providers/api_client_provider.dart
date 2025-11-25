import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../network/api_client.dart';
import 'clerk_token_provider.dart';
import 'clerk_auth_state_provider.dart';

/// Provider for ApiClient that watches the Clerk token and updates automatically
final apiClientProvider = Provider<ApiClient>((ref) {
  final token = ref.watch(clerkTokenProvider);

  return ApiClient(
    token: token,
    tokenProvider: () async {
      final authState = ref.read(clerkAuthStateProvider);
      if (authState?.session != null) {
        final dynamic session = authState!.session;
        final tokenObj = await session.getToken();
        return tokenObj?.jwt;
      }
      return null;
    },
  );
});
