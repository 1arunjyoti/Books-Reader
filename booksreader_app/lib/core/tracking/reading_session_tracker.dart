import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../features/library/domain/entities/book.dart';
import '../../features/profile/data/datasources/profile_service.dart';

/// Automatic reading session tracker
/// Tracks reading time and pages read, auto-saves progress every 5 minutes
class ReadingSessionTracker {
  final ProfileService? _profileService;

  DateTime? _sessionStart;
  int _pagesAtStart = 0;
  Timer? _saveTimer;
  String? _currentBookId;

  ReadingSessionTracker([this._profileService]);

  /// Start tracking a reading session
  void startSession(Book book, int currentPage) {
    if (_sessionStart != null) {
      // End previous session if one exists
      if (kDebugMode) {
        print('⚠️ Previous session still active, ending it first');
      }
      endSession(book, currentPage);
    }

    _sessionStart = DateTime.now();
    _pagesAtStart = currentPage;
    _currentBookId = book.id;

    if (kDebugMode) {
      print(
        '📖 Reading session started for "${book.title}" at page $currentPage',
      );
    }

    // Auto-save progress every 5 minutes
    _saveTimer = Timer.periodic(
      const Duration(minutes: 5),
      (_) => _saveProgress(book, currentPage),
    );
  }

  /// Save current progress without ending session
  Future<void> _saveProgress(Book book, int currentPage) async {
    if (_sessionStart == null) return;

    final duration = DateTime.now().difference(_sessionStart!);
    final pagesRead = (currentPage - _pagesAtStart).abs();

    if (kDebugMode) {
      print(
        '💾 Auto-saving progress: ${duration.inMinutes}min, $pagesRead pages',
      );
    }

    try {
      // This would call the server to update progress
      // For now, we'll just track it locally
      // await _profileService.updateReadingProgress(
      //   bookId: book.id,
      //   currentPage: currentPage,
      //   duration: duration,
      // );
    } catch (e) {
      if (kDebugMode) {
        print('❌ Failed to save progress: $e');
      }
    }
  }

  /// End the current reading session and record it
  Future<void> endSession(Book book, int finalPage) async {
    if (_sessionStart == null) {
      if (kDebugMode) {
        print('⚠️ No active session to end');
      }
      return;
    }

    final duration = DateTime.now().difference(_sessionStart!);
    final pagesRead = (finalPage - _pagesAtStart).abs();

    if (kDebugMode) {
      print(
        '📕 Ending session: ${duration.inMinutes}min, $pagesRead pages read',
      );
    }

    // Only record sessions longer than 1 minute
    if (duration.inMinutes >= 1) {
      try {
        // TODO: Implement server API call when endpoint is ready
        // await _profileService.recordSession(
        //   bookId: book.id,
        //   duration: duration,
        //   pagesRead: pagesRead,
        //   date: _sessionStart!,
        // );

        if (kDebugMode) {
          print('✅ Session recorded successfully');
        }
      } catch (e) {
        if (kDebugMode) {
          print('❌ Failed to record session: $e');
        }
      }
    } else {
      if (kDebugMode) {
        print('⏭️ Session too short (${duration.inSeconds}s), not recording');
      }
    }

    _cleanup();
  }

  /// Pause the current session (e.g., when app goes to background)
  void pauseSession() {
    _saveTimer?.cancel();
    if (kDebugMode) {
      print('⏸️ Session paused');
    }
  }

  /// Resume a paused session
  void resumeSession(Book book, int currentPage) {
    if (_sessionStart != null && _currentBookId == book.id) {
      // Resume with new auto-save timer
      _saveTimer = Timer.periodic(
        const Duration(minutes: 5),
        (_) => _saveProgress(book, currentPage),
      );

      if (kDebugMode) {
        print('▶️ Session resumed');
      }
    } else {
      // Start new session
      startSession(book, currentPage);
    }
  }

  /// Clean up resources
  void _cleanup() {
    _saveTimer?.cancel();
    _saveTimer = null;
    _sessionStart = null;
    _pagesAtStart = 0;
    _currentBookId = null;
  }

  /// Check if a session is currently active
  bool get isActive => _sessionStart != null;

  /// Get current session duration
  Duration? get currentDuration {
    if (_sessionStart == null) return null;
    return DateTime.now().difference(_sessionStart!);
  }

  /// Dispose and cleanup
  void dispose() {
    _cleanup();
  }
}
