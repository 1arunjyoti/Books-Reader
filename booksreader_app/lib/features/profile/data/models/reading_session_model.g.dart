// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'reading_session_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ReadingSessionModel _$ReadingSessionModelFromJson(Map<String, dynamic> json) =>
    ReadingSessionModel(
      date: DateTime.parse(json['date'] as String),
      pagesRead: (json['pagesRead'] as num).toInt(),
      durationSeconds: (json['durationSeconds'] as num).toInt(),
    );

Map<String, dynamic> _$ReadingSessionModelToJson(
        ReadingSessionModel instance) =>
    <String, dynamic>{
      'date': instance.date.toIso8601String(),
      'pagesRead': instance.pagesRead,
      'durationSeconds': instance.durationSeconds,
    };
