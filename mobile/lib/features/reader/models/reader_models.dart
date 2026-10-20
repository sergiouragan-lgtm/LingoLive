class Chapter {
  final String id;
  final int order;
  final String title;
  final List<ContentBlock> blocks;
  final bool isCompleted;

  const Chapter({
    required this.id,
    required this.order,
    required this.title,
    required this.blocks,
    required this.isCompleted,
  });

  factory Chapter.fromJson(Map<String, dynamic> j) => Chapter(
    id:          j['_id'] as String? ?? j['id'] as String,
    order:       (j['order'] as num?)?.toInt() ?? 0,
    title:       j['title'] as String? ?? 'Capítulo',
    blocks:      ((j['blocks'] as List?) ?? [])
        .map((b) => ContentBlock.fromJson(b as Map<String, dynamic>))
        .toList(),
    isCompleted: j['isCompleted'] as bool? ?? false,
  );
}

class ContentBlock {
  final String type;
  final Map<String, dynamic> data;

  const ContentBlock({required this.type, required this.data});

  factory ContentBlock.fromJson(Map<String, dynamic> j) => ContentBlock(
    type: j['type'] as String? ?? 'paragraph',
    data: Map<String, dynamic>.from((j['data'] as Map?) ?? j),
  );
}

class ReaderState {
  final String ebookId;
  final String ebookTitle;
  final List<Chapter> chapters;
  final int currentChapterIndex;

  const ReaderState({
    required this.ebookId,
    required this.ebookTitle,
    required this.chapters,
    required this.currentChapterIndex,
  });

  Chapter? get currentChapter =>
      chapters.isNotEmpty ? chapters[currentChapterIndex] : null;
}
