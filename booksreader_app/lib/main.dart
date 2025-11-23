import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:clerk_flutter/clerk_flutter.dart';
import 'features/library/presentation/pages/library_page.dart';
import 'features/profile/presentation/pages/profile_page.dart';
import 'features/profile/presentation/pages/analytics_page.dart';
import 'features/profile/presentation/pages/goals_page.dart';
import 'features/library/presentation/pages/reader_page.dart';
import 'features/library/domain/entities/book.dart';
import 'core/providers/clerk_token_provider.dart';
import 'core/providers/clerk_auth_state_provider.dart';

import 'package:hive_flutter/hive_flutter.dart';
import 'features/library/domain/entities/bookmark.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Load environment variables
  await dotenv.load(fileName: ".env.local");

  // Initialize Hive
  await Hive.initFlutter();
  Hive.registerAdapter(BookmarkAdapter());

  runApp(const ProviderScope(child: BooksReaderApp()));
}

final _router = GoRouter(
  initialLocation: '/library',
  routes: [
    GoRoute(path: '/library', builder: (context, state) => const LibraryPage()),
    GoRoute(path: '/profile', builder: (context, state) => const ProfilePage()),
    GoRoute(
      path: '/analytics',
      builder: (context, state) => const AnalyticsPage(),
    ),
    GoRoute(path: '/goals', builder: (context, state) => const GoalsPage()),
    GoRoute(
      path: '/reader',
      builder: (context, state) {
        final book = state.extra as Book;
        return ReaderPage(book: book);
      },
    ),
  ],
);

class BooksReaderApp extends ConsumerWidget {
  const BooksReaderApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final publishableKey = dotenv.env['CLERK_PUBLISHABLE_KEY'];

    if (publishableKey == null || publishableKey.isEmpty) {
      return MaterialApp(
        home: Scaffold(
          body: Center(
            child: Text(
              'Error: CLERK_PUBLISHABLE_KEY not found in .env.local',
              style: TextStyle(color: Colors.red),
            ),
          ),
        ),
      );
    }

    return ClerkAuth(
      config: ClerkAuthConfig(publishableKey: publishableKey),
      child: MaterialApp.router(
        title: 'BooksReader',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF6750A4), // Deep Purple
            brightness: Brightness.light,
          ),
          useMaterial3: true,
          textTheme: GoogleFonts.interTextTheme(),
          appBarTheme: AppBarTheme(
            centerTitle: true,
            titleTextStyle: GoogleFonts.poppins(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
          ),
        ),
        debugShowCheckedModeBanner: false,
        routerConfig: _router,
        builder: (context, child) {
          return ClerkErrorListener(
            child: ClerkAuthBuilder(
              signedInBuilder: (context, authState) {
                // Update providers after the build phase completes
                // This prevents "Tried to modify a provider while the widget tree was building" error
                Future.microtask(() {
                  updateClerkToken(ref, authState);
                  updateClerkAuthState(ref, authState);
                });

                // User is signed in, show the app
                return child ?? const SizedBox.shrink();
              },
              signedOutBuilder: (context, authState) {
                // Clear providers after the build phase completes
                Future.microtask(() {
                  ref.read(clerkTokenProvider.notifier).state = null;
                  ref.read(clerkAuthStateProvider.notifier).state = null;
                });

                // User is signed out, show Clerk's authentication UI
                // Wrap in MaterialApp to provide Navigator context
                return MaterialApp(
                  debugShowCheckedModeBanner: false,
                  theme: ThemeData(
                    colorScheme: ColorScheme.fromSeed(
                      seedColor: const Color(0xFF6750A4),
                      brightness: Brightness.light,
                    ),
                    useMaterial3: true,
                    textTheme: GoogleFonts.interTextTheme(),
                  ),
                  home: Scaffold(
                    body: SafeArea(
                      child: Center(
                        child: SingleChildScrollView(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              // App branding
                              Icon(
                                Icons.book_rounded,
                                size: 80,
                                color: Theme.of(context).colorScheme.primary,
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'BooksReader',
                                style: GoogleFonts.poppins(
                                  fontSize: 32,
                                  fontWeight: FontWeight.bold,
                                  color: Theme.of(context).colorScheme.primary,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Your personal reading companion',
                                style: TextStyle(
                                  fontSize: 16,
                                  color: Colors.grey[600],
                                ),
                              ),
                              const SizedBox(height: 40),
                              // Clerk's pre-built authentication widget
                              const ClerkAuthentication(),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
