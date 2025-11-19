import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/entities/reading_goal.dart';
import '../../domain/entities/reading_session.dart';
import '../../domain/repositories/profile_repository.dart';
import '../../data/datasources/profile_service.dart';
import '../../data/repositories/profile_repository_impl.dart';

// Data Source
final profileServiceProvider = Provider<ProfileService>(
  (ref) => ProfileService(),
);

// Repository
final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  return ProfileRepositoryImpl(ref.read(profileServiceProvider));
});

// State Classes
class AnalyticsState {
  final List<ReadingSession> sessions;
  final bool isLoading;
  final String? error;
  final TimeRange timeRange;

  const AnalyticsState({
    this.sessions = const [],
    this.isLoading = false,
    this.error,
    this.timeRange = TimeRange.week,
  });
}

class GoalsState {
  final List<ReadingGoal> goals;
  final bool isLoading;
  final String? error;

  const GoalsState({this.goals = const [], this.isLoading = false, this.error});
}

// Notifiers
class AnalyticsNotifier extends Notifier<AnalyticsState> {
  @override
  AnalyticsState build() {
    Future.microtask(() => loadSessions());
    return const AnalyticsState(isLoading: true);
  }

  Future<void> loadSessions() async {
    state = AnalyticsState(isLoading: true, timeRange: state.timeRange);
    final result = await ref
        .read(profileRepositoryProvider)
        .getReadingSessions(state.timeRange);
    result.fold(
      (failure) => state = AnalyticsState(
        error: failure.message,
        timeRange: state.timeRange,
      ),
      (sessions) => state = AnalyticsState(
        sessions: sessions,
        timeRange: state.timeRange,
      ),
    );
  }

  void setTimeRange(TimeRange timeRange) {
    state = AnalyticsState(isLoading: true, timeRange: timeRange);
    loadSessions();
  }
}

class GoalsNotifier extends Notifier<GoalsState> {
  @override
  GoalsState build() {
    Future.microtask(() => loadGoals());
    return const GoalsState(isLoading: true);
  }

  Future<void> loadGoals() async {
    state = const GoalsState(isLoading: true);
    final result = await ref.read(profileRepositoryProvider).getReadingGoals();
    result.fold(
      (failure) => state = GoalsState(error: failure.message),
      (goals) => state = GoalsState(goals: goals),
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
