import 'package:dartz/dartz.dart';
import '../../../../core/errors/failure.dart';
import '../../domain/entities/reading_goal.dart';
import '../../domain/entities/reading_session.dart';
import '../../domain/repositories/profile_repository.dart';
import '../datasources/profile_service.dart';

class ProfileRepositoryImpl implements ProfileRepository {
  final ProfileService service;

  ProfileRepositoryImpl(this.service);

  @override
  Future<Either<Failure, AnalyticsStats>> getReadingSessions(
    TimeRange timeRange,
  ) async {
    try {
      final stats = await service.getReadingStatsWithSessions(timeRange);

      if (timeRange == TimeRange.year) {
        // Aggregate by month
        final monthlySessionsMap = <String, ReadingSession>{};

        for (final session in stats.sessions) {
          // Key by YYYY-MM-01
          final key = DateTime(
            session.date.year,
            session.date.month,
            1,
          ).toIso8601String();

          if (monthlySessionsMap.containsKey(key)) {
            final existing = monthlySessionsMap[key]!;
            monthlySessionsMap[key] = ReadingSession(
              date: existing.date,
              pagesRead: existing.pagesRead + session.pagesRead,
              durationSeconds:
                  existing.durationSeconds + session.durationSeconds,
            );
          } else {
            monthlySessionsMap[key] = ReadingSession(
              date: DateTime(session.date.year, session.date.month, 1),
              pagesRead: session.pagesRead,
              durationSeconds: session.durationSeconds,
            );
          }
        }

        final monthlySessions = monthlySessionsMap.values.toList()
          ..sort((a, b) => a.date.compareTo(b.date));

        return Right(
          AnalyticsStats(
            sessions: monthlySessions,
            totalReadingTime: stats.totalReadingTime,
            totalPagesRead: stats.totalPagesRead,
            booksFinished: stats.booksFinished,
            booksReading: stats.booksReading,
            currentStreak: stats.currentStreak,
            readingSpeed: stats.readingSpeed,
            sessionsCount: stats.sessionsCount,
          ),
        );
      }

      return Right(stats);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<ReadingGoal>>> getReadingGoals() async {
    try {
      final goals = await service.getReadingGoals();
      return Right(goals);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> updateProfile({
    String? name,
    String? password,
  }) async {
    try {
      await service.updateProfile(name: name, password: password);
      return const Right(null);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> createReadingGoal({
    required GoalUnit unit,
    required GoalPeriod period,
    required int target,
  }) async {
    try {
      await service.createReadingGoal(
        unit: unit,
        period: period,
        target: target,
      );
      return const Right(null);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> deleteReadingGoal(String goalId) async {
    try {
      await service.deleteReadingGoal(goalId);
      return const Right(null);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}
