// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'highlight.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class HighlightAdapter extends TypeAdapter<Highlight> {
  @override
  final int typeId = 2;

  @override
  Highlight read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return Highlight(
      id: fields[0] as String,
      bookId: fields[1] as String,
      userId: fields[2] as String,
      text: fields[3] as String,
      cfiRange: fields[4] as String?,
      color: fields[5] as String,
      hex: fields[6] as String,
      note: fields[7] as String?,
      createdAt: fields[8] as DateTime,
      pageNumber: fields[9] as int?,
      rects: (fields[10] as List?)?.cast<dynamic>(),
      source: fields[11] as String,
    );
  }

  @override
  void write(BinaryWriter writer, Highlight obj) {
    writer
      ..writeByte(12)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.bookId)
      ..writeByte(2)
      ..write(obj.userId)
      ..writeByte(3)
      ..write(obj.text)
      ..writeByte(4)
      ..write(obj.cfiRange)
      ..writeByte(5)
      ..write(obj.color)
      ..writeByte(6)
      ..write(obj.hex)
      ..writeByte(7)
      ..write(obj.note)
      ..writeByte(8)
      ..write(obj.createdAt)
      ..writeByte(9)
      ..write(obj.pageNumber)
      ..writeByte(10)
      ..write(obj.rects)
      ..writeByte(11)
      ..write(obj.source);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is HighlightAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
