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
    final currentPath = GoRouterState.of(context).uri.path;

    return Drawer(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topRight: Radius.circular(20),
          bottomRight: Radius.circular(20),
        ),
      ),
      child: SafeArea(
        child: Column(
          children: [
            // Custom Header
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 32, 24, 24),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: Theme.of(context).colorScheme.primary,
                    child: Text(
                      userName.isNotEmpty
                          ? userName.substring(0, 1).toUpperCase()
                          : 'U',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          userName,
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.bold),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          userEmail,
                          style: Theme.of(context).textTheme.bodySmall,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            const SizedBox(height: 16),

            // Navigation Items
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                children: [
                  _DrawerItem(
                    icon: Icons.library_books,
                    label: 'My Library',
                    isSelected: currentPath == '/library',
                    onTap: () {
                      context.pop();
                      context.go('/library');
                    },
                  ),
                  _DrawerItem(
                    icon: Icons.bookmark,
                    label: 'Collections',
                    isSelected: currentPath == '/collections',
                    onTap: () {
                      context.pop();
                      context.push('/collections');
                    },
                  ),
                  _DrawerItem(
                    icon: Icons.bar_chart,
                    label: 'Analytics',
                    isSelected: currentPath == '/analytics',
                    onTap: () {
                      context.pop();
                      context.go('/analytics');
                    },
                  ),
                  _DrawerItem(
                    icon: Icons.flag,
                    label: 'Goals',
                    isSelected: currentPath == '/goals',
                    onTap: () {
                      context.pop();
                      context.go('/goals');
                    },
                  ),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 8),
                    child: Divider(),
                  ),
                  _DrawerItem(
                    icon: Icons.person,
                    label: 'Profile',
                    isSelected: currentPath == '/profile',
                    onTap: () {
                      context.pop();
                      context.go('/profile');
                    },
                  ),
                  _DrawerItem(
                    icon: Icons.settings,
                    label: 'Settings',
                    isSelected: currentPath == '/settings',
                    onTap: () {
                      context.pop();
                      context.push('/settings');
                    },
                  ),
                ],
              ),
            ),

            // Footer
            Padding(
              padding: const EdgeInsets.all(12),
              child: _DrawerItem(
                icon: Icons.logout,
                label: 'Logout',
                isDestructive: true,
                onTap: () async {
                  context.pop();
                  await ClerkAuth.of(context).signOut();
                  ref.read(clerkTokenProvider.notifier).state = null;
                  ref.read(clerkAuthStateProvider.notifier).state = null;
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DrawerItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool isSelected;
  final bool isDestructive;

  const _DrawerItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.isSelected = false,
    this.isDestructive = false,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    final foregroundColor = isDestructive
        ? colorScheme.error
        : isSelected
        ? colorScheme.primary
        : textTheme.bodyMedium?.color;

    final backgroundColor = isSelected
        ? colorScheme.primary.withValues(alpha: 0.1)
        : Colors.transparent;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: backgroundColor,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(icon, color: foregroundColor, size: 24),
                const SizedBox(width: 16),
                Text(
                  label,
                  style: textTheme.titleSmall?.copyWith(
                    fontSize: 14,
                    color: foregroundColor,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
