import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../domain/entities/book.dart';
import '../providers/library_provider.dart';
import '../widgets/book_card.dart';
import '../widgets/book_list_item.dart';
import '../widgets/library_shimmer.dart';
import '../../../profile/presentation/widgets/app_drawer.dart';
import '../../../../core/providers/clerk_auth_state_provider.dart';
import '../widgets/advanced_filters_bottom_sheet.dart';

class LibraryPage extends ConsumerStatefulWidget {
  const LibraryPage({super.key});

  @override
  ConsumerState<LibraryPage> createState() => _LibraryPageState();
}

class _LibraryPageState extends ConsumerState<LibraryPage> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    // Setup scroll listener for infinite scroll
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController
      ..removeListener(_onScroll)
      ..dispose();
    super.dispose();
  }

  void _onScroll() {
    // Trigger load more when user scrolls to 80% of the list
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent * 0.8) {
      ref.read(libraryProvider.notifier).loadMoreBooks();
    }
  }

  @override
  Widget build(BuildContext context) {
    final libraryState = ref.watch(libraryProvider);
    final notifier = ref.read(libraryProvider.notifier);
    final userName = ref.watch(userNameProvider);

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      drawer: const AppDrawer(),
      body: SafeArea(
        child: Column(
          children: [
            // Custom Header
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
              child: Row(
                children: [
                  Builder(
                    builder: (context) => GestureDetector(
                      onTap: () => Scaffold.of(context).openDrawer(),
                      child: CircleAvatar(
                        radius: 20,
                        backgroundColor: Theme.of(context).colorScheme.primary,
                        child: Text(
                          userName.isNotEmpty
                              ? userName.substring(0, 1).toUpperCase()
                              : 'U',
                          style: GoogleFonts.poppins(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Text(
                    'My Library',
                    style: GoogleFonts.poppins(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).textTheme.titleLarge?.color,
                    ),
                  ),
                  const Spacer(),

                  /* View Mode Toggle */
                  IconButton(
                    onPressed: notifier.toggleViewMode,
                    icon: Icon(
                      libraryState.isGridView
                          ? Icons.view_list_rounded
                          : Icons.grid_view_rounded,
                      color: Theme.of(context).iconTheme.color,
                    ),
                    style: IconButton.styleFrom(
                      backgroundColor: Theme.of(context).cardColor,
                      padding: const EdgeInsets.all(10),
                    ),
                  ),
                ],
              ),
            ),

            // Search & Filters
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          decoration: BoxDecoration(
                            color: Theme.of(context).cardColor,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.05),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: TextField(
                            onChanged: notifier.setSearchQuery,
                            decoration: InputDecoration(
                              hintText: 'Search books...',
                              hintStyle: GoogleFonts.inter(
                                color: Theme.of(context).hintColor,
                              ),
                              prefixIcon: Icon(
                                Icons.search,
                                color: Theme.of(context).hintColor,
                              ),
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 20,
                                vertical: 16,
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Container(
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.primary,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: Theme.of(
                                context,
                              ).colorScheme.primary.withValues(alpha: 0.3),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: IconButton(
                          onPressed: () async {
                            // Import file_picker at top of file
                            final notifier = ref.read(libraryProvider.notifier);
                            await notifier.pickAndUploadFile(context);
                          },
                          icon: const Icon(Icons.add, color: Colors.white),
                          padding: const EdgeInsets.all(16),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  /* Filters */
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    clipBehavior: Clip.none,
                    child: Row(
                      children: [
                        /* Advanced Filters icon */
                        Badge(
                          isLabelVisible:
                              libraryState.advancedFilters.hasActiveFilters,
                          label: Text(
                            '${libraryState.advancedFilters.activeFiltersCount}',
                          ),
                          backgroundColor: Theme.of(
                            context,
                          ).colorScheme.primary,
                          child: IconButton(
                            style: IconButton.styleFrom(
                              backgroundColor:
                                  libraryState.advancedFilters.hasActiveFilters
                                  ? Theme.of(
                                      context,
                                    ).colorScheme.primaryContainer
                                  : Theme.of(context).cardColor,
                              padding: const EdgeInsets.all(12),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(24),
                              ),
                            ),
                            icon: Icon(
                              Icons.filter_alt_outlined,
                              color:
                                  libraryState.advancedFilters.hasActiveFilters
                                  ? Theme.of(context).colorScheme.primary
                                  : null,
                            ),
                            onPressed: () {
                              showModalBottomSheet(
                                context: context,
                                isScrollControlled: true,
                                backgroundColor: Colors.transparent,
                                builder: (context) => AdvancedFiltersBottomSheet(
                                  initialFilters: libraryState.advancedFilters,
                                  onApply: (filters) {
                                    // Apply advanced filters to library
                                    notifier.applyAdvancedFilters(filters);

                                    // Show confirmation
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text(
                                          filters.hasActiveFilters
                                              ? 'Filters applied: ${filters.activeFiltersCount} active'
                                              : 'Filters cleared',
                                        ),
                                        duration: const Duration(seconds: 2),
                                      ),
                                    );
                                  },
                                ),
                              );
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        _FilterChip(
                          label: 'All',
                          isSelected: libraryState.statusFilter == null,
                          onSelected: () => notifier.setStatusFilter(null),
                        ),
                        const SizedBox(width: 12),
                        _FilterChip(
                          label: 'Reading',
                          isSelected:
                              libraryState.statusFilter == BookStatus.reading,
                          onSelected: () =>
                              notifier.setStatusFilter(BookStatus.reading),
                        ),
                        const SizedBox(width: 12),
                        _FilterChip(
                          label: 'Want to Read',
                          isSelected:
                              libraryState.statusFilter ==
                              BookStatus.wantToRead,
                          onSelected: () =>
                              notifier.setStatusFilter(BookStatus.wantToRead),
                        ),
                        const SizedBox(width: 12),
                        _FilterChip(
                          label: 'Read',
                          isSelected:
                              libraryState.statusFilter == BookStatus.read,
                          onSelected: () =>
                              notifier.setStatusFilter(BookStatus.read),
                        ),
                        const SizedBox(width: 12),
                        _FilterChip(
                          label: 'Unread',
                          isSelected:
                              libraryState.statusFilter == BookStatus.unread,
                          onSelected: () =>
                              notifier.setStatusFilter(BookStatus.unread),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Content
            Expanded(
              child: libraryState.isLoading
                  ? LibraryShimmer(isGridView: libraryState.isGridView)
                  : libraryState.error != null
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            Icons.error_outline_rounded,
                            size: 64,
                            color: Colors.red,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Error loading books',
                            style: GoogleFonts.poppins(
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                              color: Theme.of(
                                context,
                              ).textTheme.titleMedium?.color,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 32),
                            child: Text(
                              libraryState.error!,
                              textAlign: TextAlign.center,
                              style: GoogleFonts.inter(
                                color: Colors.grey[600],
                                fontSize: 14,
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),
                          ElevatedButton.icon(
                            onPressed: () => notifier.loadBooks(),
                            icon: const Icon(Icons.refresh),
                            label: const Text('Retry'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Theme.of(
                                context,
                              ).colorScheme.primary,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 24,
                                vertical: 12,
                              ),
                            ),
                          ),
                        ],
                      ),
                    )
                  : libraryState.filteredBooks.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.menu_book_rounded,
                            size: 64,
                            color: Colors.grey[300],
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'No books found',
                            style: GoogleFonts.inter(
                              color: Colors.grey[500],
                              fontSize: 16,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    )
                  : libraryState.isGridView
                  ? GridView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            childAspectRatio: 0.7,
                            crossAxisSpacing: 20,
                            mainAxisSpacing: 24,
                          ),
                      itemCount:
                          libraryState.filteredBooks.length +
                          (libraryState.isLoadingMore ? 1 : 0),
                      itemBuilder: (context, index) {
                        // Show loading indicator at the end
                        if (index == libraryState.filteredBooks.length) {
                          return const Center(
                            child: Padding(
                              padding: EdgeInsets.all(16.0),
                              child: CircularProgressIndicator(),
                            ),
                          );
                        }

                        final book = libraryState.filteredBooks[index];
                        return BookCard(key: ValueKey(book.id), book: book);
                      },
                    )
                  : ListView.separated(
                      controller: _scrollController,
                      padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
                      itemCount:
                          libraryState.filteredBooks.length +
                          (libraryState.isLoadingMore ? 1 : 0),
                      separatorBuilder: (context, index) =>
                          const SizedBox(height: 16),
                      itemBuilder: (context, index) {
                        // Show loading indicator at the end
                        if (index == libraryState.filteredBooks.length) {
                          return const Center(
                            child: Padding(
                              padding: EdgeInsets.all(16.0),
                              child: CircularProgressIndicator(),
                            ),
                          );
                        }

                        final book = libraryState.filteredBooks[index];
                        return BookListItem(key: ValueKey(book.id), book: book);
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onSelected;

  const _FilterChip({
    required this.label,
    required this.isSelected,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onSelected,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected
              ? Theme.of(context).colorScheme.primary
              : Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(24),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: Theme.of(
                      context,
                    ).colorScheme.primary.withValues(alpha: 0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ]
              : [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            color: isSelected
                ? Colors.white
                : Theme.of(context).textTheme.bodyMedium?.color,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
            fontSize: 14,
          ),
        ),
      ),
    );
  }
}
