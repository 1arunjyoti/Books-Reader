import 'package:equatable/equatable.dart';

enum GoalType { daily, weekly, monthly, yearly }

enum GoalUnit { pages, minutes, books }

class ReadingGoal extends Equatable {
  final String id;
  final GoalType type;
  final int targetAmount;
  final int currentAmount;
  final GoalUnit unit;

  const ReadingGoal({
    required this.id,
    required this.type,
    required this.targetAmount,
    required this.currentAmount,
    required this.unit,
  });

  @override
  List<Object?> get props => [id, type, targetAmount, currentAmount, unit];
}
