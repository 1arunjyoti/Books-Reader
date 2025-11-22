import '../../domain/entities/reading_session.dart';

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
      totalReadingTime: json['totalReadingTime'] ?? 0,
      totalPagesRead: json['totalPagesRead'] ?? 0,
      booksFinished: json['booksFinished'] ?? 0,
      booksReading: json['booksReading'] ?? 0,
      currentStreak: json['currentStreak'] ?? 0,
      readingSpeed: (json['readingSpeed'] ?? 0).toDouble(),
      sessionsCount: json['sessionsCount'] ?? 0,
      chartData:
          (json['chartData'] as List<dynamic>?)
              ?.map((item) => ChartDataPoint.fromJson(item))
              .toList() ??
          [],
      period: json['period'] ?? 'all',
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
      date: json['date'] ?? '',
      minutes: json['minutes'] ?? 0,
      pages: json['pages'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {'date': date, 'minutes': minutes, 'pages': pages};
  }
}
