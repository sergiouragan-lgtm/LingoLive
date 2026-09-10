import 'package:flutter_test/flutter_test.dart';
import 'package:lingolive_mobile/core/sync/offline_sync_service.dart';

class MemoryQueueStore implements QueueStore {
  String? value;
  @override Future<String?> read() async => value;
  @override Future<void> write(String next) async { value = next; }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('deduplicates attempts and synchronizes in order', () async {
    final written = <String>[];
    final service = OfflineSyncService(
      store: MemoryQueueStore(),
      networkChecker: () async => true,
      writer: (attempt) async =>
          written.add(attempt['idempotencyKey']! as String),
    );
    const attempt = <String, Object?>{
      'idempotencyKey': 'attempt-1',
      'result': 'correct',
    };
    await service.enqueue(attempt);
    await service.enqueue(attempt);
    expect(await service.readPending(), hasLength(1));
    expect(await service.synchronize(), 1);
    expect(written, ['attempt-1']);
    expect(await service.readPending(), isEmpty);
  });
}
