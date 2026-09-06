import '../core/api_client.dart';

/// Resultado da verificação de uma sessão de checkout junto do servidor, que
/// por sua vez a confirma junto do Stripe.
class CheckoutVerification {
  CheckoutVerification({
    required this.paid,
    required this.paymentStatus,
    required this.planId,
    required this.subscriptionStatus,
    required this.paidUntil,
  });

  factory CheckoutVerification.fromJson(Map<String, dynamic> json) {
    final entitlement =
        json['entitlement'] as Map<String, dynamic>? ?? const {};
    return CheckoutVerification(
      paid: json['paid'] == true,
      paymentStatus: '${json['paymentStatus'] ?? 'unknown'}',
      planId: json['planId'] as String?,
      subscriptionStatus: '${entitlement['subscriptionStatus'] ?? 'none'}',
      paidUntil: entitlement['paidUntil'] as String?,
    );
  }

  final bool paid;
  final String paymentStatus;
  final String? planId;
  final String subscriptionStatus;
  final String? paidUntil;
}

class Entitlement {
  Entitlement({
    required this.active,
    required this.subscriptionStatus,
    required this.planId,
    required this.paidUntil,
  });

  factory Entitlement.fromJson(Map<String, dynamic> json) => Entitlement(
    active: json['active'] == true,
    subscriptionStatus: '${json['subscriptionStatus'] ?? 'none'}',
    planId: json['subscriptionPlanId'] as String?,
    paidUntil: json['paidUntil'] as String?,
  );

  final bool active;
  final String subscriptionStatus;
  final String? planId;
  final String? paidUntil;
}

class CheckoutSession {
  CheckoutSession({required this.sessionId, required this.url});

  factory CheckoutSession.fromJson(Map<String, dynamic> json) =>
      CheckoutSession(sessionId: '${json['sessionId']}', url: '${json['url']}');

  final String sessionId;
  final String url;
}

class BillingRepository {
  BillingRepository(this._api);

  final ApiClient _api;

  Future<CheckoutSession> createCheckoutSession(String planId) async {
    final json = await _api.post(
      '/api/mobile/billing/checkout-session',
      body: {'planId': planId},
    );
    return CheckoutSession.fromJson(json as Map<String, dynamic>);
  }

  /// Confirma o pagamento no servidor. É esta chamada — e não o deep link — que
  /// decide se o acesso é desbloqueado.
  Future<CheckoutVerification> verifySession(String sessionId) async {
    final json = await _api.get('/api/mobile/billing/verify/$sessionId');
    return CheckoutVerification.fromJson(json as Map<String, dynamic>);
  }

  Future<Entitlement> loadEntitlement() async {
    final json = await _api.get('/api/mobile/billing/entitlement');
    return Entitlement.fromJson(json as Map<String, dynamic>);
  }
}
