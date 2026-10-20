import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/constants/api.dart';
import '../models/enrollment.dart';

final libraryProvider =
    FutureProvider.autoDispose<List<EbookEnrollment>>((ref) async {
  final client = ref.read(apiClientProvider);
  final res = await client.get('${ApiConstants.ebookStudent}/library');
  final list = (res.data['library'] as List?) ?? [];
  return list.map((e) => EbookEnrollment.fromJson(e as Map<String, dynamic>)).toList();
});
