import 'dart:async';

import 'package:app_links/app_links.dart';

/// Resultado de um retorno de checkout entregue por deep link.
class BillingReturn {
  const BillingReturn({required this.success, this.sessionId});

  final bool success;
  final String? sessionId;
}

/// Escuta os deep links `lingolive://billing/success` e `lingolive://billing/cancel`.
///
/// O deep link é apenas um sinal de que o utilizador voltou à app: quem decide
/// se o pagamento foi concluído é `BillingRepository.verifySession`. Um link
/// forjado por outra app não desbloqueia nada.
class DeepLinkListener {
  DeepLinkListener({AppLinks? appLinks}) : _appLinks = appLinks ?? AppLinks();

  final AppLinks _appLinks;
  StreamSubscription<Uri>? _subscription;

  static BillingReturn? parse(Uri uri) {
    if (uri.scheme != 'lingolive' || uri.host != 'billing') return null;
    final segment = uri.pathSegments.isEmpty ? '' : uri.pathSegments.first;
    if (segment == 'success') {
      return BillingReturn(
        success: true,
        sessionId: uri.queryParameters['session_id'],
      );
    }
    if (segment == 'cancel') {
      return const BillingReturn(success: false);
    }
    return null;
  }

  /// Entrega o link que arrancou a app (quando existe) e depois todos os links
  /// recebidos com a app já aberta.
  Future<void> start(void Function(BillingReturn) onBillingReturn) async {
    final initial = await _appLinks.getInitialLink();
    if (initial != null) {
      final parsed = parse(initial);
      if (parsed != null) onBillingReturn(parsed);
    }

    _subscription = _appLinks.uriLinkStream.listen((uri) {
      final parsed = parse(uri);
      if (parsed != null) onBillingReturn(parsed);
    });
  }

  Future<void> dispose() async {
    await _subscription?.cancel();
    _subscription = null;
  }
}
