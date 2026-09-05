import 'dart:async';
import 'dart:isolate';

import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:flutter/foundation.dart';

/// Captura de erros para o Firebase Crashlytics.
///
/// Cobre os três canais por onde um erro pode escapar numa app Flutter:
/// o handler de erros do framework, os erros da plataforma fora da árvore de
/// widgets, e os isolates em segundo plano. Sem os três, uma exceção pode
/// terminar a app sem deixar registo.
class CrashReporter {
  const CrashReporter._();

  /// Em debug os erros vão para a consola: enviá-los poluiria a consola do
  /// Crashlytics com ruído de desenvolvimento.
  static bool get _collectionEnabled => kReleaseMode || kProfileMode;

  static Future<void> install() async {
    await FirebaseCrashlytics.instance.setCrashlyticsCollectionEnabled(
      _collectionEnabled,
    );

    FlutterError.onError = (FlutterErrorDetails details) {
      FlutterError.presentError(details);
      FirebaseCrashlytics.instance.recordFlutterFatalError(details);
    };

    PlatformDispatcher.instance.onError = (Object error, StackTrace stack) {
      FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
      return true;
    };

    Isolate.current.addErrorListener(
      RawReceivePort((dynamic pair) async {
        final errorAndStacktrace = pair as List<dynamic>;
        await FirebaseCrashlytics.instance.recordError(
          errorAndStacktrace.first,
          StackTrace.fromString('${errorAndStacktrace.last}'),
          fatal: true,
        );
      }).sendPort,
    );
  }

  /// Corre [body] com todos os erros não capturados encaminhados para o
  /// Crashlytics. `runApp` deve ser invocado aqui dentro.
  static Future<void> guard(Future<void> Function() body) =>
      runZonedGuarded<Future<void>>(body, (error, stack) {
        FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
      }) ??
      Future<void>.value();

  /// Associa a sessão a um utilizador e ao seu tenant, para que um crash possa
  /// ser correlacionado com a escola afetada sem expor dados pessoais.
  static Future<void> identify({
    required String userId,
    String? tenantId,
    String? role,
  }) async {
    await FirebaseCrashlytics.instance.setUserIdentifier(userId);
    if (tenantId != null) {
      await FirebaseCrashlytics.instance.setCustomKey('tenantId', tenantId);
    }
    if (role != null) {
      await FirebaseCrashlytics.instance.setCustomKey('role', role);
    }
  }

  static Future<void> clearIdentity() async {
    await FirebaseCrashlytics.instance.setUserIdentifier('');
  }

  /// Regista um erro tratado (por exemplo, uma falha de API recuperada) com um
  /// rótulo que permita agrupá-lo na consola.
  static Future<void> recordHandled(
    Object error,
    StackTrace stack, {
    required String reason,
  }) => FirebaseCrashlytics.instance.recordError(
    error,
    stack,
    reason: reason,
    fatal: false,
  );

  static void breadcrumb(String message) =>
      FirebaseCrashlytics.instance.log(message);
}
