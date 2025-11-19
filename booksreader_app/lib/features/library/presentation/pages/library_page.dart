import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/entities/book.dart';
import '../providers/library_provider.dart';
import '../widgets/book_card.dart';
import '../widgets/book_list_item.dart';
import '../widgets/library_shimmer.dart';
import '../../../profile/presentation/widgets/app_drawer.dart';

class LibraryPage extends ConsumerWidget {
  const LibraryPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final libraryState = ref.watch(libraryProvider);
    final notifier = ref.read(libraryProvider.notifier);

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text(
          'My Library',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            onPressed: notifier.toggleViewMode,
            icon: Icon(
              libraryState.isGridView ? Icons.view_list : Icons.grid_view,
              color: Colors.grey[700],
            ),
          ),
        ],
      ),
      drawer: const AppDrawer(),
      body: SafeArea(
        child: Column(
          children: [
            // Search & Filters
            Container(
              padding: const EdgeInsets.all(16),
              color: Colors.white,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          onChanged: notifier.setSearchQuery,
                          decoration: InputDecoration(
                            hintText: 'Search books...',
                            prefixIcon: const Icon(Icons.search),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide.none,
                            ),
                            filled: true,
                            fillColor: Colors.grey[100],
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      FilledButton.icon(
                        onPressed: () {
                          // TODO: Implement upload
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Upload feature coming soon'),
                            ),
                          );
                        },
                        icon: const Icon(Icons.upload),
                        label: const Text('Upload'),
                        style: FilledButton.styleFrom(
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 16,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _FilterChip(
                          label: 'All',
                          isSelected: libraryState.statusFilter == null,
                          onSelected: () => notifier.setStatusFilter(null),
                        ),
                        const SizedBox(width: 8),
                        _FilterChip(
                          label: 'Reading',
                          isSelected:
                              libraryState.statusFilter == BookStatus.reading,
                          onSelected: () =>
                              notifier.setStatusFilter(BookStatus.reading),
                        ),
                        const SizedBox(width: 8),
                        _FilterChip(
                          label: 'Want to Read',
                          isSelected:
                              libraryState.statusFilter ==
                              BookStatus.wantToRead,
                          onSelected: () =>
                              notifier.setStatusFilter(BookStatus.wantToRead),
                        ),
                        const SizedBox(width: 8),
                        _FilterChip(
                          label: 'Read',
                          isSelected:
                              libraryState.statusFilter == BookStatus.read,
                          onSelected: () =>
                              notifier.setStatusFilter(BookStatus.read),
                        ),
                        const SizedBox(width: 8),
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

            // Content
            Expanded(
              child: libraryState.isLoading
                  ? LibraryShimmer(isGridView: libraryState.isGridView)
                  : libraryState.filteredBooks.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.library_books,
                            size: 64,
                            color: Colors.grey[300],
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'No books found',
                            style: TextStyle(
                              color: Colors.grey[500],
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),
                    )
                  : libraryState.isGridView
                  ? GridView.builder(
                      padding: const EdgeInsets.all(16),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            childAspectRatio: 0.65,
                            crossAxisSpacing: 16,
                            mainAxisSpacing: 16,
                          ),
                      itemCount: libraryState.filteredBooks.length,
                      itemBuilder: (context, index) =>
                          BookCard(book: libraryState.filteredBooks[index]),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: libraryState.filteredBooks.length,
                      separatorBuilder: (context, index) =>
                          const SizedBox(height: 16),
                      itemBuilder: (context, index) =>
                          BookListItem(book: libraryState.filteredBooks[index]),
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
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) => onSelected(),
      backgroundColor: Colors.white,
      selectedColor: Theme.of(context).colorScheme.primaryContainer,
      labelStyle: TextStyle(
        color: isSelected
            ? Theme.of(context).colorScheme.onPrimaryContainer
            : Colors.black87,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(
          color: isSelected ? Colors.transparent : Colors.grey[300]!,
        ),
      ),
    );
  }
}
