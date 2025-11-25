import 'package:hive/hive.dart';

part 'highlight.g.dart';

@HiveType(typeId: 2)
class Highlight extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String bookId;

  @HiveField(2)
  final String userId;

  @HiveField(3)
  final String text;

  @HiveField(4)
  final String? cfiRange;

  @HiveField(5)
  final String color;

  @HiveField(6)
  final String hex;

  @HiveField(7)
  final String? note;

  @HiveField(8)
  final DateTime createdAt;

  @HiveField(9)
  final int? pageNumber;

  @HiveField(10)
  final List<dynamic>? rects; // Storing as dynamic list for JSON flexibility

  @HiveField(11)
  final String source; // 'EPUB', 'PDF', 'TXT'

  Highlight({
    required this.id,
    required this.bookId,
    required this.userId,
    required this.text,
    this.cfiRange,
    required this.color,
    required this.hex,
    this.note,
    required this.createdAt,
    this.pageNumber,
    this.rects,
    required this.source,
  });
}
