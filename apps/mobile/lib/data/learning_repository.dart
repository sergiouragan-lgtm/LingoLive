import 'dart:convert';
import 'dart:typed_data';

import '../core/api_client.dart';
import '../models/learning_models.dart';

/// Acesso às atividades de aprendizagem mobile.
///
/// Nenhum método calcula pontuações, XP ou agendamentos: tudo isso é decidido
/// pelo servidor. O repositório limita-se a transportar respostas do
/// utilizador e a devolver o veredicto do backend.
class LearningRepository {
  LearningRepository(this._api);

  final ApiClient _api;

  Future<SchoolClaims> loadClaims() async {
    final json = await _api.get('/api/school/claims/me');
    return SchoolClaims.fromJson(json as Map<String, dynamic>);
  }

  Future<MobileDashboard> loadDashboard() async {
    final json = await _api.get('/api/mobile/dashboard');
    return MobileDashboard.fromJson(json as Map<String, dynamic>);
  }

  Future<Map<String, dynamic>> loadActivities() async {
    final json = await _api.get('/api/mobile/activities');
    return json as Map<String, dynamic>;
  }

  Future<MobileQuiz> loadQuiz(String quizId) async {
    final json = await _api.get('/api/mobile/quiz/$quizId');
    return MobileQuiz.fromJson(json as Map<String, dynamic>);
  }

  /// [attemptId] torna a submissão idempotente: reenviar a mesma tentativa
  /// após uma falha de rede devolve o mesmo resultado sem duplicar XP.
  Future<QuizResult> submitQuiz({
    required String quizId,
    required Map<String, String> answers,
    required String attemptId,
  }) async {
    final json = await _api.post(
      '/api/mobile/quiz/submit',
      body: {
        'quizId': quizId,
        'attemptId': attemptId,
        'answers': answers.entries
            .map((entry) => {'questionId': entry.key, 'value': entry.value})
            .toList(growable: false),
      },
    );
    return QuizResult.fromJson(json as Map<String, dynamic>);
  }

  Future<List<DueFlashcard>> loadDueFlashcards() async {
    final json = await _api.get('/api/mobile/flashcards/due');
    final due =
        (json as Map<String, dynamic>)['due'] as List<dynamic>? ?? const [];
    return due
        .map((card) => DueFlashcard.fromJson(card as Map<String, dynamic>))
        .toList(growable: false);
  }

  /// [quality] segue a escala SM-2 (0 = falhou por completo, 5 = imediato).
  Future<FlashcardReviewOutcome> reviewFlashcard({
    required String cardId,
    required int quality,
    required String sessionId,
  }) async {
    final json = await _api.post(
      '/api/mobile/flashcards/review',
      body: {'cardId': cardId, 'quality': quality, 'sessionId': sessionId},
    );
    return FlashcardReviewOutcome.fromJson(json as Map<String, dynamic>);
  }

  /// Envia o áudio gravado para avaliação real e, de seguida, regista o evento
  /// canónico. A pontuação nunca é calculada no dispositivo.
  Future<PronunciationEvaluation> evaluatePronunciation({
    required String targetText,
    required Uint8List audioBytes,
    required String mimeType,
    String? language,
  }) async {
    final json = await _api.post(
      '/api/pronunciation/evaluate',
      body: {
        'targetText': targetText,
        'audioBase64': base64Encode(audioBytes),
        'mimeType': mimeType,
        if (language != null) 'language': language,
      },
    );
    final evaluation = PronunciationEvaluation.fromJson(
      json as Map<String, dynamic>,
    );

    await _api.post(
      '/api/mobile/pronunciation/record',
      body: {'evaluationId': evaluation.id},
    );

    return evaluation;
  }

  Future<void> registerDevice({
    required String fcmToken,
    required String platform,
    String? appVersion,
    String? deviceModel,
    String? locale,
  }) async {
    await _api.post(
      '/api/mobile/devices',
      body: {
        'fcmToken': fcmToken,
        'platform': platform,
        'appVersion': appVersion,
        'deviceModel': deviceModel,
        'locale': locale,
      },
    );
  }

  Future<void> revokeDevice(String fcmToken) async {
    await _api.delete('/api/mobile/devices/$fcmToken');
  }
}
