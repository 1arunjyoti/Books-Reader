import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';
import '../../domain/entities/reading_goal.dart';
import '../../domain/repositories/profile_repository.dart';
import '../models/analytics_stats_model.dart';
import '../models/reading_goal_model.dart';
import '../models/reading_session_model.dart';

class ProfileService {
  final ApiClient _apiClient;

  ProfileService({required ApiClient apiClient}) : _apiClient = apiClient;

  /// Get complete analytics stats from server (includes sessions and aggregated data)
  Future<AnalyticsStats> getReadingStatsWithSessions(
    TimeRange timeRange,
  ) async {
    try {
      // Map TimeRange enum to server's period parameter
      final period = _mapTimeRangeToPeriod(timeRange);

      // Call server API with cancel tag for deduplication
      final response = await _apiClient.get(
        ApiEndpoints.analyticsStats,
        queryParameters: {'period': period},
        cancelTag:
            'analytics_stats', // Cancel previous request if new one comes
      );

      // Parse response
      final statsModel = AnalyticsStatsModel.fromJson(response.data);

      // Convert to domain entity
      return statsModel.toAnalyticsStats();
    } catch (e) {
      // Log error and rethrow
      throw Exception('Failed to fetch analytics stats: ${e.toString()}');
    }
  }

  /// Get reading sessions from server analytics API (legacy - use getReadingStatsWithSessions)
  Future<List<ReadingSessionModel>> getReadingSessions(
    TimeRange timeRange,
  ) async {
    try {
      // Map TimeRange enum to server's period parameter
      final period = _mapTimeRangeToPeriod(timeRange);

      // Call server API with cancel tag for deduplication
      final response = await _apiClient.get(
        ApiEndpoints.analyticsStats,
        queryParameters: {'period': period},
        cancelTag:
            'reading_sessions', // Cancel previous request if new one comes
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
      case TimeRange.week:
        return 'week';
      case TimeRange.month:
        return 'month';
      case TimeRange.year:
        return 'year';
      case TimeRange.all:
        return 'all';
    }
  }

  Future<List<ReadingGoalModel>> getReadingGoals() async {
    try {
      final response = await _apiClient.get(
        ApiEndpoints.analyticsGoals,
        cancelTag: 'reading_goals', // Deduplicate goal requests
      );

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

  Future<void> createReadingGoal({
    required GoalUnit unit,
    required GoalPeriod period,
    required int target,
  }) async {
    try {
      // Map enums to server strings
      String typeStr;
      switch (unit) {
        case GoalUnit.books:
          typeStr = 'books';
          break;
        case GoalUnit.minutes:
          typeStr = 'time';
          break;
        default:
          typeStr = 'pages';
      }

      String periodStr;
      switch (period) {
        case GoalPeriod.daily:
          periodStr = 'daily';
          break;
        case GoalPeriod.weekly:
          periodStr = 'weekly';
          break;
        case GoalPeriod.monthly:
          periodStr = 'monthly';
          break;
        case GoalPeriod.yearly:
          periodStr = 'yearly';
          break;
      }

      final response = await _apiClient.post(
        ApiEndpoints.analyticsGoals,
        data: {'type': typeStr, 'period': periodStr, 'target': target},
      );

      if (response.statusCode != 200 && response.statusCode != 201) {
        throw Exception('Failed to create reading goal: ${response.data}');
      }
    } catch (e) {
      throw Exception('Failed to create reading goal: $e');
    }
  }

  Future<void> deleteReadingGoal(String goalId) async {
    try {
      final response = await _apiClient.delete(
        '${ApiEndpoints.analyticsGoals}/$goalId',
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to delete reading goal: ${response.data}');
      }
    } catch (e) {
      throw Exception('Failed to delete reading goal: $e');
    }
  }
}
