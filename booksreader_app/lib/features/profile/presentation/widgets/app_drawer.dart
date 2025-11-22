import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:clerk_flutter/clerk_flutter.dart';
import '../../../../core/providers/clerk_auth_state_provider.dart';
import '../../../../core/providers/clerk_token_provider.dart';

class AppDrawer extends ConsumerWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userName = ref.watch(userNameProvider);
    final userEmail = ref.watch(userEmailProvider);

    return Drawer(
      child: Column(
        children: [
          UserAccountsDrawerHeader(
            accountName: Text(userName),
            accountEmail: Text(userEmail),
            currentAccountPicture: CircleAvatar(
              backgroundColor: Colors.white,
              child: Text(
                userName.isNotEmpty
                    ? userName.substring(0, 1).toUpperCase()
                    : 'U',
                style: const TextStyle(fontSize: 24, color: Colors.blue),
              ),
            ),
          ),
          ListTile(
            leading: const Icon(Icons.library_books),
            title: const Text('My Library'),
            onTap: () {
              context.pop(); // Close drawer
              context.go('/library');
            },
          ),
          ListTile(
            leading: const Icon(Icons.person),
            title: const Text('Profile'),
            onTap: () {
              context.pop();
              context.go('/profile');
            },
          ),
          ListTile(
            leading: const Icon(Icons.bar_chart),
            title: const Text('Analytics'),
            onTap: () {
              context.pop();
              context.go('/analytics');
            },
          ),
          ListTile(
            leading: const Icon(Icons.flag),
            title: const Text('Goals'),
            onTap: () {
              context.pop();
              context.go('/goals');
            },
          ),
          const Spacer(),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.red),
            title: const Text('Logout', style: TextStyle(color: Colors.red)),
            onTap: () async {
              // Close drawer
              context.pop();

              try {
                // Call Clerk's signOut method
                await ClerkAuth.of(context).signOut();
                // ClerkAuthBuilder will automatically detect the sign-out and show login UI
              } catch (e) {
                // Fallback: clear providers manually if Clerk signOut fails
                Future.microtask(() {
                  ref.read(clerkTokenProvider.notifier).state = null;
                  ref.read(clerkAuthStateProvider.notifier).state = null;
                });
              }
            },
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}
