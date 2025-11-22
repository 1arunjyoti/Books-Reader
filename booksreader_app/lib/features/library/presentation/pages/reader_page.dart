import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';
import 'package:flutter_epub_viewer/flutter_epub_viewer.dart';
import 'package:path_provider/path_provider.dart';
import '../../domain/entities/book.dart';
import '../../domain/entities/bookmark.dart';
import '../providers/bookmark_provider.dart';

class ReaderPage extends ConsumerStatefulWidget {
  final Book book;

  const ReaderPage({super.key, required this.book});

  @override
  ConsumerState<ReaderPage> createState() => _ReaderPageState();
}

class _ReaderPageState extends ConsumerState<ReaderPage> {
  EpubController? _epubController;
  PdfViewerController? _pdfViewerController;
  PdfTextSearchResult? _searchResult;
  String? _localFilePath;
  bool _isLoading = true;
  String? _errorMessage;
  bool _showSearch = false;
  final TextEditingController _searchController = TextEditingController();
  int _currentPage = 1;

  String? _selectedText;
  String? _selectedCfi;

  @override
  void initState() {
    super.initState();
    _pdfViewerController = PdfViewerController();
    _prepareFile();
  }

  Future<void> _prepareFile() async {
    try {
      if (widget.book.assetPath != null) {
        final dir = await getApplicationDocumentsDirectory();
        final fileName = widget.book.assetPath!.split('/').last;
        final file = File('${dir.path}/$fileName');

        if (!await file.exists()) {
          final byteData = await rootBundle.load(widget.book.assetPath!);
          await file.writeAsBytes(byteData.buffer.asUint8List());
        }

        setState(() {
          _localFilePath = file.path;
          if (widget.book.fileType == 'epub') {
            _epubController = EpubController();
          }
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = 'No file path provided';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Error loading file: $e';
        _isLoading = false;
      });
    }
  }

  void _addHighlight() {
    if (_selectedText == null) return;

    if (widget.book.fileType == 'epub' && _selectedCfi != null) {
      _epubController?.addHighlight(cfi: _selectedCfi!, color: Colors.yellow);
    }

    final bookmark = Bookmark(
      bookId: widget.book.id,
      pageNumber: _currentPage,
      type: 'highlight',
      text: _selectedText,
      cfi: _selectedCfi,
      createdAt: DateTime.now(),
    );
    ref.read(bookmarkControllerProvider(widget.book.id)).addBookmark(bookmark);
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text('Highlight saved')));

    if (widget.book.fileType == 'pdf') {
      _pdfViewerController?.clearSelection();
    }

