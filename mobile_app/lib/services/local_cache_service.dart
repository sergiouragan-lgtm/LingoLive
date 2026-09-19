import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../models/sync_queue.dart';

/// Local cache service for offline-first data persistence
/// Uses SharedPreferences for lightweight caching
/// Equivalent to SQLite cache on web
class LocalCacheService {
  static final LocalCacheService _instance = LocalCacheService._internal();
  late SharedPreferences _prefs;
  bool _initialized = false;

  LocalCacheService._internal();

  factory LocalCacheService() {
    return _instance;
  }

  /// Initialize the cache service
  Future<void> initialize() async {
    if (!_initialized) {
      _prefs = await SharedPreferences.getInstance();
      _initialized = true;
    }
  }

  // ============ Ebook Caching ============

  /// Cache ebook metadata
  Future<void> cacheEbook(EbookModel ebook) async {
    final key = 'ebook_${ebook.id}';
    await _prefs.setString(key, jsonEncode(ebook.toMap()));
  }

  /// Get cached ebook metadata
  EbookModel? getCachedEbook(String ebookId) {
    final key = 'ebook_$ebookId';
    final data = _prefs.getString(key);
    if (data == null) return null;
    return EbookModel.fromMap(jsonDecode(data));
  }

  /// Cache list of ebooks
  Future<void> cacheEbooks(List<EbookModel> ebooks) async {
    final data = ebooks.map((e) => e.toMap()).toList();
    await _prefs.setString('ebook_list', jsonEncode(data));
  }

  /// Get cached ebook list
  List<EbookModel> getCachedEbooks() {
    final data = _prefs.getString('ebook_list');
    if (data == null) return [];
    final list = jsonDecode(data) as List;
    return list.map((item) => EbookModel.fromMap(item)).toList();
  }

  /// Cache ebook page content
  Future<void> cacheEbookPage(EbookPageContent page) async {
    final key = 'ebook_page_${page.ebookId}_${page.pageNumber}';
    await _prefs.setString(key, jsonEncode(page.toMap()));
  }

  /// Get cached ebook page
  EbookPageContent? getCachedEbookPage(String ebookId, int pageNumber) {
    final key = 'ebook_page_${ebookId}_$pageNumber';
    final data = _prefs.getString(key);
    if (data == null) return null;
    return EbookPageContent.fromMap(jsonDecode(data));
  }

  /// Cache all pages for an ebook
  Future<void> cacheEbookPages(String ebookId, List<EbookPageContent> pages) async {
    final data = pages.map((p) => p.toMap()).toList();
    await _prefs.setString('ebook_pages_$ebookId', jsonEncode(data));
  }

  /// Get all cached pages for an ebook
  List<EbookPageContent> getCachedEbookPages(String ebookId) {
    final data = _prefs.getString('ebook_pages_$ebookId');
    if (data == null) return [];
    final list = jsonDecode(data) as List;
    return list.map((item) => EbookPageContent.fromMap(item)).toList();
  }

  /// Store reading session progress
  Future<void> saveReadingProgress({
    required String ebookId,
    required int currentPage,
    required int totalPages,
    required Duration timeSpent,
  }) async {
    final key = 'reading_progress_$ebookId';
    final data = {
      'currentPage': currentPage,
      'totalPages': totalPages,
      'timeSpent': timeSpent.inSeconds,
      'lastUpdated': DateTime.now().toIso8601String(),
    };
    await _prefs.setString(key, jsonEncode(data));
  }

  /// Get reading progress
  Map<String, dynamic>? getReadingProgress(String ebookId) {
    final key = 'reading_progress_$ebookId';
    final data = _prefs.getString(key);
    if (data == null) return null;
    return jsonDecode(data);
  }

  // ============ Vocabulary Caching ============

  /// Cache vocabulary words
  Future<void> cacheVocabularyWord(VocabularyWord word) async {
    final key = 'vocab_${word.id}';
    await _prefs.setString(key, jsonEncode(word.toMap()));
  }

  /// Get cached vocabulary word
  VocabularyWord? getCachedVocabularyWord(String wordId) {
    final key = 'vocab_$wordId';
    final data = _prefs.getString(key);
    if (data == null) return null;
    return VocabularyWord.fromMap(jsonDecode(data));
  }

  /// Cache list of vocabulary words
  Future<void> cacheVocabularyWords(List<VocabularyWord> words) async {
    final data = words.map((w) => w.toMap()).toList();
    await _prefs.setString('vocab_list', jsonEncode(data));
  }

  /// Get cached vocabulary list
  List<VocabularyWord> getCachedVocabularyWords() {
    final data = _prefs.getString('vocab_list');
    if (data == null) return [];
    final list = jsonDecode(data) as List;
    return list.map((item) => VocabularyWord.fromMap(item)).toList();
  }

