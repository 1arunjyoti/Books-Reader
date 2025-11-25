import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/providers/api_client_provider.dart';
import '../../domain/entities/reading_goal.dart';
import '../../domain/entities/reading_session.dart';
import '../../domain/repositories/profile_repository.dart';
import '../../data/datasources/profile_service.dart';
import '../../data/repositories/profile_repository_impl.dart';

// Data Source
final profileServiceProvider = Provider<ProfileService>(
  (ref) => ProfileService(apiClient: ref.watch(apiClientProvider)),
);

// Repository
final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  return ProfileRepositoryImpl(ref.watch(profileServiceProvider));
});

// State Classes
class AnalyticsState {
  final List<ReadingSession> sessions;
  final bool isLoading;
  final String? error;
  final TimeRange timeRange;
  // Additional stats from server
  final int totalReadingTime;
  final int totalPagesRead;
  final int booksFinished;
  final int booksReading;
  final int currentStreak;
  final double readingSpeed;
  final int sessionsCount;

  const AnalyticsState({
    this.sessions = const [],
    this.isLoading = false,
    this.error,
    this.timeRange = TimeRange.week,
    this.totalReadingTime = 0,
    this.totalPagesRead = 0,
    this.booksFinished = 0,
    this.booksReading = 0,
    this.currentStreak = 0,
    this.readingSpeed = 0.0,
    this.sessionsCount = 0,
  });

  AnalyticsState copyWith({
    List<ReadingSession>? sessions,
    bool? isLoading,
    String? error,
    TimeRange? timeRange,
    int? totalReadingTime,
    int? totalPagesRead,
    int? booksFinished,
    int? booksReading,
    int? currentStreak,
    double? readingSpeed,
    int? sessionsCount,
  }) {
    return AnalyticsState(
      sessions: sessions ?? this.sessions,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      timeRange: timeRange ?? this.timeRange,
      totalReadingTime: totalReadingTime ?? this.totalReadingTime,
      totalPagesRead: totalPagesRead ?? this.totalPagesRead,
      booksFinished: booksFinished ?? this.booksFinished,
      booksReading: booksReading ?? this.booksReading,
      currentStreak: currentStreak ?? this.currentStreak,
      readingSpeed: readingSpeed ?? this.readingSpeed,
      sessionsCount: sessionsCount ?? this.sessionsCount,
    );
  }
}

class GoalsState {
  final List<ReadingGoal> goals;
  final bool isLoading;
  final String? error;

  const GoalsState({this.goals = const [], this.isLoading = false, this.error});

  GoalsState copyWith({
    List<ReadingGoal>? goals,
    bool? isLoading,
    String? error,
  }) {
    return GoalsState(
      goals: goals ?? this.goals,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

// Notifiers
class AnalyticsNotifier extends Notifier<AnalyticsState> {
  @override
  AnalyticsState build() {
    ref.keepAlive();
    Future.microtask(() => loadSessions());
    return const AnalyticsState(isLoading: true);
  }

  Future<void> loadSessions() async {
    state = state.copyWith(isLoading: true);
    final result = await ref
        .read(profileRepositoryProvider)
        .getReadingSessions(state.timeRange);
    result.fold(
      (failure) =>
          state = state.copyWith(isLoading: false, error: failure.message),
      (statsData) {
        // statsData is AnalyticsStats entity
        state = AnalyticsState(
          sessions: statsData.sessions,
          timeRange: state.timeRange,
          totalReadingTime: statsData.totalReadingTime,
          totalPagesRead: statsData.totalPagesRead,
          booksFinished: statsData.booksFinished,
          booksReading: statsData.booksReading,
          currentStreak: statsData.currentStreak,
          readingSpeed: statsData.readingSpeed,
          sessionsCount: statsData.sessionsCount,
          isLoading: false,
        );
      },
    );
  }

  void setTimeRange(TimeRange timeRange) {
    state = AnalyticsState(isLoading: true, timeRange: timeRange);
    loadSessions();
  }
}

class GoalsNotifier extends Notifier<GoalsState> {
  late final ProfileRepository _repository;

  @override
  GoalsState build() {
    _repository = ref.read(profileRepositoryProvider);
    ref.keepAlive();
    Future.microtask(() => loadGoals());
    return const GoalsState(isLoading: true);
  }

  Future<void> loadGoals() async {
    state = const GoalsState(isLoading: true);
    final result = await _repository.getReadingGoals();
    result.fold(
      (failure) => state = GoalsState(error: failure.message, isLoading: false),
      (goals) => state = GoalsState(goals: goals, isLoading: false),
    );
  }

  Future<void> createGoal({
    required GoalUnit unit,
    required GoalPeriod period,
    required int target,
  }) async {
    state = state.copyWith(isLoading: true);
    final result = await _repository.createReadingGoal(
      unit: unit,
      period: period,
      target: target,
    );
    result.fold(
      (failure) =>
          state = state.copyWith(isLoading: false, error: failure.message),
      (_) => loadGoals(),
    );
  }

  Future<void> deleteGoal(String goalId) async {
    state = state.copyWith(isLoading: true, error: null);

    final result = await _repository.deleteReadingGoal(goalId);

    result.fold(
      (failure) =>
          state = state.copyWith(isLoading: false, error: failure.message),
      (_) async {
        // Explicitly reload goals after successful deletion
        await loadGoals();
      },
    );
  }
}

// Providers
final analyticsProvider = NotifierProvider<AnalyticsNotifier, AnalyticsState>(
  AnalyticsNotifier.new,
);
final goalsProvider = NotifierProvider<GoalsNotifier, GoalsState>(
  GoalsNotifier.new,
);
