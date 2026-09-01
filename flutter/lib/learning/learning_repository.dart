import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;

import '../firebase_services.dart';

class LearningApiException implements Exception {
  final String message;
  final int? statusCode;
  const LearningApiException(this.message, [this.statusCode]);
  @override
  String toString() => message;
}

class QuizQuestion {
  final String id, question, skill, difficulty;
  final List<String> options;
  const QuizQuestion(
      {required this.id,
      required this.question,
      required this.options,
      required this.skill,
      required this.difficulty});
  factory QuizQuestion.fromJson(Map<String, dynamic> json) => QuizQuestion(
        id: json['id'] as String? ?? '',
        question: json['question'] as String? ?? '',
        options: (json['options'] as List<dynamic>? ?? const [])
            .whereType<String>()
            .toList(),
        skill: json['skill'] as String? ?? '',
        difficulty: json['difficulty'] as String? ?? '',
      );
}

class QuizSession {
  final String id;
  final List<QuizQuestion> questions;
  const QuizSession(this.id, this.questions);
}

class QuizResult {
  final int score, correctAnswers, totalQuestions, xpAwarded, newTotalXp;
  final bool duplicate;
  final List<Map<String, dynamic>> results;
  const QuizResult(
      {required this.score,
      required this.correctAnswers,
      required this.totalQuestions,
      required this.xpAwarded,
      required this.newTotalXp,
      required this.duplicate,
      required this.results});
  factory QuizResult.fromJson(Map<String, dynamic> json) => QuizResult(
        score: (json['score'] as num?)?.round() ?? 0,
        correctAnswers: (json['correctAnswers'] as num?)?.round() ?? 0,
        totalQuestions: (json['totalQuestions'] as num?)?.round() ?? 0,
        xpAwarded: (json['xpAwarded'] as num?)?.round() ?? 0,
        newTotalXp: (json['newTotalXp'] as num?)?.round() ?? 0,
        duplicate: json['duplicated'] == true || json['duplicate'] == true,
        results: (json['results'] as List<dynamic>? ?? const [])
            .whereType<Map<String, dynamic>>()
            .toList(),
      );
}

class SavedWord {
  final String id, word, meaning, language, pronunciation;
  const SavedWord(
      {required this.id,
      required this.word,
      required this.meaning,
      required this.language,
      required this.pronunciation});
  factory SavedWord.fromJson(Map<String, dynamic> json, int index) => SavedWord(
        id: (json['id'] ?? 'word_$index').toString(),
        word: (json['word'] ?? '').toString().trim(),
        meaning: (json['meaning'] ?? '').toString().trim(),
        language: (json['language'] ?? json['targetLanguage'] ?? '')
            .toString()
            .trim(),
        pronunciation: (json['pronunciation'] ?? '').toString().trim(),
      );
}

class LearningRepository {
  static const apiBaseUrl = String.fromEnvironment('API_BASE_URL');

  Future<Map<String, String>> _headers() async {
    if (apiBaseUrl.isEmpty)
      throw const LearningApiException('API_BASE_URL não configurado.');
    final token = await FirebaseAuth.instance.currentUser?.getIdToken(true);
    if (token == null)
      throw const LearningApiException('Sessão expirada.', 401);
    return {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json'
    };
  }

  Future<Map<String, dynamic>> _request(String method, String path,
      {Object? body, Duration timeout = const Duration(seconds: 30)}) async {
    final uri = Uri.parse('$apiBaseUrl$path');
    final headers = await _headers();
    final encoded = body == null ? null : jsonEncode(body);
    final response = switch (method) {
      'GET' => await http.get(uri, headers: headers).timeout(timeout),
      'POST' =>
        await http.post(uri, headers: headers, body: encoded).timeout(timeout),
      _ => throw const LearningApiException('Método de API inválido.'),
    };
    dynamic decoded;
    try {
      decoded = jsonDecode(response.body);
    } catch (_) {
      decoded = null;
    }
    if (response.statusCode < 200 || response.statusCode >= 300) {
      final error =
          decoded is Map<String, dynamic> ? decoded['error']?.toString() : null;
      throw LearningApiException(
          error ?? 'A atividade não pôde ser concluída.', response.statusCode);
    }
    if (decoded is! Map<String, dynamic>)
      throw const LearningApiException('Resposta inválida do servidor.');
    return decoded;
  }

  Future<QuizSession> generateQuiz(
      {required String language, String? level}) async {
    final json = await _request('POST', '/api/quizzes/generate',
        body: {'language': language, if (level != null) 'level': level});
    final questions = (json['questions'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(QuizQuestion.fromJson)
        .toList();
    final id = json['sessionId'] as String? ?? '';
    if (id.isEmpty ||
        questions.isEmpty ||
        questions.any((q) => q.id.isEmpty || q.options.length != 4))
      throw const LearningApiException('Quiz recebido é inválido.');
    return QuizSession(id, questions);
  }

  Future<QuizResult> submitQuiz(
          String sessionId, List<int> answers, double durationMinutes) async =>
      QuizResult.fromJson(
        await _request(
            'POST', '/api/quizzes/${Uri.encodeComponent(sessionId)}/submit',
            body: {'answers': answers, 'durationMinutes': durationMinutes}),
      );

  Future<Map<String, dynamic>> loadProgress() async =>
      (await _request('GET', '/api/learning/progress'))['progress']
          as Map<String, dynamic>? ??
      const {};

  Stream<DocumentSnapshot<Map<String, dynamic>>> watchGamification(
          String uid) =>
      FirebaseServices.firestore
          .collection('user_gamification')
          .doc(uid)
          .snapshots();
  Stream<DocumentSnapshot<Map<String, dynamic>>> watchProgress(String uid) =>
      FirebaseServices.firestore
          .collection('learning_progress')
          .doc(uid)
          .snapshots();

  Future<List<SavedWord>> loadSavedWords(String uid) async {
    final data = (await FirebaseServices.firestore
            .collection('user_achievements')
            .doc(uid)
            .get())
        .data();
    final raw = data?['savedWords'] as List<dynamic>? ?? const [];
    return raw
        .asMap()
        .entries
        .where((entry) => entry.value is Map)
        .map((entry) => SavedWord.fromJson(
            Map<String, dynamic>.from(entry.value as Map), entry.key))
        .where((word) => word.word.isNotEmpty && word.meaning.isNotEmpty)
        .toList();
  }

  Future<Map<String, dynamic>> completeFlashcards(
          {required String sessionId,
          required String language,
          required double durationMinutes,
          required List<Map<String, String>> ratings}) =>
      _request('POST',
          '/api/learning/flashcard-sessions/${Uri.encodeComponent(sessionId)}/complete',
          body: {
            'sessionId': sessionId,
            'language': language,
            'durationMinutes': durationMinutes,
            'ratings': ratings
          });

  Future<Map<String, dynamic>> evaluatePronunciation(
          {required String attemptId,
          required String targetText,
          required String language,
          required Uint8List audio,
          required double durationMinutes}) =>
      _request('POST', '/api/pronunciation/evaluate',
          timeout: const Duration(seconds: 90),
          body: {
            'attemptId': attemptId,
            'targetText': targetText,
            'language': language,
            'mimeType': 'audio/wav',
            'audioBase64': base64Encode(audio),
            'durationMinutes': durationMinutes,
          });
}