  /// Update vocabulary word learning status
  Future<void> updateVocabularyWordStatus({
    required String wordId,
    required bool isLearned,
    required int practiceCount,
  }) async {
    final word = getCachedVocabularyWord(wordId);
    if (word != null) {
      final updated = VocabularyWord(
        id: word.id,
        word: word.word,
        pronunciation: word.pronunciation,
        definition: word.definition,
        exampleSentence: word.exampleSentence,
        language: word.language,
        level: word.level,
        relatedWords: word.relatedWords,
        isLearned: isLearned,
        practiceCount: practiceCount,
        lastPracticed: DateTime.now(),
      );
      await cacheVocabularyWord(updated);
    }
  }

  // ============ Sync Queue Caching ============

  /// Save sync queue items to local cache
  Future<void> saveSyncQueue(List<SyncQueueItem> items) async {
    final data = items.map((item) => item.toMap()).toList();
    await _prefs.setString('sync_queue', jsonEncode(data));
  }

  /// Get sync queue items from local cache
  List<SyncQueueItem> getSyncQueue() {
    final data = _prefs.getString('sync_queue');
    if (data == null) return [];
    final list = jsonDecode(data) as List;
    return list.map((item) => SyncQueueItem.fromMap(item)).toList();
  }

  // ============ User Preferences ============

  /// Save user reading preferences
  Future<void> saveReadingPreferences({
    required int fontSize,
    required double lineHeight,
    required String fontFamily,
  }) async {
    await _prefs.setInt('reading_font_size', fontSize);
    await _prefs.setDouble('reading_line_height', lineHeight);
    await _prefs.setString('reading_font_family', fontFamily);
  }

  /// Get reading preferences with defaults
  Map<String, dynamic> getReadingPreferences() {
    return {
      'fontSize': _prefs.getInt('reading_font_size') ?? 16,
      'lineHeight': _prefs.getDouble('reading_line_height') ?? 1.6,
      'fontFamily': _prefs.getString('reading_font_family') ?? 'Roboto',
    };
  }

  /// Save offline mode preference
  Future<void> setOfflineMode(bool enabled) async {
    await _prefs.setBool('offline_mode', enabled);
  }

  /// Get offline mode status
  bool isOfflineModeEnabled() {
    return _prefs.getBool('offline_mode') ?? false;
  }

  /// Save last sync timestamp
  Future<void> saveLastSyncTime(DateTime time) async {
    await _prefs.setString('last_sync_time', time.toIso8601String());
  }

  /// Get last sync timestamp
  DateTime? getLastSyncTime() {
    final data = _prefs.getString('last_sync_time');
    if (data == null) return null;
    return DateTime.parse(data);
  }

  // ============ Live Classes Caching ============

  /// Cache live class data
  Future<void> cacheLiveClass(LiveClass liveClass) async {
    final key = 'live_class_${liveClass.id}';
    await _prefs.setString(key, jsonEncode(liveClass.toMap()));
  }

  /// Get cached live class
  LiveClass? getCachedLiveClass(String classId) {
    final key = 'live_class_$classId';
    final data = _prefs.getString(key);
    if (data == null) return null;
    return LiveClass.fromMap(jsonDecode(data));
  }

  /// Cache list of upcoming live classes
  Future<void> cacheUpcomingClasses(List<LiveClass> classes) async {
    final data = classes.map((c) => c.toMap()).toList();
    await _prefs.setString('upcoming_classes', jsonEncode(data));
  }

  /// Get cached upcoming classes
  List<LiveClass> getCachedUpcomingClasses() {
    final data = _prefs.getString('upcoming_classes');
    if (data == null) return [];
    final list = jsonDecode(data) as List;
    return list.map((item) => LiveClass.fromMap(item)).toList();
  }

  // ============ Cache Management ============

  /// Get total cache size estimate (in KB)
  int getCacheSizeEstimate() {
    int size = 0;
    for (final key in _prefs.getKeys()) {
      final value = _prefs.get(key);
      if (value is String) {
        size += value.length ~/ 1024;
      }
    }
    return size;
  }

  /// Clear ebook cache (keep user data)
  Future<void> clearEbookCache() async {
    final keys = _prefs.getKeys();
    for (final key in keys) {
      if (key.startsWith('ebook_') || key.startsWith('reading_progress_')) {
        await _prefs.remove(key);
      }
    }
  }

  /// Clear vocabulary cache
  Future<void> clearVocabularyCache() async {
    final keys = _prefs.getKeys();
    for (final key in keys) {
      if (key.startsWith('vocab_')) {
        await _prefs.remove(key);
      }
    }
  }

  /// Clear all cache except user preferences
  Future<void> clearAllCache() async {
    final keys = _prefs.getKeys();
    final prefsToKeep = {
      'reading_font_size',
      'reading_line_height',
      'reading_font_family',
      'offline_mode'
    };
    for (final key in keys) {
      if (!prefsToKeep.contains(key)) {
        await _prefs.remove(key);
      }
    }
  }
}
