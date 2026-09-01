import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

import '../firebase_services.dart';

class NotificationService {
  NotificationService._();
  static final instance = NotificationService._();
  StreamSubscription<String>? _refreshSubscription;

  Future<void> activate(User user) async {
    final settings = await FirebaseMessaging.instance
        .requestPermission(alert: true, badge: true, sound: true);
    if (settings.authorizationStatus == AuthorizationStatus.denied) return;
    await FirebaseMessaging.instance.setAutoInitEnabled(true);
    final token = await FirebaseMessaging.instance.getToken();
    if (token != null) await _storeToken(user.uid, token);
    await _refreshSubscription?.cancel();
    _refreshSubscription = FirebaseMessaging.instance.onTokenRefresh
        .listen((token) => _storeToken(user.uid, token));
  }

  Future<void> deactivate(User user) async {
    await _refreshSubscription?.cancel();
    _refreshSubscription = null;
    final token = await FirebaseMessaging.instance.getToken();
    if (token != null)
      await FirebaseServices.firestore
          .collection('users')
          .doc(user.uid)
          .collection('devices')
          .doc(_documentId(token))
          .delete();
    await FirebaseMessaging.instance.setAutoInitEnabled(false);
    await FirebaseMessaging.instance.deleteToken();
  }

  Future<void> _storeToken(String uid, String token) =>
      FirebaseServices.firestore
          .collection('users')
          .doc(uid)
          .collection('devices')
          .doc(_documentId(token))
          .set({
        'token': token,
        'platform': 'flutter',
        'enabled': true,
        'updatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));

  String _documentId(String token) {
    final normalized = token.replaceAll('/', '_');
    return normalized.substring(
        0, normalized.length > 180 ? 180 : normalized.length);
  }
}
