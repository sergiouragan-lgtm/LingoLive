import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/constants/api.dart';
import '../models/ebook_listing.dart';

final marketplaceProvider =
    FutureProvider.autoDispose<List<EbookListing>>((ref) async {
  final client = ref.read(apiClientProvider);
  final res = await client.get('${ApiConstants.ebookStudent}/marketplace');
  final list = (res.data['ebooks'] as List?) ?? [];
  return list
      .map((e) => EbookListing.fromJson(e as Map<String, dynamic>))
      .toList();
});

final enrollActionProvider =
    Provider<Future<void> Function(String ebookId)>((ref) {
  return (ebookId) async {
    final client = ref.read(apiClientProvider);
    await client.post('${ApiConstants.ebookStudent}/enroll',
        data: {'ebookId': ebookId});
    ref.invalidate(marketplaceProvider);
  };
});
