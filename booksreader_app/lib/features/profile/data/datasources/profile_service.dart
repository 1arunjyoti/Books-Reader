import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';
import '../../domain/repositories/profile_repository.dart';
import '../models/analytics_stats_model.dart';
import '../models/reading_goal_model.dart';
import '../models/reading_session_model.dart';

class ProfileService {
  final ApiClient _apiClient;

  ProfileService({required ApiClient apiClient}) : _apiClient = apiClient;

  /// Get reading sessions from server analytics API
  Future<List<ReadingSessionModel>> getReadingSessions(
    TimeRange timeRange,
  ) async {
    try {
      // Map TimeRange enum to server's period parameter
      final period = _mapTimeRangeToPeriod(timeRange);

      // Call server API
      final response = await _apiClient.get(
        ApiEndpoints.analyticsStats,
        queryParameters: {'period': period},
      );

      // Parse response
      final statsModel = AnalyticsStatsModel.fromJson(response.data);

      // Convert chart data to ReadingSession models
      final sessions = statsModel.toReadingSessions();

      // Convert to ReadingSessionModel
      return sessions
          .map(
            (session) => ReadingSessionModel(
              date: session.date,
              pagesRead: session.pagesRead,
              durationSeconds: session.durationSeconds,
            ),
          )
          .toList();
    } catch (e) {
      // Log error and rethrow
      throw Exception('Failed to fetch reading sessions: ${e.toString()}');
    }
  }

  /// Map Flutter TimeRange to server period parameter
  String _mapTimeRangeToPeriod(TimeRange timeRange) {
    switch (timeRange) {
      case TimeRange.day:
        return 'week'; // Map day to week since server doesn't have 'day'
      case TimeRange.week:
        return 'week';
      case TimeRange.month:
        return 'month';
      case TimeRange.year:
        return 'year';
    }
  }

  Future<List<ReadingGoalModel>> getReadingGoals() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.analyticsGoals);

      // Parse response (array of goals)
      final goalsData = response.data as List<dynamic>;

      return goalsData
          .map((goalJson) => ReadingGoalModel.fromJson(goalJson))
          .toList();
    } catch (e) {
      throw Exception('Failed to fetch reading goals: ${e.toString()}');
    }
  }

  Future<void> updateProfile({String? name, String? password}) async {
    try {
      await _apiClient.patch(
        ApiEndpoints.userProfile,
        data: {
          if (name != null) 'name': name,
          if (password != null) 'password': password,
        },
      );
    } catch (e) {
      throw Exception('Failed to update profile: ${e.toString()}');
    }
  }
}
