import '../../domain/entities/bookmark.dart';

class BookmarkModel extends Bookmark {
  BookmarkModel({
    required super.id,
    required super.bookId,
    required super.userId,
    required super.pageNumber,
    super.note,
    required super.createdAt,
  });

  factory BookmarkModel.fromJson(Map<String, dynamic> json) {
    return BookmarkModel(
      id: json['id'] ?? '',
      bookId: json['bookId'] ?? '',
      userId: json['userId'] ?? '',
      pageNumber: json['pageNumber'] ?? 0,
      note: json['note'],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'bookId': bookId,
      'userId': userId,
      'pageNumber': pageNumber,
      'note': note,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
