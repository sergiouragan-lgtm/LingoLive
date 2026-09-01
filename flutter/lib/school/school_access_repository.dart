import 'dart:convert';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;

class SchoolContext {
  final String role;
  final String? schoolId, tenantId;
  const SchoolContext({required this.role, this.schoolId, this.tenantId});
}

class SchoolAccessRepository {
  static const _apiBaseUrl = String.fromEnvironment('API_BASE_URL');

  Future<SchoolContext?> load() async {
    if (_apiBaseUrl.isEmpty) return null;
    final token = await FirebaseAuth.instance.currentUser?.getIdToken(true);
    if (token == null) return null;
    final response = await http
        .get(Uri.parse('$_apiBaseUrl/api/school/mobile-context'), headers: {
      'Authorization': 'Bearer $token'
    }).timeout(const Duration(seconds: 15));
    if (response.statusCode == 403) return null;
    if (response.statusCode != 200)
      throw StateError('Não foi possível validar o acesso escolar.');
    final decoded = jsonDecode(response.body);
    if (decoded is! Map<String, dynamic>)
      throw const FormatException('Contexto escolar inválido.');
    final role = decoded['role'] as String? ?? '';
    if (role.isEmpty ||
        (decoded['schoolId'] == null && decoded['tenantId'] == null))
      return null;
    return SchoolContext(
        role: role,
        schoolId: decoded['schoolId'] as String?,
        tenantId: decoded['tenantId'] as String?);
  }
}
