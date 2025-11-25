import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:clerk_flutter/clerk_flutter.dart';
import 'features/library/presentation/pages/library_page.dart';
import 'features/library/presentation/pages/collections_page.dart';
import 'features/profile/presentation/pages/profile_page.dart';
import 'features/profile/presentation/pages/analytics_page.dart';
import 'features/profile/presentation/pages/goals_page.dart';
import 'features/library/presentation/pages/reader_page.dart';
import 'features/auth/presentation/pages/auth_page.dart';
import 'features/library/domain/entities/book.dart';
import 'core/providers/clerk_token_provider.dart';
import 'core/providers/clerk_auth_state_provider.dart';
import 'features/settings/presentation/pages/settings_page.dart';
import 'core/providers/theme_provider.dart';
import 'core/theme/app_theme.dart';

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
    GoRoute(
      path: '/collections',
      builder: (context, state) => const CollectionsPage(),
    ),
    GoRoute(path: '/profile', builder: (context, state) => const ProfilePage()),
    GoRoute(
      path: '/analytics',
      builder: (context, state) => const AnalyticsPage(),
    ),
    GoRoute(path: '/goals', builder: (context, state) => const GoalsPage()),
    GoRoute(
      path: '/settings',
      builder: (context, state) => const SettingsPage(),
    ),
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
    final themeMode = ref.watch(themeProvider);
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
        themeMode: themeMode,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        debugShowCheckedModeBanner: false,
        routerConfig: _router,
        builder: (context, child) {
          return ClerkErrorListener(
            child: ClerkAuthBuilder(
              signedInBuilder: (context, authState) {
                // Update providers after the build phase completes
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
                  theme: AppTheme.lightTheme,
                  home: const AuthPage(),
                );
              },
              // Use SplashPage for initial loading state if available in future SDK versions
              // For now, we rely on the fact that ClerkAuthBuilder handles initial state reasonably well
              // but we can wrap the whole thing in a FutureBuilder if we wanted strict splash control.
              // However, since ClerkAuthBuilder is synchronous in its initial build (returns loading or content),
              // we can't easily inject SplashPage *before* it decides.
              // But we can check if authState is initialized.
            ),
          );
        },
      ),
    );
  }
}
