import 'package:dio/dio.dart';
import '../network/api_client.dart';

/// User API Service
/// Handles all user-related API operations including:
/// - Profile updates (name changes)
/// - Email changes
/// - Password changes
/// - Account deletion
class UserApiService {
  final ApiClient _apiClient;

  UserApiService(this._apiClient);

  /// Update user name
  /// 
  /// Endpoint: POST /api/user/update-name
  /// 
  /// Request body:
  /// ```json
  /// {
  ///   "name": "John Doe"
  /// }
  /// ```
  /// 
  /// Success response:
  /// ```json
  /// {
  ///   "message": "Name updated successfully",
  ///   "user": {
  ///     "id": "user_...",
  ///     "name": "John Doe",
  ///     "email": "user@example.com",
  ///     "picture": "...",
  ///     "updatedAt": "2024-..."
  ///   }
  /// }
  /// ```
  Future<Map<String, dynamic>> updateUserName(String name) async {
    try {
      final response = await _apiClient.post(
        '/user/update-name',
        data: {'name': name.trim()},
      );

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': response.data['message'] ?? 'Name updated successfully',
          'user': response.data['user'],
        };
      } else {
        throw Exception(response.data['error'] ?? 'Failed to update name');
      }
    } on DioException catch (e) {
      final errorMessage = e.response?.data['error'] ?? 
                          e.response?.data['message'] ?? 
                          'Failed to update name';
      throw Exception(errorMessage);
    }
  }

  /// Change user email
  /// 
  /// Endpoint: POST /api/user/change-email
  /// 
  /// Request body:
  /// ```json
  /// {
  ///   "newEmail": "newemail@example.com",
  ///   "password": "currentpassword"
  /// }
  /// ```
  /// 
  /// Success response:
  /// ```json
  /// {
  ///   "message": "Verification email sent...",
  ///   "emailId": "idn_...",
  ///   "requiresVerification": true,
  ///   "note": "Your database email will be updated..."
  /// }
  /// ```
  Future<Map<String, dynamic>> changeUserEmail({
    required String newEmail,
    required String password,
  }) async {
    try {
      final response = await _apiClient.post(
        '/user/change-email',
        data: {
          'newEmail': newEmail.trim(),
          'password': password,
        },
      );

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': response.data['message'] ?? 'Email change requested',
          'emailId': response.data['emailId'],
          'requiresVerification': response.data['requiresVerification'] ?? true,
          'note': response.data['note'],
        };
      } else {
        throw Exception(response.data['error'] ?? 'Failed to change email');
      }
    } on DioException catch (e) {
      final errorMessage = e.response?.data['error'] ?? 
                          e.response?.data['message'] ?? 
                          'Failed to change email';
      throw Exception(errorMessage);
    }
  }

  /// Change user password
  /// 
  /// Endpoint: POST /api/user/change-password
  /// 
  /// Request body:
  /// ```json
  /// {
  ///   "currentPassword": "oldpassword",
  ///   "newPassword": "newpassword123"
  /// }
  /// ```
  /// 
  /// Success response:
  /// ```json
  /// {
  ///   "message": "Password changed successfully"
  /// }
  /// ```
  Future<Map<String, dynamic>> changeUserPassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      final response = await _apiClient.post(
        '/user/change-password',
        data: {
          'currentPassword': currentPassword,
          'newPassword': newPassword,
        },
      );

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': response.data['message'] ?? 'Password changed successfully',
        };
      } else {
        throw Exception(response.data['error'] ?? 'Failed to change password');
      }
    } on DioException catch (e) {
      final errorMessage = e.response?.data['error'] ?? 
                          e.response?.data['message'] ?? 
                          'Failed to change password';
      throw Exception(errorMessage);
    }
  }

  /// Delete user account permanently
  /// 
  /// This will delete:
  /// - All user data from the database (books, bookmarks, highlights, etc.)
  /// - All user files from cloud storage
  /// - User account from Clerk
  /// 
  /// Endpoint: POST /api/user/delete
  /// 
  /// Request body:
  /// ```json
  /// {
  ///   "email": "user@example.com",
  ///   "password": "userpassword"
  /// }
  /// ```
  /// 
  /// Success response:
  /// ```json
  /// {
  ///   "message": "Account deleted successfully",
  ///   "deleted": {
  ///     "database": true,
  ///     "clerk": true,
  ///     "stats": {
  ///       "books": 5,
  ///       "bookmarks": 10,
  ///       "highlights": 15,
  ///       "filesDeleted": 20
  ///     }
  ///   }
  /// }
  /// ```
  Future<Map<String, dynamic>> deleteUserAccount({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _apiClient.post(
        '/user/delete',
        data: {
          'email': email.trim(),
          'password': password,
        },
      );

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': response.data['message'] ?? 'Account deleted successfully',
          'deleted': response.data['deleted'] ?? {},
        };
      } else {
        throw Exception(response.data['error'] ?? 'Failed to delete account');
      }
    } on DioException catch (e) {
      final errorMessage = e.response?.data['error'] ?? 
                          e.response?.data['message'] ?? 
                          'Failed to delete account';
      throw Exception(errorMessage);
    }
  }

  /// Sync user profile from Clerk
  /// 
  /// This updates the database with the latest user data from Clerk
  /// (email, name, picture, etc.)
  /// 
  /// Endpoint: POST /api/user/sync
  /// 
  /// Success response:
  /// ```json
  /// {
  ///   "message": "Profile synced",
  ///   "user": {
  ///     "id": "user_...",
  ///     "email": "user@example.com",
  ///     "name": "John Doe",
  ///     "picture": "...",
  ///     "updatedAt": "2024-..."
  ///   }
  /// }
  /// ```
  Future<Map<String, dynamic>> syncUserProfile() async {
    try {
      final response = await _apiClient.post('/user/sync');

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': response.data['message'] ?? 'Profile synced',
          'user': response.data['user'],
        };
      } else {
        throw Exception(response.data['error'] ?? 'Failed to sync profile');
      }
    } on DioException catch (e) {
      final errorMessage = e.response?.data['error'] ?? 
                          e.response?.data['message'] ?? 
                          'Failed to sync profile';
      throw Exception(errorMessage);
    }
  }

  /// Get user profile
  /// 
  /// Endpoint: GET /api/user/profile
  /// 
  /// Success response:
  /// ```json
  /// {
  ///   "id": "user_...",
  ///   "email": "user@example.com",
  ///   "name": "John Doe",
  ///   "picture": "...",
  ///   "nickname": "...",
  ///   "createdAt": "2024-...",
  ///   "updatedAt": "2024-..."
  /// }
  /// ```
  Future<Map<String, dynamic>> getUserProfile() async {
    try {
      final response = await _apiClient.get('/user/profile');

      if (response.statusCode == 200) {
        return {
          'success': true,
          'user': response.data,
        };
      } else {
        throw Exception(response.data['error'] ?? 'Failed to get profile');
      }
    } on DioException catch (e) {
      final errorMessage = e.response?.data['error'] ?? 
                          e.response?.data['message'] ?? 
                          'Failed to get profile';
      throw Exception(errorMessage);
    }
  }
}
