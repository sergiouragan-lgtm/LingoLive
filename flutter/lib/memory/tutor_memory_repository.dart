import 'dart:async';
import 'dart:convert';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;

class TutorMemory {
  final bool enabled;
  final String preferredStyle;
  final List<String> learningGoals;
  final String studyFrequency;

  const TutorMemory({
    required this.enabled,
    required this.preferredStyle,
    required this.learningGoals,
    required this.studyFrequency,
  });

  factory TutorMemory.fromJson(Map<String, dynamic> json) => TutorMemory(
        enabled: json['enabled'] as bool? ?? true,
        preferredStyle: json['preferredStyle'] as String? ?? 'balanced',
        learningGoals: (json['learningGoals'] as List<dynamic>? ?? const [])
            .whereType<String>()
            .toList(),
        studyFrequency: json['studyFrequency'] as String? ?? '',
      );

  Map<String, dynamic> toJson() => {
        'enabled': enabled,
        'preferredStyle': preferredStyle,
        'learningGoals': learningGoals,
        'studyFrequency': studyFrequency,
      };
}

class TutorMemoryRepository {
  static const _apiBaseUrl = String.fromEnvironment('API_BASE_URL');

  Future<Map<String, String>> _headers() async {
    if (_apiBaseUrl.isEmpty) throw StateError('API_BASE_URL não configurado.');
    final token = await FirebaseAuth.instance.currentUser?.getIdToken(true);
    if (token == null) throw StateError('Sessão expirada.');
    return {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json'
    };
  }

  Uri get _uri => Uri.parse('$_apiBaseUrl/api/tutor-memory');

  Future<TutorMemory> load() async {
    final response = await http
        .get(_uri, headers: await _headers())
        .timeout(const Duration(seconds: 15));
    if (response.statusCode != 200)
      throw StateError('Não foi possível carregar a memória.');
    final decoded = jsonDecode(response.body);
    if (decoded is! Map<String, dynamic>)
      throw const FormatException('Resposta inválida.');
    return TutorMemory.fromJson(decoded);
  }

  Future<void> save(TutorMemory memory) async {
    final response = await http
        .patch(_uri,
            headers: await _headers(), body: jsonEncode(memory.toJson()))
        .timeout(const Duration(seconds: 15));
    if (response.statusCode < 200 || response.statusCode >= 300)
      throw StateError('Não foi possível guardar a memória.');
  }

  Future<void> delete() async {
    final response = await http
        .delete(_uri, headers: await _headers())
        .timeout(const Duration(seconds: 15));
    if (response.statusCode < 200 || response.statusCode >= 300)
      throw StateError('Não foi possível eliminar a memória.');
  }
}
