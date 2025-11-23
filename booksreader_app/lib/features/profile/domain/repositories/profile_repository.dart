import 'package:dartz/dartz.dart';
import '../../../../core/errors/failure.dart';
import '../entities/reading_goal.dart';
import '../entities/reading_session.dart';

enum TimeRange { day, week, month, year }

abstract class ProfileRepository {
  Future<Either<Failure, List<ReadingSession>>> getReadingSessions(
    TimeRange timeRange,
  );
  Future<Either<Failure, List<ReadingGoal>>> getReadingGoals();
  Future<Either<Failure, void>> updateProfile({String? name, String? password});
}
