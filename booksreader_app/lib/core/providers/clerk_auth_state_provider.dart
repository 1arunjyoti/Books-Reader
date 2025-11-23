import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart'; // For StateProvider in Riverpod 3.0+
import 'package:clerk_flutter/clerk_flutter.dart';

/// Provider that exposes the current Clerk auth state
/// This provider watches the Clerk authentication state and provides user info
final clerkAuthStateProvider = StateProvider<ClerkAuthState?>((ref) => null);

/// Provider that extracts user information from Clerk auth state
/// Returns the Clerk user object (not to be confused with app's User entity)
final clerkUserProvider = Provider((ref) {
  final authState = ref.watch(clerkAuthStateProvider);
  return authState?.user; // This is clerk_flutter's user object
});

/// Provider for user's display name
final userNameProvider = Provider<String>((ref) {
  try {
    final user = ref.watch(clerkUserProvider);
    if (user == null) return 'User';

    // Access properties using dynamic to avoid type conflicts
    final dynamic clerkUser = user;

    // Safely access Clerk user properties
    String? fullName;
    String? firstName;
    String? email;

    try {
      fullName = clerkUser.fullName;
    } catch (_) {}

    try {
      firstName = clerkUser.firstName;
    } catch (_) {}

    try {
      email = clerkUser.primaryEmailAddress?.emailAddress;
    } catch (_) {}

    // Return the first available value
    if (fullName != null && fullName.isNotEmpty) return fullName;
    if (firstName != null && firstName.isNotEmpty) return firstName;
    if (email != null && email.isNotEmpty) {
      return email.split('@').first;
    }

    return 'User';
  } catch (e) {
    // If anything goes wrong, return default
    return 'User';
  }
});

/// Provider for user's email
final userEmailProvider = Provider<String>((ref) {
  try {
    final user = ref.watch(clerkUserProvider);
    if (user == null) return '';

    final dynamic clerkUser = user;

    try {
      final email = clerkUser.primaryEmailAddress?.emailAddress;
      if (email != null) return email as String;
    } catch (_) {}

    return '';
  } catch (e) {
    return '';
  }
});

/// Helper function to update the Clerk auth state provider
/// Call this from ClerkAuthBuilder when auth state changes
void updateClerkAuthState(WidgetRef ref, ClerkAuthState authState) {
  ref.read(clerkAuthStateProvider.notifier).state = authState;
}
