import 'package:dartz/dartz.dart';
import '../../../../core/errors/failure.dart';
import '../../domain/entities/book.dart';
import '../../domain/repositories/library_repository.dart';
import '../datasources/library_service.dart';

class LibraryRepositoryImpl implements LibraryRepository {
  final LibraryService service;

  LibraryRepositoryImpl(this.service);

  @override
  Future<Either<Failure, List<Book>>> getBooks() async {
    try {
      final books = await service.getBooks();
      return Right(books);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}
