import '../../domain/entities/reading_goal.dart';

class ReadingGoalModel extends ReadingGoal {
  const ReadingGoalModel({
    required super.id,
    required super.period,
    required super.targetAmount,
    required super.currentAmount,
    required super.unit,
  });

  factory ReadingGoalModel.fromJson(Map<String, dynamic> json) {
    // Parse period from server (daily, weekly, monthly, yearly)
    GoalPeriod period;
    switch (json['period']) {
      case 'daily':
        period = GoalPeriod.daily;
        break;
      case 'weekly':
        period = GoalPeriod.weekly;
        break;
      case 'monthly':
        period = GoalPeriod.monthly;
        break;
      case 'yearly':
        period = GoalPeriod.yearly;
        break;
      default:
        period = GoalPeriod.weekly;
    }

    // Parse unit from type (books, pages, time)
    GoalUnit unit;
    switch (json['type']) {
      case 'books':
        unit = GoalUnit.books;
        break;
      case 'time':
        unit = GoalUnit.minutes;
        break;
      default:
        unit = GoalUnit.pages;
    }

    return ReadingGoalModel(
      id: json['id'] ?? '',
      period: period,
      targetAmount: json['target'] ?? 0,
      currentAmount: json['current'] ?? 0,
      unit: unit,
    );
  }

  Map<String, dynamic> toJson() {
    // Convert back to server format
    String typeStr;
    switch (unit) {
      case GoalUnit.books:
        typeStr = 'books';
        break;
      case GoalUnit.minutes:
        typeStr = 'time';
        break;
      default:
        typeStr = 'pages';
    }

    String periodStr;
    switch (period) {
      case GoalPeriod.daily:
        periodStr = 'daily';
        break;
      case GoalPeriod.weekly:
        periodStr = 'weekly';
        break;
      case GoalPeriod.monthly:
        periodStr = 'monthly';
        break;
      case GoalPeriod.yearly:
        periodStr = 'yearly';
        break;
    }

    return {
      'id': id,
      'type': typeStr,
      'period': periodStr,
      'target': targetAmount,
      'current': currentAmount,
    };
  }
}
