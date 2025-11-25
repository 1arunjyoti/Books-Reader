import 'package:dartz/dartz.dart';
import '../../../../core/errors/failure.dart';
import '../entities/reading_goal.dart';
import '../entities/reading_session.dart';

enum TimeRange { week, month, year, all }

/// Analytics stats data structure
class AnalyticsStats {
  final List<ReadingSession> sessions;
  final int totalReadingTime;
  final int totalPagesRead;
  final int booksFinished;
  final int booksReading;
  final int currentStreak;
  final double readingSpeed;
  final int sessionsCount;

  const AnalyticsStats({
    required this.sessions,
    required this.totalReadingTime,
    required this.totalPagesRead,
    required this.booksFinished,
    required this.booksReading,
    required this.currentStreak,
    required this.readingSpeed,
    required this.sessionsCount,
  });
}

abstract class ProfileRepository {
  Future<Either<Failure, AnalyticsStats>> getReadingSessions(
    TimeRange timeRange,
  );
  Future<Either<Failure, List<ReadingGoal>>> getReadingGoals();
  Future<Either<Failure, void>> updateProfile({String? name, String? password});
  Future<Either<Failure, void>> createReadingGoal({
    required GoalUnit unit,
    required GoalPeriod period,
    required int target,
  });

  Future<Either<Failure, void>> deleteReadingGoal(String goalId);
}
