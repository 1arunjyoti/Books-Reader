import 'package:dartz/dartz.dart';
import '../../../../core/errors/failure.dart';
import '../entities/book.dart';

abstract class LibraryRepository {
  Future<Either<Failure, List<Book>>> getBooks();
}
