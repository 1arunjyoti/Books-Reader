import 'package:equatable/equatable.dart';

/// Collection Entity
/// Represents a collection of books
class Collection extends Equatable {
  final String id;
  final String userId;
  final String name;
  final String? description;
  final String color;
  final String icon;
  final bool isDefault;
  final List<String> bookIds;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Collection({
    required this.id,
    required this.userId,
    required this.name,
    this.description,
    required this.color,
    required this.icon,
    required this.isDefault,
    required this.bookIds,
    required this.createdAt,
    required this.updatedAt,
  });

  @override
  List<Object?> get props => [
    id,
    userId,
    name,
    description,
    color,
    icon,
    isDefault,
    bookIds,
    createdAt,
    updatedAt,
  ];

  /// Get the number of books in this collection
  int get bookCount => bookIds.length;
}
