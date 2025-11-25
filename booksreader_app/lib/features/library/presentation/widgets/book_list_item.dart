import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../domain/entities/book.dart';
import 'add_to_collection_dialog.dart';

class BookListItem extends StatelessWidget {
  final Book book;

  const BookListItem({super.key, required this.book});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 100,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Color.fromRGBO(0, 0, 0, 0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Row(
        children: [
          AspectRatio(
            aspectRatio: 0.7,
            child: CachedNetworkImage(
              imageUrl: book.coverUrl ?? '',
              fit: BoxFit.cover,
              memCacheWidth: 200,
              memCacheHeight: 300,
              maxWidthDiskCache: 400,
              maxHeightDiskCache: 600,
              placeholder: (context, url) => Container(
                color: Colors.grey[200],
                child: const Center(
                  child: Icon(Icons.image, color: Colors.grey),
                ),
              ),
              errorWidget: (context, url, error) => Container(
                color: Colors.grey[200],
                child: const Center(
                  child: Icon(Icons.book, size: 30, color: Colors.grey),
                ),
              ),
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(12.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    book.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    book.author,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: Colors.grey[600], fontSize: 14),
                  ),
                  const SizedBox(height: 8),
                  if (book.status == BookStatus.reading)
                    LinearProgressIndicator(
                      value: book.progress,
                      backgroundColor: Colors.grey[200],
                      valueColor: const AlwaysStoppedAnimation<Color>(
                        Colors.blue,
                      ),
                      minHeight: 4,
                      borderRadius: BorderRadius.circular(2),
                    ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert, size: 20),
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
                      const Text(
                        'Download',
                        style: TextStyle(fontSize: 14),
                      ),
                    ],
                  ),
                ),
                PopupMenuItem(
                  value: 'mark_read',
                  child: Row(
                    children: [
                      const Icon(
                        Icons.check_circle_outline,
                        size: 20,
                        color: Colors.green,
                      ),
                      const SizedBox(width: 12),
                      const Text(
                        'Mark as Read',
                        style: TextStyle(fontSize: 14),
                      ),
                    ],
                  ),
                ),
                PopupMenuItem(
                  value: 'add_collection',
                  child: Row(
                    children: [
                      const Icon(
                        Icons.bookmark_add_outlined,
                        size: 20,
                        color: Colors.amber,
                      ),
                      const SizedBox(width: 12),
                      const Text(
                        'Add to Collection',
                        style: TextStyle(fontSize: 14),
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
                      const Text(
                        'Delete',
                        style: TextStyle(fontSize: 14, color: Colors.red),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
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
