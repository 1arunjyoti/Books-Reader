import 'package:clerk_flutter/clerk_flutter.dart';
import '../models/user_model.dart';
import '../../../../core/storage/secure_storage.dart';

// ============================================================================
// DEPRECATED: This service is no longer used with Clerk Flutter SDK
// ============================================================================
// Clerk Flutter manages authentication through the widget tree using:
// - ClerkAuth: Wrapper that provides auth context
// - ClerkAuthBuilder: Conditionally renders UI based on auth state
// - ClerkAuthentication: Pre-built authentication UI
//
// This file is kept for reference but should not be used in the app.
// To access auth state, use the ClerkAuthBuilder widget in main.dart
// ============================================================================

/// Authentication Service using Clerk
/// Handles login, signup, and token management
class AuthService {
  final _storage = SecureStorageService();

  get SignInFirstFactorStrategy => null;

  /// Login with email and password
  Future<UserModel> login(String email, String password) async {
    try {
      // Sign in with Clerk
      final signInResult = await Clerk.instance.client.signIn.create(
        identifier: email,
        password: password,
      );

      // Prepare the sign-in with password strategy
      await signInResult.attemptFirstFactor(
        strategy: SignInFirstFactorStrategy.password(password: password),
      );

      // Get session token
      final session = signInResult.createdSessionId != null
          ? await Clerk.instance.client.sessions.getSession(
              signInResult.createdSessionId!,
            )
          : null;

      if (session == null) {
        throw Exception('Failed to create session');
      }

      // Get JWT token
      final token = await session.getToken();
      if (token == null || token.jwt.isEmpty) {
        throw Exception('Failed to get authentication token');
      }

      // Store token and user info
      await _storage.saveToken(token.jwt);
      await _storage.saveUserId(session.user.id);
      await _storage.saveUserEmail(email);

      // Return user model
      return UserModel(
        id: session.user.id,
        email: email,
        name:
            session.user.fullName ??
            session.user.firstName ??
            email.split('@')[0],
      );
    } /* on ClerkAPIError catch (e) {
      throw Exception(e.message ?? 'Login failed');
    } */ catch (e) {
      throw Exception('Login failed: ${e.toString()}');
    }
  }

  /// Register new user with email and password
  Future<UserModel> register(String name, String email, String password) async {
    try {
      // Sign up with Clerk
      final signUpResult = await Clerk.instance.client.signUp.create(
        emailAddress: email,
        password: password,
        firstName: name,
      );

      // Prepare the sign-up
      await signUpResult.prepareEmailAddressVerification();

      // For development, we'll auto-verify if using test mode
      // In production, user would need to verify their email

      // Attempt to complete sign-up and create session
      await signUpResult.attemptEmailAddressVerification(
        code: 'test_code', // This might need adjustment based on Clerk config
      );

      // Create session
      final session = signUpResult.createdSessionId != null
          ? await Clerk.instance.client.sessions.getSession(
              signUpResult.createdSessionId!,
            )
          : null;

      if (session == null) {
        // If email verification is required, return user without session
        // User will need to verify email then login
        return UserModel(
          id:
              signUpResult.id ??
              DateTime.now().millisecondsSinceEpoch.toString(),
          email: email,
          name: name,
        );
      }

      // Get JWT token
      final token = await session.getToken();
      if (token != null && token.jwt.isNotEmpty) {
        await _storage.saveToken(token.jwt);
        await _storage.saveUserId(session.user.id);
        await _storage.saveUserEmail(email);
      }

      return UserModel(id: session.user.id, email: email, name: name);
    } /* on ClerkAPIError catch (e) {
      throw Exception(e.message ?? 'Signup failed');
    } */ catch (e) {
      throw Exception('Signup failed: ${e.toString()}');
    }
  }

  /// Logout - clear stored credentials
  Future<void> logout() async {
    try {
      await Clerk.instance.client.signOut();
      await _storage.clearAll();
    } catch (e) {
      // Still clear local storage even if Clerk signout fails
      await _storage.clearAll();
    }
  }

  /// Check if user is authenticated
  Future<bool> isAuthenticated() async {
    return await _storage.isAuthenticated();
  }
}

class Clerk {
  static get instance => null;
}
