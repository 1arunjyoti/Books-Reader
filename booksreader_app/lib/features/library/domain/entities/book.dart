import 'package:equatable/equatable.dart';

enum BookStatus { reading, read, wantToRead, unread }

class Book extends Equatable {
  final String id;
  final String title;
  final String author;
  final String? coverUrl;
  final BookStatus status;
  final double progress;
  final String fileType;
  final String? assetPath;

  const Book({
    required this.id,
    required this.title,
    required this.author,
    this.coverUrl,
    required this.status,
    required this.progress,
    required this.fileType,
    this.assetPath,
  });

  @override
  List<Object?> get props => [
    id,
    title,
    author,
    coverUrl,
    status,
    progress,
    fileType,
    assetPath,
  ];
}
