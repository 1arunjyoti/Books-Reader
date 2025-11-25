import 'package:equatable/equatable.dart';

enum GoalPeriod { daily, weekly, monthly, yearly }

enum GoalUnit { pages, minutes, books }

class ReadingGoal extends Equatable {
  final String id;
  final GoalPeriod period;
  final int targetAmount;
  final int currentAmount;
  final GoalUnit unit;

  const ReadingGoal({
    required this.id,
    required this.period,
    required this.targetAmount,
    required this.currentAmount,
    required this.unit,
  });

  @override
  List<Object?> get props => [id, period, targetAmount, currentAmount, unit];
}
