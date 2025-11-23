import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:booksreader/main.dart';

void main() {
  testWidgets('Counter increments smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const ProviderScope(child: BooksReaderApp()));

    // Verify that our counter starts at 0.
    // Note: The default counter test is not applicable to the current app structure.
    // We should replace this with a test relevant to the Splash/Welcome screen.
    // For now, just checking if the app builds without crashing.
    expect(find.byType(BooksReaderApp), findsOneWidget);
  });
}
