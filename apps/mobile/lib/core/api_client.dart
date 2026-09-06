import 'dart:convert';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;

/// Erro devolvido pela API LingoLIVE, preservando o código canónico do backend
/// (`MOBILE_DASHBOARD_UNAVAILABLE`, `SCHOOL_TENANT_FORBIDDEN`, ...) para que a
/// interface possa reagir sem depender de mensagens traduzidas.
class ApiException implements Exception {
  ApiException({
    required this.statusCode,
    required this.code,
    required this.message,
    this.retryable = false,
  });

  final int statusCode;
  final String code;
  final String message;
  final bool retryable;

  bool get isUnauthorized => statusCode == 401;
  bool get isForbidden => statusCode == 403;

  @override
  String toString() => 'ApiException($statusCode, $code): $message';
}

/// Cliente HTTP autenticado.
///
/// Todos os pedidos levam o ID token do Firebase. O token é obtido a cada
/// chamada (o SDK devolve o valor em cache até estar perto de expirar), e um
/// 401 força uma renovação e uma única repetição — de outra forma um token
/// expirado durante uma sessão longa terminaria a app sem necessidade.
class ApiClient {
  ApiClient({
    required this.baseUrl,
    FirebaseAuth? auth,
    http.Client? httpClient,
  }) : _auth = auth ?? FirebaseAuth.instance,
       _http = httpClient ?? http.Client();

  final String baseUrl;
  final FirebaseAuth _auth;
  final http.Client _http;

  Future<Map<String, String>> _headers({bool forceRefresh = false}) async {
    final user = _auth.currentUser;
    if (user == null) {
      throw ApiException(
        statusCode: 401,
        code: 'NOT_AUTHENTICATED',
        message: 'Sessão expirada. Inicie sessão novamente.',
      );
    }
    final token = await user.getIdToken(forceRefresh);
    return {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  Future<dynamic> get(String path, {Map<String, String>? query}) =>
      _send('GET', path, query: query);

  Future<dynamic> post(String path, {Object? body}) =>
      _send('POST', path, body: body);

  Future<dynamic> delete(String path) => _send('DELETE', path);

  Future<dynamic> _send(
    String method,
    String path, {
    Object? body,
    Map<String, String>? query,
    bool isRetry = false,
  }) async {
    final uri = Uri.parse('$baseUrl$path').replace(queryParameters: query);
    final headers = await _headers(forceRefresh: isRetry);

    late http.Response response;
    try {
      switch (method) {
        case 'POST':
          response = await _http.post(
            uri,
            headers: headers,
            body: body == null ? null : jsonEncode(body),
          );
          break;
        case 'DELETE':
          response = await _http.delete(uri, headers: headers);
          break;
        default:
          response = await _http.get(uri, headers: headers);
      }
    } on Exception catch (error) {
      throw ApiException(
        statusCode: 0,
        code: 'NETWORK_UNAVAILABLE',
        message: 'Sem ligação ao servidor LingoLIVE ($error).',
        retryable: true,
      );
    }

    if (response.statusCode == 401 && !isRetry) {
      return _send(method, path, body: body, query: query, isRetry: true);
    }

    final decoded = response.body.isEmpty ? null : _tryDecode(response.body);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return decoded;
    }

    final map =
        decoded is Map<String, dynamic> ? decoded : const <String, dynamic>{};
    throw ApiException(
      statusCode: response.statusCode,
      code: (map['error'] ?? 'UNKNOWN_ERROR').toString(),
      message:
          (map['message'] ?? map['error'] ?? 'Pedido recusado pelo servidor.')
              .toString(),
      retryable: map['retryable'] == true,
    );
  }

  dynamic _tryDecode(String body) {
    try {
      return jsonDecode(body);
    } on FormatException {
      return null;
    }
  }

  void close() => _http.close();
}
