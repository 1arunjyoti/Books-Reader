import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../domain/entities/book.dart';
import 'add_to_collection_dialog.dart';
// import '../../../../core/utils/image_cache_manager.dart';

class BookCard extends StatelessWidget {
  final Book book;

  const BookCard({super.key, required this.book});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: GestureDetector(
        onTap: () {
          context.push('/reader', extra: book);
        },
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  CachedNetworkImage(
                    imageUrl: book.coverUrl ?? '',
                    fit: BoxFit.cover,
                    // Memory cache constraints for better performance
                    memCacheWidth: 400,
                    memCacheHeight: 600,
                    maxWidthDiskCache: 800,
                    maxHeightDiskCache: 1200,
                    // Using default cache manager for now
                    // cacheManager: BookCoverCacheManager.instance,
                    placeholder: (context, url) => Container(
                      color: Theme.of(
                        context,
                      ).colorScheme.surfaceContainerHighest,
                      child: const Center(
                        child: Icon(Icons.image, color: Colors.grey),
                      ),
                    ),
                    errorWidget: (context, url, error) => Container(
                      color: Theme.of(
                        context,
                      ).colorScheme.surfaceContainerHighest,
                      child: Center(
                        child: Icon(
                          Icons.book,
                          size: 40,
                          color: Colors.grey[400],
                        ),
                      ),
                    ),
                  ),

                  // Progress indicator
                  if (book.status == BookStatus.reading)
                    Positioned(
                      bottom: 0,
                      left: 0,
                      right: 0,
                      child: LinearProgressIndicator(
                        value: book.progress,
                        backgroundColor: Colors.black.withValues(alpha: 0.3),
                        valueColor: AlwaysStoppedAnimation<Color>(
                          Theme.of(context).colorScheme.primary,
                        ),
                        minHeight: 4,
                      ),
                    ),

                  // Action menu button
                  Positioned(
                    top: 4,
                    right: 4,
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.4),
                        shape: BoxShape.circle,
                      ),
                      child: PopupMenuButton<String>(
                        icon: const Icon(
                          Icons.more_vert,
                          color: Colors.white,
                          size: 20,
                        ),
                        color: Theme.of(context).cardColor,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        offset: const Offset(0, 40),
                        onSelected: (value) {
                          _handleMenuAction(context, value, book);
                        },
                        itemBuilder: (context) => [
                          PopupMenuItem(
                            value: 'download',
                            child: Row(
                              children: [
                                Icon(
                                  Icons.download_rounded,
                                  size: 20,
                                  color: Theme.of(context).colorScheme.primary,
                                ),
                                const SizedBox(width: 12),
                                Text(
                                  'Download',
                                  style: GoogleFonts.inter(fontSize: 14),
                                ),
                              ],
                            ),
                          ),
                          PopupMenuItem(
                            value: 'mark_read',
                            child: Row(
                              children: [
                                Icon(
                                  Icons.check_circle_outline,
                                  size: 20,
                                  color: Colors.green,
                                ),
                                const SizedBox(width: 12),
                                Text(
                                  'Mark as Read',
                                  style: GoogleFonts.inter(fontSize: 14),
                                ),
                              ],
                            ),
                          ),
                          PopupMenuItem(
                            value: 'add_collection',
                            child: Row(
                              children: [
                                Icon(
                                  Icons.bookmark_add_outlined,
                                  size: 20,
                                  color: Colors.amber,
                                ),
                                const SizedBox(width: 12),
                                Text(
                                  'Add to Collection',
                                  style: GoogleFonts.inter(fontSize: 14),
                                ),
                              ],
                            ),
                          ),
                          const PopupMenuDivider(),
                          PopupMenuItem(
                            value: 'delete',
                            child: Row(
                              children: [
                                const Icon(
                                  Icons.delete_outline,
                                  size: 20,
                                  color: Colors.red,
                                ),
                                const SizedBox(width: 12),
                                Text(
                                  'Delete',
                                  style: GoogleFonts.inter(
                                    fontSize: 14,
                                    color: Colors.red,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            /* Book info */
            Padding(
              padding: const EdgeInsets.all(12.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    book.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                      color: Theme.of(context).textTheme.titleMedium?.color,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    book.author,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.inter(
                      color: Theme.of(context).textTheme.bodyMedium?.color,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  static void _handleMenuAction(
    BuildContext context,
    String action,
    Book book,
  ) {
    switch (action) {
      case 'download':
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Downloading "${book.title}"...'),
            duration: const Duration(seconds: 2),
          ),
        );
        // TODO: Implement download functionality
        break;
      case 'mark_read':
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Marked "${book.title}" as read'),
            duration: const Duration(seconds: 2),
          ),
        );
        // TODO: Implement mark as read functionality
        break;
      case 'add_collection':
        showDialog(
          context: context,
          builder: (context) =>
              AddToCollectionDialog(bookId: book.id, bookTitle: book.title),
        );
        break;
      case 'delete':
        _showDeleteConfirmation(context, book);
        break;
    }
  }

  static void _showDeleteConfirmation(BuildContext context, Book book) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Book'),
        content: Text('Are you sure you want to delete "${book.title}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Deleted "${book.title}"'),
                  duration: const Duration(seconds: 2),
                ),
              );
              // TODO: Implement delete functionality
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }
}
