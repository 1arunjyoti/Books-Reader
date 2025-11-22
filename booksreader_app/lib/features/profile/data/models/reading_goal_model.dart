import '../../domain/entities/reading_goal.dart';

class ReadingGoalModel extends ReadingGoal {
  const ReadingGoalModel({
    required super.id,
    required super.type,
    required super.targetAmount,
    required super.currentAmount,
    required super.unit,
  });

  factory ReadingGoalModel.fromJson(Map<String, dynamic> json) {
    // Parse type from server (books, pages, time)
    GoalType goalType;
    switch (json['type']) {
      case 'books':
        goalType = GoalType.yearly;
        break;
      case 'pages':
        goalType = GoalType.monthly;
        break;
      case 'time':
        goalType = GoalType.daily;
        break;
      default:
        goalType = GoalType.weekly;
    }

    // Parse unit from type
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
      type: goalType,
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

    return {
      'id': id,
      'type': typeStr,
      'target': targetAmount,
      'current': currentAmount,
    };
  }
}