    setState(() {
      _selectedText = null;
      _selectedCfi = null;
    });
  }

  void _performSearch(String query) {
    if (widget.book.fileType == 'pdf') {
      _searchResult = _pdfViewerController?.searchText(query);
      setState(() {});
    }
    // TODO: Implement EPUB search
  }

  void _clearSearch() {
    setState(() {
      _showSearch = false;
      _searchController.clear();
      _searchResult = null;
    });
    _pdfViewerController?.clearSelection();
  }

  Future<void> _addBookmark() async {
    String? cfi;
    if (widget.book.fileType == 'epub') {
      // Using getCurrentLocation based on search results
      final location = await _epubController?.getCurrentLocation();
      cfi = location?.toJson()['cfi'];
    }

    final bookmark = Bookmark(
      bookId: widget.book.id,
      pageNumber: _currentPage,
      type: 'bookmark',
      createdAt: DateTime.now(),
      cfi: cfi,
    );
    ref.read(bookmarkControllerProvider(widget.book.id)).addBookmark(bookmark);
    if (mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Bookmark added')));
    }
  }

  void _deleteBookmark(Bookmark bookmark) {
    ref
        .read(bookmarkControllerProvider(widget.book.id))
        .deleteBookmark(bookmark);
  }

  void _goToBookmark(Bookmark bookmark) {
    if (widget.book.fileType == 'pdf') {
      _pdfViewerController?.jumpToPage(bookmark.pageNumber);
    } else if (widget.book.fileType == 'epub' && bookmark.cfi != null) {
      _epubController?.display(cfi: bookmark.cfi!);
    }
    Navigator.pop(context); // Close drawer
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bookmarksAsync = ref.watch(bookmarkListProvider(widget.book.id));

    return Scaffold(
      appBar: AppBar(
        title: _showSearch
            ? TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: 'Search...',
                  suffixIcon: IconButton(
                    icon: const Icon(Icons.clear),
                    onPressed: _clearSearch,
                  ),
                ),
                onSubmitted: _performSearch,
                autofocus: true,
              )
            : Text(widget.book.title),
        actions: [
          if (!_showSearch) ...[
            if (_selectedText != null)
              IconButton(
                icon: const Icon(Icons.highlight),
                onPressed: _addHighlight,
                tooltip: 'Save Highlight',
              ),
            IconButton(
              icon: const Icon(Icons.search),
              onPressed: () {
                setState(() {
                  _showSearch = true;
                });
              },
            ),
            IconButton(
              icon: const Icon(Icons.bookmark_add),
              onPressed: _addBookmark,
            ),
            Builder(
              builder: (context) => IconButton(
                icon: const Icon(Icons.bookmarks),
                onPressed: () {
                  Scaffold.of(context).openEndDrawer();
                },
              ),
            ),
          ],
          if (_searchResult != null && widget.book.fileType == 'pdf') ...[
            IconButton(
              icon: const Icon(Icons.keyboard_arrow_up),
              onPressed: () {
                _searchResult?.previousInstance();
              },
            ),
            IconButton(
              icon: const Icon(Icons.keyboard_arrow_down),
              onPressed: () {
                _searchResult?.nextInstance();
              },
            ),
          ],
        ],
      ),
      endDrawer: Drawer(
        child: Column(
          children: [
            const DrawerHeader(child: Center(child: Text('Bookmarks'))),
            Expanded(
              child: bookmarksAsync.when(
                data: (bookmarks) {
                  if (bookmarks.isEmpty) {
                    return const Center(child: Text('No bookmarks'));
                  }
                  return ListView.builder(
                    itemCount: bookmarks.length,
                    itemBuilder: (context, index) {
                      final bookmark = bookmarks[index];
                      return ListTile(
                        title: Text(
                          bookmark.type == 'highlight'
                              ? 'Highlight'
                              : 'Page ${bookmark.pageNumber}',
                        ),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (bookmark.text != null)
                              Text(
                                bookmark.text!,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontStyle: FontStyle.italic,
                                ),
                              ),
                            Text(bookmark.createdAt.toString()),
                          ],
                        ),
                        onTap: () => _goToBookmark(bookmark),
                        trailing: IconButton(
                          icon: const Icon(Icons.delete),
                          onPressed: () => _deleteBookmark(bookmark),
                        ),
                      );
                    },
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (err, stack) => Center(child: Text('Error: $err')),
              ),
            ),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
          ? Center(child: Text(_errorMessage!))
          : _localFilePath == null
          ? const Center(child: Text('No file available'))
          : widget.book.fileType == 'pdf'
          ? SfPdfViewer.file(
              File(_localFilePath!),
              controller: _pdfViewerController,
              canShowScrollHead: true,
              canShowScrollStatus: true,
              onPageChanged: (PdfPageChangedDetails details) {
                _currentPage = details.newPageNumber;
              },
              onTextSelectionChanged: (PdfTextSelectionChangedDetails details) {
                if (details.selectedText != null &&
                    details.selectedText!.isNotEmpty) {
                  setState(() {
                    _selectedText = details.selectedText;
                  });
                } else {
                  setState(() {
                    _selectedText = null;
                  });
                }
              },
            )
          : widget.book.fileType == 'epub'
          ? EpubViewer(
              epubController: _epubController!,
              epubSource: EpubSource.fromFile(File(_localFilePath!)),
              onTextSelected: (EpubTextSelection selection) {
                setState(() {
                  _selectedText = selection.selectedText;
                  _selectedCfi = selection.selectionCfi;
                });
              },
            )
          : const Center(child: Text('Unsupported file type')),
    );
  }
}
