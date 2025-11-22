import 'package:hive/hive.dart';

part 'bookmark.g.dart';

@HiveType(typeId: 1)
class Bookmark extends HiveObject {
  @HiveField(0)
  final String bookId;

  @HiveField(1)
  final int pageNumber;

  @HiveField(2)
  final String? text; // For highlights

  @HiveField(3)
  final String? note;

  @HiveField(4)
  final String type; // 'bookmark' or 'highlight'

  @HiveField(5)
  final String? color; // Hex color for highlight

  @HiveField(6)
  final DateTime createdAt;

  @HiveField(7)
  final String? cfi; // For EPUB

  Bookmark({
    required this.bookId,
    required this.pageNumber,
    this.text,
    this.note,
    required this.type,
    this.color,
    required this.createdAt,
    this.cfi,
  });
}
