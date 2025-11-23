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
  Future<Either<Failure, List<ReadingSession>>> getReadingSessions(
    TimeRange timeRange,
  ) async {
    try {
      final sessions = await service.getReadingSessions(timeRange);
      return Right(sessions);
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
}
