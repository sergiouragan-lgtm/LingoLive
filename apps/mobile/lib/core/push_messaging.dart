import 'dart:io';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import '../data/learning_repository.dart';
import 'crash_reporter.dart';

/// Handler de mensagens recebidas com a app terminada. Tem de ser uma função
/// de topo — o Flutter arranca um isolate novo para a executar, onde nada foi
/// inicializado ainda, por isso o Firebase é arrancado aqui antes de qualquer
/// uso do Crashlytics.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  CrashReporter.breadcrumb('push recebido em background: ${message.messageId}');
}

/// Notificações push nativas (FCM).
///
/// O token é registado no backend em `/api/mobile/devices` e revogado no
/// logout, para que um dispositivo partilhado nunca continue a receber
/// notificações do utilizador anterior.
class PushMessaging {
  PushMessaging(this._repository, {FirebaseMessaging? messaging})
    : _messaging = messaging ?? FirebaseMessaging.instance;

  final LearningRepository _repository;
  final FirebaseMessaging _messaging;
  final FlutterLocalNotificationsPlugin _local =
      FlutterLocalNotificationsPlugin();

  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'lingolive_reminders',
    'Lembretes LingoLIVE',
    description: 'Metas diárias, aulas agendadas e conquistas.',
    importance: Importance.high,
  );

  String? _registeredToken;
  String? get registeredToken => _registeredToken;

  Future<bool> requestPermission() async {
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    return settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional;
  }

  Future<void> initialize({required String appVersion}) async {
    await _local.initialize(
      const InitializationSettings(
        android: AndroidInitializationSettings('@mipmap/ic_launcher'),
        iOS: DarwinInitializationSettings(),
      ),
    );

    await _local
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >()
        ?.createNotificationChannel(_channel);

    // Em iOS o FCM só devolve um token depois de o APNs estar pronto.
    await _messaging.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );

    FirebaseMessaging.onMessage.listen(_showForegroundNotification);
    _messaging.onTokenRefresh.listen((token) => _register(token, appVersion));

    final token = await _messaging.getToken();
    if (token != null) {
      await _register(token, appVersion);
    }
  }

  Future<void> _register(String token, String appVersion) async {
    try {
      await _repository.registerDevice(
        fcmToken: token,
        platform: Platform.isIOS ? 'ios' : 'android',
        appVersion: appVersion,
        deviceModel: Platform.operatingSystemVersion,
        locale: Platform.localeName,
      );
      _registeredToken = token;
    } catch (error, stack) {
      // Uma falha de registo não pode impedir o arranque da app: o token será
      // reenviado no próximo `onTokenRefresh` ou arranque.
      await CrashReporter.recordHandled(
        error,
        stack,
        reason: 'registo de token FCM falhou',
      );
    }
  }

  Future<void> revoke() async {
    final token = _registeredToken;
    if (token == null) return;
    try {
      await _repository.revokeDevice(token);
    } catch (error, stack) {
      await CrashReporter.recordHandled(
        error,
        stack,
        reason: 'revogação de token FCM falhou',
      );
    } finally {
      _registeredToken = null;
      await _messaging.deleteToken();
    }
  }

  Future<void> _showForegroundNotification(RemoteMessage message) async {
    final notification = message.notification;
    if (notification == null) return;
    await _local.show(
      notification.hashCode,
      notification.title,
      notification.body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _channel.id,
          _channel.name,
          channelDescription: _channel.description,
          importance: Importance.high,
        ),
        iOS: const DarwinNotificationDetails(),
      ),
    );
  }
}
