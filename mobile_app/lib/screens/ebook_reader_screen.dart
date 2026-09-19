import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/realtime_sync_service.dart';
import '../services/local_cache_service.dart';
import '../models/sync_queue.dart';

/// Offline-enabled E-book Reader Screen
/// Features: Reading, bookmarks, highlights, offline sync
class EbookReaderScreen extends StatefulWidget {
  final EbookModel ebook;

  const EbookReaderScreen({Key? key, required this.ebook}) : super(key: key);

  @override
  State<EbookReaderScreen> createState() => _EbookReaderScreenState();
}

class _EbookReaderScreenState extends State<EbookReaderScreen> {
  late LocalCacheService _cacheService;
  late RealtimeSyncService _syncService;

  int _currentPage = 1;
  int _totalPages = 0;
  String _currentContent = '';
  double _fontSize = 16.0;
  double _lineHeight = 1.6;
  bool _showControls = true;
  Set<int> _bookmarkedPages = {};
  List<String> _highlights = [];

  @override
  void initState() {
    super.initState();
    _cacheService = LocalCacheService();
    _loadEbookContent();
  }

  Future<void> _loadEbookContent() async {
    await _cacheService.initialize();

    // Try to load from cache first
    final progress = _cacheService.getReadingProgress(widget.ebook.id);
    if (progress != null) {
      _currentPage = progress['currentPage'] as int;
      _totalPages = progress['totalPages'] as int;
    } else {
      _totalPages = widget.ebook.pageCount;
      await _cacheService.saveReadingProgress(
        ebookId: widget.ebook.id,
        currentPage: 1,
        totalPages: _totalPages,
        timeSpent: Duration.zero,
      );
    }

    _loadPageContent(_currentPage);

    // Load preferences
    final prefs = _cacheService.getReadingPreferences();
    setState(() {
      _fontSize = (prefs['fontSize'] as int).toDouble();
      _lineHeight = prefs['lineHeight'] as double;
    });
  }

  Future<void> _loadPageContent(int pageNumber) async {
    // Try cache first
    var page = _cacheService.getCachedEbookPage(widget.ebook.id, pageNumber);

    if (page == null) {
      // Simulate loading from Firestore/network
      page = EbookPageContent(
        ebookId: widget.ebook.id,
        pageNumber: pageNumber,
        content: _generateSampleContent(pageNumber),
        imageUrl: null,
        cachedAt: DateTime.now(),
      );
      // Cache for offline use
      await _cacheService.cacheEbookPage(page);
    }

    setState(() {
      _currentContent = page!.content;
      _currentPage = pageNumber;
    });

    // Save progress
    await _cacheService.saveReadingProgress(
      ebookId: widget.ebook.id,
      currentPage: _currentPage,
      totalPages: _totalPages,
      timeSpent: Duration.zero,
    );
  }

  String _generateSampleContent(int pageNumber) {
    return '''
Chapter ${(pageNumber ~/ 5) + 1}

This is page $pageNumber of the ebook "${widget.ebook.title}" by ${widget.ebook.author}.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

Vocabulary highlighted on this page:
- word: ${'palavra${pageNumber % 10}'}
- pronunciation: /prə'nʌnsiˌeɪʃən/
- definition: The way a word is pronounced

Practice these words offline and sync when connected!
''';
  }

  void _toggleBookmark() {
    setState(() {
      if (_bookmarkedPages.contains(_currentPage)) {
        _bookmarkedPages.remove(_currentPage);
      } else {
        _bookmarkedPages.add(_currentPage);
      }
    });
  }

  void _addHighlight(String text) {
    setState(() {
      _highlights.add(text);
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Texto destacado adicionado')),
    );
  }

  void _previousPage() {
    if (_currentPage > 1) {
      _loadPageContent(_currentPage - 1);
    }
  }

  void _nextPage() {
    if (_currentPage < _totalPages) {
      _loadPageContent(_currentPage + 1);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.ebook.title),
        actions: [
          IconButton(
            icon: Icon(
              _bookmarkedPages.contains(_currentPage)
                  ? Icons.bookmark
                  : Icons.bookmark_border,
            ),
            onPressed: _toggleBookmark,
          ),
          IconButton(
            icon: const Icon(Icons.share),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Partilhar página')),
              );
            },
          ),
        ],
      ),
      body: GestureDetector(
        onTap: () {
          setState(() {
            _showControls = !_showControls;
          });
        },
        child: Column(
          children: [
            // Reading content area
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Cover image placeholder
                    Container(
                      height: 200,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Center(
                        child: Text(
                          widget.ebook.title,
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    // Page content
                    Text(
                      _currentContent,
                      style: TextStyle(
                        fontSize: _fontSize,
                        height: _lineHeight,
                        color: Colors.grey[800],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            // Bottom controls
            if (_showControls)
              Container(
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  border: Border(
                    top: BorderSide(color: Colors.grey[300]!),
                  ),
                ),
                padding: const EdgeInsets.all(16),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Font size slider
                    Row(
                      children: [
                        const Icon(Icons.text_fields, size: 18),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Slider(
                            value: _fontSize,
                            min: 12,
                            max: 24,
                            onChanged: (value) {
                              setState(() {
                                _fontSize = value;
                              });
                            },
                          ),
                        ),
                        Text('${_fontSize.toInt()}px'),
                      ],
                    ),
                    const SizedBox(height: 16),
                    // Line height slider
                    Row(
                      children: [
                        const Icon(Icons.format_line_spacing, size: 18),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Slider(
                            value: _lineHeight,
                            min: 1.0,
                            max: 2.5,
                            divisions: 15,
                            onChanged: (value) {
                              setState(() {
                                _lineHeight = value;
                              });
                            },
                          ),
                        ),
                        Text('${_lineHeight.toStringAsFixed(1)}'),
                      ],
                    ),
                    const SizedBox(height: 16),
                    // Page navigation
                    Row(
                      children: [
                        ElevatedButton.icon(
                          icon: const Icon(Icons.chevron_left),
                          label: const Text('Anterior'),
                          onPressed: _currentPage > 1 ? _previousPage : null,
                        ),
                        const Spacer(),
                        Text(
                          'Página $_currentPage / $_totalPages',
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                        const Spacer(),
                        ElevatedButton.icon(
                          icon: const Icon(Icons.chevron_right),
                          label: const Text('Próxima'),
                          onPressed:
                              _currentPage < _totalPages ? _nextPage : null,
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    // Progress bar
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: _currentPage / _totalPages,
                        minHeight: 6,
                      ),
                    ),
                    const SizedBox(height: 12),
                    // Highlights count
                    Row(
                      children: [
                        Icon(Icons.highlight, size: 18, color: Colors.orange),
                        const SizedBox(width: 8),
                        Text('${_highlights.length} destaques'),
                        const Spacer(),
                        if (_bookmarkedPages.isNotEmpty)
                          Text('${_bookmarkedPages.length} marcadores'),
                      ],
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
