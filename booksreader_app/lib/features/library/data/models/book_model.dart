import 'package:json_annotation/json_annotation.dart';
import '../../domain/entities/book.dart';

part 'book_model.g.dart';

@JsonSerializable()
class BookModel extends Book {
  const BookModel({
    required super.id,
    required super.title,
    required super.author,
    super.coverUrl,
    required super.status,
    required super.progress,
    required super.fileType,
    super.assetPath,
  });

  factory BookModel.fromJson(Map<String, dynamic> json) =>
      _$BookModelFromJson(json);

  Map<String, dynamic> toJson() => _$BookModelToJson(this);
}
