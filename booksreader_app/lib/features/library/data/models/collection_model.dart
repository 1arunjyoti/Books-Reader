import 'package:json_annotation/json_annotation.dart';
import '../../domain/entities/collection.dart';

part 'collection_model.g.dart';

@JsonSerializable()
class CollectionModel extends Collection {
  const CollectionModel({
    required super.id,
    required super.userId,
    required super.name,
    super.description,
    required super.color,
    required super.icon,
    required super.isDefault,
    required super.bookIds,
    required super.createdAt,
    required super.updatedAt,
  });

  factory CollectionModel.fromJson(Map<String, dynamic> json) =>
      _$CollectionModelFromJson(json);

  Map<String, dynamic> toJson() => _$CollectionModelToJson(this);

  /// Create a CollectionModel from a Collection entity
  factory CollectionModel.fromEntity(Collection collection) {
    return CollectionModel(
      id: collection.id,
      userId: collection.userId,
      name: collection.name,
      description: collection.description,
      color: collection.color,
      icon: collection.icon,
      isDefault: collection.isDefault,
      bookIds: collection.bookIds,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
    );
  }
}
