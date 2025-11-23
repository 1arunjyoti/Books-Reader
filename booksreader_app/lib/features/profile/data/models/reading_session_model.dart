import 'package:json_annotation/json_annotation.dart';
import '../../domain/entities/reading_session.dart';

part 'reading_session_model.g.dart';

@JsonSerializable()
class ReadingSessionModel extends ReadingSession {
  const ReadingSessionModel({
    required super.date,
    required super.pagesRead,
    required super.durationSeconds,
  });

  factory ReadingSessionModel.fromJson(Map<String, dynamic> json) =>
      _$ReadingSessionModelFromJson(json);

  Map<String, dynamic> toJson() => _$ReadingSessionModelToJson(this);
}
