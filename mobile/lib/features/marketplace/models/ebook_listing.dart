class EbookListing {
  final String id;
  final String title;
  final String? subtitle;
  final String? description;
  final String? language;
  final String? cefrLevel;
  final String? coverColor;
  final String? authorName;
  final int totalChapters;
  final bool isEnrolled;
  final int enrolledCount;
  final double? averageRating;

  const EbookListing({
    required this.id,
    required this.title,
    this.subtitle,
    this.description,
    this.language,
    this.cefrLevel,
    this.coverColor,
    this.authorName,
    required this.totalChapters,
    required this.isEnrolled,
    required this.enrolledCount,
    this.averageRating,
  });

  factory EbookListing.fromJson(Map<String, dynamic> j) => EbookListing(
    id:             j['id'] as String? ?? j['_id'] as String,
    title:          j['title'] as String? ?? 'E-book',
    subtitle:       j['subtitle'] as String?,
    description:    j['description'] as String?,
    language:       j['language'] as String?,
    cefrLevel:      j['cefrLevel'] as String?,
    coverColor:     j['coverColor'] as String?,
    authorName:     j['authorName'] as String?,
    totalChapters:  (j['totalChapters'] as num?)?.toInt() ?? 0,
    isEnrolled:     j['isEnrolled'] as bool? ?? false,
    enrolledCount:  (j['enrolledCount'] as num?)?.toInt() ?? 0,
    averageRating:  (j['averageRating'] as num?)?.toDouble(),
  );
}
