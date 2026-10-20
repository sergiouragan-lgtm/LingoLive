import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/constants/api.dart';
import '../models/reader_models.dart';

final readerProvider = FutureProvider.autoDispose
    .family<ReaderState, String>((ref, ebookId) async {
  final client = ref.read(apiClientProvider);
  final res = await client.get('${ApiConstants.ebookStudent}/$ebookId/reader');
  final data = res.data as Map<String, dynamic>;
  final chapters = ((data['chapters'] as List?) ?? [])
      .map((c) => Chapter.fromJson(c as Map<String, dynamic>))
      .toList()
    ..sort((a, b) => a.order.compareTo(b.order));
  return ReaderState(
    ebookId: ebookId,
    ebookTitle: data['title'] as String? ?? 'E-book',
    chapters: chapters,
    currentChapterIndex: 0,
  );
});

final currentChapterIndexProvider =
    StateProvider.autoDispose<int>((ref) => 0);

final markCompleteProvider =
    Provider<Future<void> Function(String ebookId, String chapterId)>((ref) {
  return (ebookId, chapterId) async {
    final client = ref.read(apiClientProvider);
    await client.post(
      '${ApiConstants.ebookStudent}/$ebookId/chapters/$chapterId/complete',
    );
  };
});
