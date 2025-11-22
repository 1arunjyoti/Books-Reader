import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart'; // For StateProvider in Riverpod 3.0+
import 'package:clerk_flutter/clerk_flutter.dart';

/// Provider that exposes the current Clerk session token
/// This gets updated whenever the auth state changes
final clerkTokenProvider = StateProvider<String?>((ref) => null);

/// Helper function to extract and update the token from ClerkAuthState
/// Call this from ClerkAuthBuilder when auth state changes
String? extractTokenFromAuthState(ClerkAuthState authState) {
  // Get the last active token from the session
  // The Session object has a lastActiveToken property
  return authState.session?.lastActiveToken?.jwt;
}

/// Helper to update the token provider
/// Usage: updateClerkToken(ref, authState) inside ClerkAuthBuilder
Future<void> updateClerkToken(WidgetRef ref, ClerkAuthState authState) async {
  String? token = extractTokenFromAuthState(authState);

  print('🔐 Clerk Token Update (Sync): ${token != null ? "Found" : "Missing"}');

  // If token is missing but we have a session, try to fetch it asynchronously
  if (token == null && authState.session != null) {
    try {
      print('🔄 Fetching fresh token from session...');
      // Use dynamic to bypass static analysis if method is not detected
      final dynamic session = authState.session;
      final tokenObj = await session.getToken();
      token = tokenObj?.jwt;
      print(
        '🔐 Clerk Token Update (Async): ${token != null ? "Found" : "Still Missing"}',
      );
    } catch (e) {
      print('❌ Failed to fetch token: $e');
    }
  }

  ref.read(clerkTokenProvider.notifier).state = token;
}
