// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'book_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

BookModel _$BookModelFromJson(Map<String, dynamic> json) => BookModel(
      id: json['id'] as String,
      title: json['title'] as String,
      author: json['author'] as String,
      coverUrl: json['coverUrl'] as String?,
      status: $enumDecode(_$BookStatusEnumMap, json['status']),
      progress: (json['progress'] as num).toDouble(),
      fileType: json['fileType'] as String,
    );

Map<String, dynamic> _$BookModelToJson(BookModel instance) => <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'author': instance.author,
      'coverUrl': instance.coverUrl,
      'status': _$BookStatusEnumMap[instance.status]!,
      'progress': instance.progress,
      'fileType': instance.fileType,
    };

const _$BookStatusEnumMap = {
  BookStatus.reading: 'reading',
  BookStatus.read: 'read',
  BookStatus.wantToRead: 'wantToRead',
  BookStatus.unread: 'unread',
};
