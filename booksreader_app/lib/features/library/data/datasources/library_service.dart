import '../../domain/entities/book.dart';
import '../models/book_model.dart';

class LibraryService {
  Future<List<BookModel>> getBooks() async {
    // Simulate network delay
    await Future.delayed(const Duration(seconds: 2));

    return [
      const BookModel(
        id: '1',
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        coverUrl: 'https://covers.openlibrary.org/b/id/7222246-L.jpg',
        status: BookStatus.reading,
        progress: 0.45,
        fileType: 'epub',
      ),
      const BookModel(
        id: '2',
        title: '1984',
        author: 'George Orwell',
        coverUrl: 'https://covers.openlibrary.org/b/id/7222247-L.jpg',
        status: BookStatus.wantToRead,
        progress: 0.0,
        fileType: 'pdf',
      ),
      const BookModel(
        id: '3',
        title: 'Pride and Prejudice',
        author: 'Jane Austen',
        coverUrl: 'https://covers.openlibrary.org/b/id/7222248-L.jpg',
        status: BookStatus.read,
        progress: 1.0,
        fileType: 'epub',
      ),
      const BookModel(
        id: '4',
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        coverUrl: 'https://covers.openlibrary.org/b/id/7222249-L.jpg',
        status: BookStatus.unread,
        progress: 0.0,
        fileType: 'pdf',
      ),
      const BookModel(
        id: '5',
        title: 'The Catcher in the Rye',
        author: 'J.D. Salinger',
        coverUrl: 'https://covers.openlibrary.org/b/id/7222250-L.jpg',
        status: BookStatus.reading,
        progress: 0.15,
        fileType: 'epub',
      ),
      const BookModel(
        id: '6',
        title: 'The Hobbit',
        author: 'J.R.R. Tolkien',
        coverUrl: 'https://covers.openlibrary.org/b/id/7222251-L.jpg',
        status: BookStatus.wantToRead,
        progress: 0.0,
        fileType: 'epub',
      ),
      const BookModel(
        id: '7',
        title: 'India - A Sacred Geography',
        author: 'Diana L. Eck',
        coverUrl: null, // No cover URL for local asset
        status: BookStatus.unread,
        progress: 0.0,
        fileType: 'epub',
        assetPath: 'assets/India - A Sacred Geography.epub',
      ),
      const BookModel(
        id: '8',
        title: 'Machine Learning Course',
        author: 'Unknown',
        coverUrl: null, // No cover URL for local asset
        status: BookStatus.unread,
        progress: 0.0,
        fileType: 'pdf',
        assetPath: 'assets/Machine_Learning_Course__From_Zero_to_Advanced.pdf',
      ),
    ];
  }
}
