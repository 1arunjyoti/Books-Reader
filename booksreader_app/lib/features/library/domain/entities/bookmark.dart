import 'package:hive/hive.dart';

part 'bookmark.g.dart';

@HiveType(typeId: 1)
class Bookmark extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String bookId;

  @HiveField(2)
  final String userId;

  @HiveField(3)
  final int pageNumber;

  @HiveField(4)
  final String? note;

  @HiveField(5)
  final DateTime createdAt;

  Bookmark({
    required this.id,
    required this.bookId,
    required this.userId,
    required this.pageNumber,
    this.note,
    required this.createdAt,
  });
}
