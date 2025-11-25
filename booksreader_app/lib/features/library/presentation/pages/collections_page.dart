import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../domain/entities/collection.dart';
import '../providers/collections_provider.dart';
import '../../../profile/presentation/widgets/app_drawer.dart';

class CollectionsPage extends ConsumerStatefulWidget {
  const CollectionsPage({super.key});

  @override
  ConsumerState<CollectionsPage> createState() => _CollectionsPageState();
}

class _CollectionsPageState extends ConsumerState<CollectionsPage> {
  final TextEditingController _newCollectionController =
      TextEditingController();

  @override
  void dispose() {
    _newCollectionController.dispose();
    super.dispose();
  }

  void _showCreateCollectionDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(
              Icons.create_new_folder,
              color: Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(width: 12),
            Text(
              'New Collection',
              style: GoogleFonts.poppins(
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
        content: TextField(
          controller: _newCollectionController,
          autofocus: true,
          decoration: InputDecoration(
            labelText: 'Collection Name',
            hintText: 'Enter collection name',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            prefixIcon: const Icon(Icons.drive_file_rename_outline),
          ),
          textCapitalization: TextCapitalization.words,
          onSubmitted: (_) => _createCollection(),
        ),
        actions: [
          TextButton(
            onPressed: () {
              _newCollectionController.clear();
              Navigator.pop(context);
            },
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: _createCollection,
            style: ElevatedButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.primary,
              foregroundColor: Colors.white,
            ),
            child: Text(
              'Create',
              style: GoogleFonts.inter(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _createCollection() async {
    final name = _newCollectionController.text.trim();
    if (name.isEmpty) {
      _showMessage('Please enter a collection name', isError: true);
      return;
    }

    final notifier = ref.read(collectionsProvider.notifier);
    final collection = await notifier.createCollection(name: name);

    if (collection != null) {
      _newCollectionController.clear();
      if (mounted) {
        Navigator.pop(context);
        _showMessage('Collection "$name" created successfully');
      }
    } else {
      _showMessage('Failed to create collection', isError: true);
    }
  }

  Future<void> _deleteCollection(Collection collection) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(
          'Delete Collection',
          style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
        ),
        content: Text(
          'Are you sure you want to delete "${collection.name}"? This action cannot be undone.',
          style: GoogleFonts.inter(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final notifier = ref.read(collectionsProvider.notifier);
      final success = await notifier.deleteCollection(collection.id);

      if (success) {
        _showMessage('Collection deleted successfully');
      } else {
        _showMessage('Failed to delete collection', isError: true);
      }
    }
  }

  void _showMessage(String message, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red : null,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final collectionsState = ref.watch(collectionsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'My Collections',
          style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
        ),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: _showCreateCollectionDialog,
            tooltip: 'Create Collection',
          ),
        ],
      ),
      drawer: const AppDrawer(),
      body: collectionsState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : collectionsState.error != null
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 64, color: Colors.red[400]),
                  const SizedBox(height: 16),
                  Text(
                    'Error loading collections',
                    style: GoogleFonts.inter(
                      fontSize: 18,
                      color: Colors.red[600],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    collectionsState.error!,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: Colors.grey[600],
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: () {
                      ref.read(collectionsProvider.notifier).loadCollections();
                    },
                    icon: const Icon(Icons.refresh),
                    label: const Text('Retry'),
                  ),
                ],
              ),
            )
          : collectionsState.collections.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.folder_off_outlined,
                    size: 80,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'No Collections Yet',
                    style: GoogleFonts.poppins(
                      fontSize: 24,
                      fontWeight: FontWeight.w600,
                      color: Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Create your first collection to organize your books',
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      color: Colors.grey[500],
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 32),
                  ElevatedButton.icon(
                    onPressed: _showCreateCollectionDialog,
                    icon: const Icon(Icons.add),
                    label: const Text('Create Collection'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Theme.of(context).colorScheme.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24,
                        vertical: 16,
                      ),
                    ),
                  ),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: () async {
                await ref.read(collectionsProvider.notifier).loadCollections();
              },
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: collectionsState.collections.length,
                itemBuilder: (context, index) {
                  final collection = collectionsState.collections[index];
                  return _CollectionCard(
                    collection: collection,
                    onDelete: collection.isDefault
                        ? null
                        : () => _deleteCollection(collection),
                  );
                },
              ),
            ),
    );
  }
}

class _CollectionCard extends StatelessWidget {
  final Collection collection;
  final VoidCallback? onDelete;

  const _CollectionCard({required this.collection, this.onDelete});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () {
          // TODO: Navigate to collection detail page
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Opening collection: ${collection.name}'),
              duration: const Duration(seconds: 1),
            ),
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: _parseColor(
                        collection.color,
                      ).withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      _parseIcon(collection.icon),
                      color: _parseColor(collection.color),
                      size: 28,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                collection.name,
                                style: GoogleFonts.poppins(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w600,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (collection.isDefault)
                              Container(
                                margin: const EdgeInsets.only(left: 8),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: Theme.of(
                                    context,
                                  ).colorScheme.primary.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  'DEFAULT',
                                  style: GoogleFonts.inter(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w600,
                                    color: Theme.of(
                                      context,
                                    ).colorScheme.primary,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${collection.bookCount} ${collection.bookCount == 1 ? 'book' : 'books'}',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (onDelete != null) ...[
                    const SizedBox(width: 8),
                    IconButton(
                      icon: const Icon(Icons.delete_outline),
                      color: Colors.red,
                      onPressed: onDelete,
                      tooltip: 'Delete Collection',
                    ),
                  ],
                ],
              ),
              if (collection.description != null &&
                  collection.description!.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(
                  collection.description!,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    color: Colors.grey[700],
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Color _parseColor(String colorString) {
    try {
      if (colorString.startsWith('#')) {
        return Color(
          int.parse(colorString.substring(1), radix: 16) + 0xFF000000,
        );
      }
      return Colors.blue;
    } catch (e) {
      return Colors.blue;
    }
  }

  IconData _parseIcon(String iconString) {
    switch (iconString.toLowerCase()) {
      case 'favorite':
      case 'heart':
        return Icons.favorite;
      case 'star':
        return Icons.star;
      case 'bookmark':
        return Icons.bookmark;
      case 'folder':
      default:
        return Icons.folder;
    }
  }
}
