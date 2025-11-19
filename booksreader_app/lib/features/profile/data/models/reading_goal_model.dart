import 'package:json_annotation/json_annotation.dart';
import '../../domain/entities/reading_goal.dart';

part 'reading_goal_model.g.dart';

@JsonSerializable()
class ReadingGoalModel extends ReadingGoal {
  const ReadingGoalModel({
    required super.id,
    required super.type,
    required super.targetAmount,
    required super.currentAmount,
    required super.unit,
  });

  factory ReadingGoalModel.fromJson(Map<String, dynamic> json) =>
      _$ReadingGoalModelFromJson(json);

  Map<String, dynamic> toJson() => _$ReadingGoalModelToJson(this);
}
