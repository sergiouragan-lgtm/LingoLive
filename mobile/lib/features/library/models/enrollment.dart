class EbookEnrollment {
  final String ebookId;
  final String ebookTitle;
  final String? ebookSubtitle;
  final String? ebookLanguage;
  final String? ebookCefrLevel;
  final String? ebookCoverColor;
  final int totalChapters;
  final double completionPercent;
  final String? currentCefrLevel;
  final int enrolledAt;

  const EbookEnrollment({
    required this.ebookId,
    required this.ebookTitle,
    this.ebookSubtitle,
    this.ebookLanguage,
    this.ebookCefrLevel,
    this.ebookCoverColor,
    required this.totalChapters,
    required this.completionPercent,
    this.currentCefrLevel,
    required this.enrolledAt,
  });

  factory EbookEnrollment.fromJson(Map<String, dynamic> j) => EbookEnrollment(
    ebookId:           j['ebookId'] as String,
    ebookTitle:        j['ebookTitle'] as String? ?? 'E-book',
    ebookSubtitle:     j['ebookSubtitle'] as String?,
    ebookLanguage:     j['ebookLanguage'] as String?,
    ebookCefrLevel:    j['ebookCefrLevel'] as String?,
    ebookCoverColor:   j['ebookCoverColor'] as String?,
    totalChapters:     (j['totalChapters'] as num?)?.toInt() ?? 0,
    completionPercent: (j['completionPercent'] as num?)?.toDouble() ?? 0,
    currentCefrLevel:  j['currentCefrLevel'] as String?,
    enrolledAt:        (j['enrolledAt'] as num?)?.toInt() ?? 0,
  );
}
