import 'package:dartz/dartz.dart';
import '../../../../core/errors/failure.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/book.dart';
import '../repositories/library_repository.dart';

class GetBooks implements UseCase<List<Book>, NoParams> {
  final LibraryRepository repository;

  GetBooks(this.repository);

  @override
  Future<Either<Failure, List<Book>>> call(NoParams params) async {
    return await repository.getBooks();
  }
}
