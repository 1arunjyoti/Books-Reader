import 'package:equatable/equatable.dart';

class ReadingSession extends Equatable {
  final DateTime date;
  final int pagesRead;
  final int durationSeconds;

  const ReadingSession({
    required this.date,
    required this.pagesRead,
    required this.durationSeconds,
  });

  @override
  List<Object?> get props => [date, pagesRead, durationSeconds];
}
