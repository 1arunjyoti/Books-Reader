// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'reading_goal_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ReadingGoalModel _$ReadingGoalModelFromJson(Map<String, dynamic> json) =>
    ReadingGoalModel(
      id: json['id'] as String,
      type: $enumDecode(_$GoalTypeEnumMap, json['type']),
      targetAmount: (json['targetAmount'] as num).toInt(),
      currentAmount: (json['currentAmount'] as num).toInt(),
      unit: $enumDecode(_$GoalUnitEnumMap, json['unit']),
    );

Map<String, dynamic> _$ReadingGoalModelToJson(ReadingGoalModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'type': _$GoalTypeEnumMap[instance.type]!,
      'targetAmount': instance.targetAmount,
      'currentAmount': instance.currentAmount,
      'unit': _$GoalUnitEnumMap[instance.unit]!,
    };

const _$GoalTypeEnumMap = {
  GoalType.daily: 'daily',
  GoalType.weekly: 'weekly',
  GoalType.monthly: 'monthly',
  GoalType.yearly: 'yearly',
};

const _$GoalUnitEnumMap = {
  GoalUnit.pages: 'pages',
  GoalUnit.minutes: 'minutes',
  GoalUnit.books: 'books',
};
