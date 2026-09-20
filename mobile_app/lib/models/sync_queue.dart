/// Sync queue item for offline operations
class SyncQueueItem {
  final String id;
  final String operation; // 'create', 'update', 'delete'
  final String collection;
  final String? docId;
  final Map<String, dynamic> data;
  final DateTime createdAt;
  int retries;

  SyncQueueItem({
    required this.id,
    required this.operation,
    required this.collection,
    required this.docId,
    required this.data,
    required this.createdAt,
    this.retries = 0,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'operation': operation,
      'collection': collection,
      'docId': docId,
      'data': data,
      'createdAt': createdAt.toIso8601String(),
      'retries': retries,
    };
  }

  factory SyncQueueItem.fromMap(Map<String, dynamic> map) {
    return SyncQueueItem(
      id: map['id'] as String,
      operation: map['operation'] as String,
      collection: map['collection'] as String,
      docId: map['docId'] as String?,
      data: Map<String, dynamic>.from(map['data'] as Map),
      createdAt: DateTime.parse(map['createdAt'] as String),
      retries: map['retries'] as int? ?? 0,
    );
  }
}

/// Ebook data model for offline reading
class EbookModel {
  final String id;
  final String title;
  final String author;
  final String description;
  final double price;
  final String language;
  final String level;
  final int pageCount;
  final String format; // 'pdf', 'epub'
  final int fileSize;
  final String coverUrl;
  final double rating;
  final int reviewCount;
  final DateTime publishedDate;
  final List<String> skills;

  EbookModel({
    required this.id,
    required this.title,
    required this.author,
    required this.description,
    required this.price,
    required this.language,
    required this.level,
    required this.pageCount,
    required this.format,
    required this.fileSize,
    required this.coverUrl,
    required this.rating,
    required this.reviewCount,
    required this.publishedDate,
    required this.skills,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'title': title,
      'author': author,
      'description': description,
      'price': price,
      'language': language,
      'level': level,
      'pageCount': pageCount,
      'format': format,
      'fileSize': fileSize,
      'coverUrl': coverUrl,
      'rating': rating,
      'reviewCount': reviewCount,
      'publishedDate': publishedDate.toIso8601String(),
      'skills': skills,
    };
  }

  factory EbookModel.fromMap(Map<String, dynamic> map) {
    return EbookModel(
      id: map['id'] as String,
      title: map['title'] as String,
      author: map['author'] as String,
      description: map['description'] as String,
      price: (map['price'] as num).toDouble(),
      language: map['language'] as String,
      level: map['level'] as String,
      pageCount: map['pageCount'] as int,
      format: map['format'] as String,
      fileSize: map['fileSize'] as int,
      coverUrl: map['coverUrl'] as String,
      rating: (map['rating'] as num).toDouble(),
      reviewCount: map['reviewCount'] as int,
      publishedDate: DateTime.parse(map['publishedDate'] as String),
      skills: List<String>.from(map['skills'] as List),
    );
  }
}

/// Ebook page content for offline reading
class EbookPageContent {
  final String ebookId;
  final int pageNumber;
  final String content;
  final String? imageUrl;
  final DateTime cachedAt;

  EbookPageContent({
    required this.ebookId,
    required this.pageNumber,
    required this.content,
    this.imageUrl,
    required this.cachedAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'ebookId': ebookId,
      'pageNumber': pageNumber,
      'content': content,
      'imageUrl': imageUrl,
      'cachedAt': cachedAt.toIso8601String(),
    };
  }

  factory EbookPageContent.fromMap(Map<String, dynamic> map) {
    return EbookPageContent(
      ebookId: map['ebookId'] as String,
      pageNumber: map['pageNumber'] as int,
      content: map['content'] as String,
      imageUrl: map['imageUrl'] as String?,
      cachedAt: DateTime.parse(map['cachedAt'] as String),
    );
  }
}

/// Vocabulary word for offline practice
class VocabularyWord {
  final String id;
  final String word;
  final String pronunciation;
  final String definition;
  final String exampleSentence;
  final String language;
  final String level;
  final List<String> relatedWords;
  final bool isLearned;
  final int practiceCount;
  final DateTime lastPracticed;

