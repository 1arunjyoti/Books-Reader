import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../tracking/reading_session_tracker.dart';

/// Provider for ReadingSessionTracker
/// Note: ProfileService will be added when backend API endpoint is ready
final readingSessionTrackerProvider = Provider<ReadingSessionTracker>((ref) {
  return ReadingSessionTracker();
});
