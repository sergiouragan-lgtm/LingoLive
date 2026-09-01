import 'dart:convert';
import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;
import '../firebase_services.dart';

class BillingRepository {
  static const apiBaseUrl = String.fromEnvironment('API_BASE_URL');

  Stream<DocumentSnapshot<Map<String, dynamic>>> watchSubscription(
          String uid) =>
      FirebaseServices.firestore
          .collection('subscriptions')
          .doc('${uid}_sub')
          .snapshots();

  Future<Uri> createCheckout(String planId) async {
    if (apiBaseUrl.isEmpty)
      throw StateError('Pagamento indisponível: API_BASE_URL não configurado.');
    final token = await FirebaseAuth.instance.currentUser?.getIdToken(true);
    if (token == null) throw StateError('Sessão expirada.');
    final response = await http
        .post(
          Uri.parse('$apiBaseUrl/api/create-checkout-session'),
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json'
          },
          body: jsonEncode({'planId': planId, 'client': 'mobile'}),
        )
        .timeout(const Duration(seconds: 20));
    if (response.statusCode == 401)
      throw StateError('Sessão expirada. Inicie sessão novamente.');
    if (response.statusCode == 429)
      throw StateError('Muitas tentativas. Aguarde antes de tentar novamente.');
    if (response.statusCode < 200 || response.statusCode >= 300)
      throw StateError('Não foi possível iniciar o pagamento.');
    final decoded = jsonDecode(response.body);
    if (decoded is! Map<String, dynamic>)
      throw const FormatException('Resposta de pagamento inválida.');
    final url = decoded['url'] as String?;
    final uri = url == null ? null : Uri.tryParse(url);
    if (uri == null || uri.scheme != 'https')
      throw StateError('Resposta de pagamento inválida.');
    return uri;
  }
}
