import 'dart:convert';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';

typedef AttemptWriter = Future<void> Function(Map<String, Object?> attempt);
typedef NetworkChecker = Future<bool> Function();

abstract interface class QueueStore {
  Future<String?> read();
  Future<void> write(String value);
}

class PreferencesQueueStore implements QueueStore {
  PreferencesQueueStore({SharedPreferencesAsync? preferences})
    : _preferences = preferences ?? SharedPreferencesAsync();
  final SharedPreferencesAsync _preferences;
  @override Future<String?> read() => _preferences.getString(OfflineSyncService.queueKey);
  @override Future<void> write(String value) => _preferences.setString(OfflineSyncService.queueKey, value);
}

class OfflineSyncService {
  OfflineSyncService({
    QueueStore? store,
    AttemptWriter? writer,
    NetworkChecker? networkChecker,
  }) : _store = store ?? PreferencesQueueStore(),
       _writer = writer ?? _firestoreWriter,
       _networkChecker = networkChecker ?? _isOnline;
  static const queueKey = 'lingolive.pending_attempts.v1';
  final QueueStore _store;
  final AttemptWriter _writer;
  final NetworkChecker _networkChecker;
  static Future<bool> _isOnline() async {
    final connectivity = await Connectivity().checkConnectivity();
    return connectivity.any((result) => result != ConnectivityResult.none);
  }

  static Future<void> _firestoreWriter(Map<String, Object?> attempt) =>
      FirebaseFirestore.instance
          .collection('learning_attempts')
          .doc(attempt['idempotencyKey']! as String)
          .set(attempt);
  Future<void> enqueue(Map<String, Object?> attempt) async {
    final pending = await readPending();
    if (pending.any(
      (item) => item['idempotencyKey'] == attempt['idempotencyKey'],
    )) {
      return;
    }
    pending.add(attempt);
    await _store.write(jsonEncode(pending));
  }

  Future<List<Map<String, Object?>>> readPending() async {
    final raw = await _store.read();
    if (raw == null || raw.isEmpty) return [];
    return (jsonDecode(raw) as List)
        .map((item) => Map<String, Object?>.from(item as Map))
        .toList();
  }

  Future<int> synchronize() async {
    if (!await _networkChecker()) {
      return 0;
    }
    final pending = await readPending();
    var completed = 0;
    for (final attempt in pending) {
      try {
        await _writer(attempt);
        completed++;
      } catch (_) {
        break;
      }
    }
    await _store.write(jsonEncode(pending.skip(completed).toList()));
    return completed;
  }
}
