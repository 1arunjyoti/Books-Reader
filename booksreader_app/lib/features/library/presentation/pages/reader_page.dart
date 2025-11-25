import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';
import 'package:syncfusion_flutter_pdf/pdf.dart';
import 'package:flutter_epub_viewer/flutter_epub_viewer.dart';
import 'package:path_provider/path_provider.dart';
import 'package:dio/dio.dart';
import '../../domain/entities/book.dart';
import '../../domain/entities/bookmark.dart';
import '../../domain/entities/highlight.dart';
import '../providers/bookmark_provider.dart';
import '../providers/highlight_provider.dart';
import '../../../../core/providers/api_client_provider.dart';
import '../../../../core/providers/reading_session_provider.dart';
import '../widgets/reader_side_panel.dart';

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
  Rect? _selectedRect;

  @override
  void initState() {
    super.initState();
    _pdfViewerController = PdfViewerController();
    _prepareFile();

    // Start reading session
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final tracker = ref.read(readingSessionTrackerProvider);
      tracker.startSession(widget.book, _currentPage);
    });
  }

  Future<void> _prepareFile() async {
    try {
      if (widget.book.assetPath != null) {
        final dir = await getApplicationDocumentsDirectory();
        final originalFile = File(
          '${dir.path}/${widget.book.id}_original.${widget.book.fileType}',
        );
        final workingFile = File(
          '${dir.path}/${widget.book.id}_view.${widget.book.fileType}',
        );

        if (!await originalFile.exists()) {
          if (widget.book.assetPath!.startsWith('assets/')) {
            // Local asset
            final byteData = await rootBundle.load(widget.book.assetPath!);
            await originalFile.writeAsBytes(byteData.buffer.asUint8List());
          } else {
            // Remote file - download from server
            if (mounted) {
              setState(() {
                _errorMessage = 'Downloading book...';
              });
            }
            final apiClient = ref.read(apiClientProvider);
            final response = await apiClient.get(
              '/books/${widget.book.id}/presigned-url',
              queryParameters: {'expiresIn': '3600'},
            );
            final presignedUrl = response.data['presignedUrl'] as String?;
            if (presignedUrl == null) {
              throw Exception('Failed to get download URL');
            }
            final dio = Dio();
            await dio.download(
              presignedUrl,
              originalFile.path,
              onReceiveProgress: (received, total) {
                if (total != -1) {
                  final progress = (received / total * 100).toStringAsFixed(0);
                  if (mounted) {
                    setState(() {
                      _errorMessage = 'Downloading: $progress%';
                    });
                  }
                }
              },
            );
          }
        }

        // Apply highlights to PDF if it's a PDF
        if (widget.book.fileType == 'pdf') {
          await originalFile.copy(workingFile.path);
          try {
            final highlights = await ref.read(
              highlightListProvider(widget.book.id).future,
            );
            if (highlights.isNotEmpty) {
              final document = PdfDocument(
                inputBytes: workingFile.readAsBytesSync(),
              );
              bool modified = false;
              for (final highlight in highlights) {
                if (highlight.rects != null && highlight.pageNumber != null) {
                  final pageIndex = highlight.pageNumber! - 1;
                  if (pageIndex >= 0 && pageIndex < document.pages.count) {
                    final page = document.pages[pageIndex];
                    for (final rectData in highlight.rects!) {
                      final rect = Rect.fromLTWH(
                        (rectData['x'] as num?)?.toDouble() ?? 0.0,
                        (rectData['y'] as num?)?.toDouble() ?? 0.0,
                        (rectData['width'] as num?)?.toDouble() ?? 0.0,
                        (rectData['height'] as num?)?.toDouble() ?? 0.0,
                      );
                      final color = _getColorFromHex(highlight.hex);
                      final annotation = PdfTextMarkupAnnotation(
                        rect,
                        highlight.text,
                        PdfColor(
                          (color.r * 255.0).round().clamp(0, 255),
                          (color.g * 255.0).round().clamp(0, 255),
                          (color.b * 255.0).round().clamp(0, 255),
                        ),
                      );
                      annotation.textMarkupAnnotationType =
                          PdfTextMarkupAnnotationType.highlight;
                      page.annotations.add(annotation);
                      modified = true;
                    }
                  }
                }
              }
              if (modified) {
                workingFile.writeAsBytesSync(await document.save());
              }
              document.dispose();
            }
            _localFilePath = workingFile.path;
          } catch (e) {
            if (kDebugMode) {
              print('Error applying highlights to PDF: $e');
            }
            _localFilePath = originalFile.path; // Fallback
          }
        } else {
          _localFilePath = originalFile.path;
        }

        if (mounted) {
          setState(() {
            if (widget.book.fileType == 'epub') {
              _epubController = EpubController();
            }
            _isLoading = false;
            _errorMessage = null;
          });
        }
      } else {
        if (mounted) {
          setState(() {
            _errorMessage = 'No file path provided';
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Error loading file: $e';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _addHighlight() async {
    if (_selectedText == null) return;

    if (widget.book.fileType == 'epub' && _selectedCfi != null) {
      _epubController?.addHighlight(cfi: _selectedCfi!, color: Colors.yellow);
    }

    // TODO: Get color from UI picker
    const color = 'yellow';
    const hex = '#FFFF00';

    final highlight = Highlight(
      id: '', // Generated by server
      bookId: widget.book.id,
      userId: '', // Handled by server/repo
      text: _selectedText!,
      cfiRange: _selectedCfi,
      color: color,
      hex: hex,
      createdAt: DateTime.now(),
      pageNumber: widget.book.fileType == 'pdf' ? _currentPage : null,
      source: widget.book.fileType == 'epub' ? 'EPUB' : 'PDF',
      rects: widget.book.fileType == 'pdf' && _selectedRect != null
          ? [
              {
                'x': _selectedRect!.left,
                'y': _selectedRect!.top,
                'width': _selectedRect!.width,
                'height': _selectedRect!.height,
              },
            ]
          : [],
    );

    try {
      await ref
          .read(highlightControllerProvider(widget.book.id))
          .addHighlight(highlight);

      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Highlight saved')));
      }

      if (widget.book.fileType == 'pdf') {
        _pdfViewerController?.clearSelection();
      }

      setState(() {
        _selectedText = null;
        _selectedCfi = null;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error saving highlight: $e')));
      }
    }
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
    final bookmark = Bookmark(
      id: '', // Generated by server
      bookId: widget.book.id,
      userId: '', // Handled by server/repo
      pageNumber: _currentPage,
      createdAt: DateTime.now(),
      note: '', // Optional note
    );

    await ref
        .read(bookmarkControllerProvider(widget.book.id))
        .addBookmark(bookmark);

    if (mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Bookmark added')));
    }
  }

  void _goToBookmark(Bookmark bookmark) {
    if (widget.book.fileType == 'pdf') {
      _pdfViewerController?.jumpToPage(bookmark.pageNumber);
    } else if (widget.book.fileType == 'epub') {
      // For EPUB, bookmarks are currently just page numbers/locations.
      // If we had CFI for bookmarks, we'd use it.
      // _epubController?.display(cfi: bookmark.cfi!);
    }
    Navigator.pop(context); // Close drawer
  }

  void _goToHighlight(Highlight highlight) {
    if (widget.book.fileType == 'pdf' && highlight.pageNumber != null) {
      _pdfViewerController?.jumpToPage(highlight.pageNumber!);
    } else if (widget.book.fileType == 'epub' && highlight.cfiRange != null) {
      _epubController?.display(cfi: highlight.cfiRange!);
    }
    Navigator.pop(context); // Close drawer
  }

  @override
  void dispose() {
    // End reading session
    // Note: We cannot use ref.read() here as the widget might be unmounted.
    // Ideally, we should handle session ending in a provider's onDispose or similar,
    // or ensure we have a reference to the tracker before dispose if possible.
    // However, since we can't safely use ref here, we'll rely on the provider's
    // own lifecycle or a different mechanism if needed.
    // For now, we'll skip the explicit endSession call here to avoid the crash,
    // assuming the session might be handled by a timeout or app lifecycle.
    // Alternatively, we could capture the tracker in initState, but that's also risky if the provider changes.

    // A better approach for Riverpod is to use a provider that manages the session state
    // and implements the disposal logic itself when the provider is disposed.

    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(highlightListProvider(widget.book.id), (previous, next) {
      next.whenData((_) => _renderHighlights());
    });

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
      endDrawer: ReaderSidePanel(
        book: widget.book,
        onBookmarkSelected: _goToBookmark,
        onHighlightSelected: _goToHighlight,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      _errorMessage!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.red),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: () {
                        setState(() {
                          _isLoading = true;
                          _errorMessage = null;
                        });
                        _prepareFile();
                      },
                      icon: const Icon(Icons.refresh),
                      label: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            )
          : _localFilePath == null
          ? const Center(child: Text('No file available'))
          : widget.book.fileType == 'pdf'
          ? SfPdfViewer.file(
              File(_localFilePath!),
              controller: _pdfViewerController,
              canShowScrollHead: true,
              canShowScrollStatus: true,
              onPageChanged: (PdfPageChangedDetails details) {
                setState(() {
                  _currentPage = details.newPageNumber;
                });
              },
              onTextSelectionChanged: (PdfTextSelectionChangedDetails details) {
                if (details.selectedText != null &&
                    details.selectedText!.isNotEmpty) {
                  setState(() {
                    _selectedText = details.selectedText;
                    _selectedRect = details.globalSelectedRegion;
                  });
                } else {
                  setState(() {
                    _selectedText = null;
                    _selectedRect = null;
                  });
                }
              },
              onDocumentLoaded: (PdfDocumentLoadedDetails details) {
                _renderHighlights();
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

  Future<void> _renderHighlights() async {
    if (widget.book.fileType == 'epub' && _epubController != null) {
      try {
        final highlights = await ref.read(
          highlightListProvider(widget.book.id).future,
        );
        for (final highlight in highlights) {
          if (highlight.cfiRange != null) {
            _epubController?.addHighlight(
              cfi: highlight.cfiRange!,
              color: _getColorFromHex(highlight.hex),
            );
          }
        }
      } catch (e) {
        if (kDebugMode) {
          print('Error rendering EPUB highlights: $e');
        }
      }
    }
  }

  Color _getColorFromHex(String hexColor) {
    hexColor = hexColor.toUpperCase().replaceAll('#', '');
    if (hexColor.length == 6) {
      hexColor = 'FF$hexColor';
    }
    return Color(int.parse(hexColor, radix: 16));
  }
}