  VocabularyWord({
    required this.id,
    required this.word,
    required this.pronunciation,
    required this.definition,
    required this.exampleSentence,
    required this.language,
    required this.level,
    required this.relatedWords,
    required this.isLearned,
    required this.practiceCount,
    required this.lastPracticed,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'word': word,
      'pronunciation': pronunciation,
      'definition': definition,
      'exampleSentence': exampleSentence,
      'language': language,
      'level': level,
      'relatedWords': relatedWords,
      'isLearned': isLearned,
      'practiceCount': practiceCount,
      'lastPracticed': lastPracticed.toIso8601String(),
    };
  }

  factory VocabularyWord.fromMap(Map<String, dynamic> map) {
    return VocabularyWord(
      id: map['id'] as String,
      word: map['word'] as String,
      pronunciation: map['pronunciation'] as String,
      definition: map['definition'] as String,
      exampleSentence: map['exampleSentence'] as String,
      language: map['language'] as String,
      level: map['level'] as String,
      relatedWords: List<String>.from(map['relatedWords'] as List),
      isLearned: map['isLearned'] as bool? ?? false,
      practiceCount: map['practiceCount'] as int? ?? 0,
      lastPracticed: DateTime.parse(map['lastPracticed'] as String),
    );
  }
}

/// Reading session for progress tracking
class ReadingSession {
  final String id;
  final String ebookId;
  final int startPage;
  final int currentPage;
  final int endPage;
  final Duration timeSpent;
  final DateTime startedAt;
  final DateTime? endedAt;
  final List<String> highlightedText;
  final List<int> bookmarkedPages;

  ReadingSession({
    required this.id,
    required this.ebookId,
    required this.startPage,
    required this.currentPage,
    required this.endPage,
    required this.timeSpent,
    required this.startedAt,
    this.endedAt,
    required this.highlightedText,
    required this.bookmarkedPages,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'ebookId': ebookId,
      'startPage': startPage,
      'currentPage': currentPage,
      'endPage': endPage,
      'timeSpent': timeSpent.inSeconds,
      'startedAt': startedAt.toIso8601String(),
      'endedAt': endedAt?.toIso8601String(),
      'highlightedText': highlightedText,
      'bookmarkedPages': bookmarkedPages,
    };
  }

  factory ReadingSession.fromMap(Map<String, dynamic> map) {
    return ReadingSession(
      id: map['id'] as String,
      ebookId: map['ebookId'] as String,
      startPage: map['startPage'] as int,
      currentPage: map['currentPage'] as int,
      endPage: map['endPage'] as int,
      timeSpent: Duration(seconds: map['timeSpent'] as int),
      startedAt: DateTime.parse(map['startedAt'] as String),
      endedAt: map['endedAt'] != null ? DateTime.parse(map['endedAt'] as String) : null,
      highlightedText: List<String>.from(map['highlightedText'] as List? ?? []),
      bookmarkedPages: List<int>.from(map['bookmarkedPages'] as List? ?? []),
    );
  }
}

/// Live class data model
class LiveClass {
  final String id;
  final String teacherId;
  final String teacherName;
  final String title;
  final String description;
  final DateTime scheduledTime;
  final Duration duration;
  final int maxParticipants;
  final String status; // 'scheduled', 'live', 'ended', 'cancelled'
  final String roomCode;
  final String language;
  final String level;
  final int currentParticipants;

  LiveClass({
    required this.id,
    required this.teacherId,
    required this.teacherName,
    required this.title,
    required this.description,
    required this.scheduledTime,
    required this.duration,
    required this.maxParticipants,
    required this.status,
    required this.roomCode,
    required this.language,
    required this.level,
    required this.currentParticipants,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'teacherId': teacherId,
      'teacherName': teacherName,
      'title': title,
      'description': description,
      'scheduledTime': scheduledTime.toIso8601String(),
      'duration': duration.inMinutes,
      'maxParticipants': maxParticipants,
      'status': status,
      'roomCode': roomCode,
      'language': language,
      'level': level,
      'currentParticipants': currentParticipants,
    };
  }

  factory LiveClass.fromMap(Map<String, dynamic> map) {
    return LiveClass(
      id: map['id'] as String,
      teacherId: map['teacherId'] as String,
      teacherName: map['teacherName'] as String,
      title: map['title'] as String,
      description: map['description'] as String,
      scheduledTime: DateTime.parse(map['scheduledTime'] as String),
      duration: Duration(minutes: map['duration'] as int),
      maxParticipants: map['maxParticipants'] as int,
      status: map['status'] as String,
      roomCode: map['roomCode'] as String,
      language: map['language'] as String,
      level: map['level'] as String,
      currentParticipants: map['currentParticipants'] as int? ?? 0,
    );
  }
}
