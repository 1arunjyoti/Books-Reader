import '../../domain/entities/reading_goal.dart';
import '../../domain/repositories/profile_repository.dart';
import '../models/reading_goal_model.dart';
import '../models/reading_session_model.dart';

class ProfileService {
  Future<List<ReadingSessionModel>> getReadingSessions(
    TimeRange timeRange,
  ) async {
    await Future.delayed(const Duration(seconds: 1));
    final now = DateTime.now();

    switch (timeRange) {
      case TimeRange.day:
        // Last 24 hours (hourly data)
        return List.generate(24, (index) {
          return ReadingSessionModel(
            date: now.subtract(Duration(hours: 23 - index)),
            pagesRead: (index % 3 == 0
                ? 5
                : index % 2 == 0
                ? 3
                : 2),
            durationSeconds: (index % 3 == 0
                ? 600
                : index % 2 == 0
                ? 300
                : 180),
          );
        });

      case TimeRange.week:
        // Last 7 days
        return List.generate(7, (index) {
          return ReadingSessionModel(
            date: now.subtract(Duration(days: 6 - index)),
            pagesRead: (index + 1) * 10 + (index % 2 == 0 ? 5 : 0),
            durationSeconds: (index + 1) * 300,
          );
        });

      case TimeRange.month:
        // Last 30 days
        return List.generate(30, (index) {
          return ReadingSessionModel(
            date: now.subtract(Duration(days: 29 - index)),
            pagesRead: 15 + (index % 10) * 2,
            durationSeconds: 900 + (index % 10) * 120,
          );
        });

      case TimeRange.year:
        // Last 12 months
        return List.generate(12, (index) {
          return ReadingSessionModel(
            date: DateTime(now.year, now.month - (11 - index), 1),
            pagesRead: 200 + (index * 50),
            durationSeconds: 18000 + (index * 3600),
          );
        });
    }
  }

  Future<List<ReadingGoalModel>> getReadingGoals() async {
    await Future.delayed(const Duration(seconds: 1));
    return const [
      ReadingGoalModel(
        id: '1',
        type: GoalType.daily,
        targetAmount: 30,
        currentAmount: 15,
        unit: GoalUnit.pages,
      ),
      ReadingGoalModel(
        id: '2',
        type: GoalType.weekly,
        targetAmount: 200,
        currentAmount: 120,
        unit: GoalUnit.pages,
      ),
      ReadingGoalModel(
        id: '3',
        type: GoalType.monthly,
        targetAmount: 5,
        currentAmount: 2,
        unit: GoalUnit.books,
      ),
    ];
  }

  Future<void> updateProfile({String? name, String? password}) async {
    await Future.delayed(const Duration(seconds: 2));
    // Simulate success
  }
}
