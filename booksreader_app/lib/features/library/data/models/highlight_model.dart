import '../../domain/entities/highlight.dart';

class HighlightModel extends Highlight {
  HighlightModel({
    required super.id,
    required super.bookId,
    required super.userId,
    required super.text,
    super.cfiRange,
    required super.color,
    required super.hex,
    super.note,
    required super.createdAt,
    super.pageNumber,
    super.rects,
    required super.source,
  });

  factory HighlightModel.fromJson(Map<String, dynamic> json) {
    return HighlightModel(
      id: json['id'] ?? '',
      bookId: json['bookId'] ?? '',
      userId: json['userId'] ?? '',
      text: json['text'] ?? '',
      cfiRange: json['cfiRange'],
      color: json['color'] ?? 'yellow',
      hex: json['hex'] ?? '#FFFF00',
      note: json['note'],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      pageNumber: json['pageNumber'],
      rects: json['rects'],
      source: json['source'] ?? 'EPUB',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'bookId': bookId,
      'userId': userId,
      'text': text,
      'cfiRange': cfiRange,
      'color': color,
      'hex': hex,
      'note': note,
      'createdAt': createdAt.toIso8601String(),
      'pageNumber': pageNumber,
      'rects': rects,
      'source': source,
    };
  }
}
