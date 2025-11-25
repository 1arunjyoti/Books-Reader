import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/collections_provider.dart';

class AddToCollectionDialog extends ConsumerStatefulWidget {
  final String bookId;
  final String bookTitle;

  const AddToCollectionDialog({
    super.key,
    required this.bookId,
    required this.bookTitle,
  });

  @override
  ConsumerState<AddToCollectionDialog> createState() =>
      _AddToCollectionDialogState();
}

class _AddToCollectionDialogState extends ConsumerState<AddToCollectionDialog> {
  final TextEditingController _newCollectionController =
      TextEditingController();
  bool _isCreatingNew = false;
  String? _selectedCollectionId;
  bool _isProcessing = false;

  @override
  void dispose() {
    _newCollectionController.dispose();
    super.dispose();
  }

  Future<void> _handleAddToCollection() async {
    if (_isProcessing) return;

    setState(() {
      _isProcessing = true;
    });

    try {
      final notifier = ref.read(collectionsProvider.notifier);

      if (_isCreatingNew) {
        final newCollectionName = _newCollectionController.text.trim();
        if (newCollectionName.isEmpty) {
          _showMessage('Please enter a collection name', isError: true);
          return;
        }

        // Create collection and add book
        final collection = await notifier.createCollection(
          name: newCollectionName,
        );

        if (collection != null) {
          // Add book to the new collection
          final success = await notifier.addBooksToCollection(collection.id, [
            widget.bookId,
          ]);

          if (success) {
            if (mounted) {
              Navigator.pop(context);
              _showMessage(
                'Created "$newCollectionName" and added "${widget.bookTitle}"',
              );
            }
          } else {
            _showMessage('Failed to add book to collection', isError: true);
          }
        } else {
          _showMessage('Failed to create collection', isError: true);
        }
      } else {
        if (_selectedCollectionId == null) {
          _showMessage('Please select a collection', isError: true);
          return;
        }

        // Add book to existing collection
        final success = await notifier.addBooksToCollection(
          _selectedCollectionId!,
          [widget.bookId],
        );

        if (success) {
          final collectionsState = ref.read(collectionsProvider);
          final selectedCollection = collectionsState.collections.firstWhere(
            (c) => c.id == _selectedCollectionId,
          );

          if (mounted) {
            Navigator.pop(context);
            _showMessage(
              'Added "${widget.bookTitle}" to "${selectedCollection.name}"',
            );
          }
        } else {
          _showMessage('Failed to add book to collection', isError: true);
        }
      }
    } catch (e) {
      _showMessage('Error: ${e.toString()}', isError: true);
    } finally {
      if (mounted) {
        setState(() {
          _isProcessing = false;
        });
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

    return AlertDialog(
      title: Row(
        children: [
          Icon(
            Icons.bookmark_add_outlined,
            color: Theme.of(context).colorScheme.primary,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'Add to Collection',
              style: GoogleFonts.poppins(
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
      content: SizedBox(
        width: MediaQuery.of(context).size.width * 0.8,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.bookTitle,
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: Theme.of(context).textTheme.bodyMedium?.color,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 20),

            // Toggle between existing collections and create new
            SegmentedButton<bool>(
              segments: const [
                ButtonSegment(
                  value: false,
                  label: Text('Existing'),
                  icon: Icon(Icons.folder_outlined, size: 18),
                ),
                ButtonSegment(
                  value: true,
                  label: Text('New'),
                  icon: Icon(Icons.add, size: 18),
                ),
              ],
              selected: {_isCreatingNew},
              onSelectionChanged: (Set<bool> newSelection) {
                setState(() {
                  _isCreatingNew = newSelection.first;
                  _selectedCollectionId = null;
                });
              },
              style: ButtonStyle(
                padding: WidgetStateProperty.all(
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                ),
              ),
            ),

            const SizedBox(height: 20),

            // Content area
            if (_isCreatingNew)
              // Create new collection
              TextField(
                controller: _newCollectionController,
                autofocus: true,
                decoration: InputDecoration(
                  labelText: 'Collection Name',
                  hintText: 'Enter collection name',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  prefixIcon: const Icon(Icons.drive_file_rename_outline),
                ),
                textCapitalization: TextCapitalization.words,
                onSubmitted: (_) => _handleAddToCollection(),
                enabled: !_isProcessing,
              )
            else
              // Select from existing collections
              Container(
                constraints: const BoxConstraints(maxHeight: 250),
                child: collectionsState.isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : collectionsState.error != null
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.error_outline,
                              size: 48,
                              color: Colors.red[400],
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'Error loading collections',
                              style: GoogleFonts.inter(color: Colors.red[600]),
                            ),
                            const SizedBox(height: 8),
                            TextButton(
                              onPressed: () {
                                ref
                                    .read(collectionsProvider.notifier)
                                    .loadCollections();
                              },
                              child: const Text('Retry'),
                            ),
                          ],
                        ),
                      )
                    : collectionsState.collections.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.folder_off_outlined,
                              size: 48,
                              color: Colors.grey[400],
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'No collections yet',
                              style: GoogleFonts.inter(color: Colors.grey[600]),
                            ),
                            const SizedBox(height: 8),
                            TextButton(
                              onPressed: () {
                                setState(() {
                                  _isCreatingNew = true;
                                });
                              },
                              child: const Text('Create your first collection'),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        shrinkWrap: true,
                        itemCount: collectionsState.collections.length,
                        itemBuilder: (context, index) {
                          final collection =
                              collectionsState.collections[index];
                          final isSelected =
                              _selectedCollectionId == collection.id;

                          return Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? Theme.of(
                                      context,
                                    ).colorScheme.primaryContainer
                                  : Theme.of(context).cardColor,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: isSelected
                                    ? Theme.of(context).colorScheme.primary
                                    : Theme.of(context).dividerColor,
                                width: isSelected ? 2 : 1,
                              ),
                            ),
                            child: ListTile(
                              onTap: _isProcessing
                                  ? null
                                  : () {
                                      setState(() {
                                        _selectedCollectionId = collection.id;
                                      });
                                    },
                              leading: Icon(
                                Icons.folder_outlined,
                                color: isSelected
                                    ? Theme.of(context).colorScheme.primary
                                    : Theme.of(context).iconTheme.color,
                              ),
                              title: Text(
                                collection.name,
                                style: GoogleFonts.inter(
                                  fontWeight: isSelected
                                      ? FontWeight.w600
                                      : FontWeight.w500,
                                  color: isSelected
                                      ? Theme.of(context).colorScheme.primary
                                      : Theme.of(
                                          context,
                                        ).textTheme.bodyMedium?.color,
                                ),
                              ),
                              subtitle: Text(
                                '${collection.bookCount} books',
                                style: GoogleFonts.inter(fontSize: 12),
                              ),
                              trailing: isSelected
                                  ? Icon(
                                      Icons.check_circle,
                                      color: Theme.of(
                                        context,
                                      ).colorScheme.primary,
                                    )
                                  : null,
                            ),
                          );
                        },
                      ),
              ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: _isProcessing ? null : () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: _isProcessing ? null : _handleAddToCollection,
          style: ElevatedButton.styleFrom(
            backgroundColor: Theme.of(context).colorScheme.primary,
            foregroundColor: Colors.white,
          ),
          child: _isProcessing
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                )
              : Text(
                  _isCreatingNew ? 'Create & Add' : 'Add',
                  style: GoogleFonts.inter(fontWeight: FontWeight.w600),
                ),
        ),
      ],
    );
  }
}
