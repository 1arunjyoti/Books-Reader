import '../../domain/entities/reading_session.dart';
import '../../domain/repositories/profile_repository.dart';

/// Model for analytics statistics from server
class AnalyticsStatsModel {
  final int totalReadingTime; // in seconds
  final int totalPagesRead;
  final int booksFinished;
  final int booksReading;
  final int currentStreak;
  final double readingSpeed; // pages per hour
  final int sessionsCount;
  final List<ChartDataPoint> chartData;
  final String period;

  const AnalyticsStatsModel({
    required this.totalReadingTime,
    required this.totalPagesRead,
    required this.booksFinished,
    required this.booksReading,
    required this.currentStreak,
    required this.readingSpeed,
    required this.sessionsCount,
    required this.chartData,
    required this.period,
  });

  factory AnalyticsStatsModel.fromJson(Map<String, dynamic> json) {
    return AnalyticsStatsModel(
      totalReadingTime: (json['totalReadingTime'] as num?)?.toInt() ?? 0,
      totalPagesRead: (json['totalPagesRead'] as num?)?.toInt() ?? 0,
      booksFinished: (json['booksFinished'] as num?)?.toInt() ?? 0,
      booksReading: (json['booksReading'] as num?)?.toInt() ?? 0,
      currentStreak: (json['currentStreak'] as num?)?.toInt() ?? 0,
      readingSpeed: (json['readingSpeed'] as num?)?.toDouble() ?? 0.0,
      sessionsCount: (json['sessionsCount'] as num?)?.toInt() ?? 0,
      chartData:
          (json['chartData'] as List<dynamic>?)
              ?.map((item) => ChartDataPoint.fromJson(item as Map<String, dynamic>))
              .toList() ??
          [],
      period: (json['period'] as String?) ?? 'all',
    );
  }

  /// Convert to domain AnalyticsStats entity with all data
  AnalyticsStats toAnalyticsStats() {
    return AnalyticsStats(
      sessions: toReadingSessions(),
      totalReadingTime: totalReadingTime,
      totalPagesRead: totalPagesRead,
      booksFinished: booksFinished,
      booksReading: booksReading,
      currentStreak: currentStreak,
      readingSpeed: readingSpeed,
      sessionsCount: sessionsCount,
    );
  }

  /// Convert chart data to ReadingSession entities for UI
  List<ReadingSession> toReadingSessions() {
    return chartData.map((point) {
      return ReadingSession(
        date: DateTime.parse(point.date),
        pagesRead: point.pages,
        durationSeconds: point.minutes * 60,
      );
    }).toList();
  }
}

/// Chart data point from server
class ChartDataPoint {
  final String date; // ISO date string
  final int minutes;
  final int pages;

  const ChartDataPoint({
    required this.date,
    required this.minutes,
    required this.pages,
  });

  factory ChartDataPoint.fromJson(Map<String, dynamic> json) {
    return ChartDataPoint(
      date: (json['date'] as String?) ?? '',
      minutes: (json['minutes'] as num?)?.toInt() ?? 0,
      pages: (json['pages'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {'date': date, 'minutes': minutes, 'pages': pages};
  }
}
