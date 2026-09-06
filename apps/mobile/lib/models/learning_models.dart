/// Modelos que espelham exatamente o contrato de `/api/mobile/*`.
///
/// Os nomes dos eventos são os canónicos definidos em
/// `server/services/learning/learningEvents.service.ts`. Qualquer divergência
/// aqui traduz-se em progresso que não aparece no dashboard, por isso são
/// constantes e não literais espalhados pelo código.
class CanonicalEventTypes {
  const CanonicalEventTypes._();

  static const String quizCompleted = 'learning.quiz.completed';
  static const String pronunciationEvaluated =
      'learning.pronunciation.evaluated';
  static const String flashcardReviewed = 'learning.flashcard.reviewed';

  static const List<String> all = <String>[
    quizCompleted,
    pronunciationEvaluated,
    flashcardReviewed,
  ];
}

int _asInt(dynamic value) {
  if (value is int) return value;
  if (value is num) return value.round();
  return int.tryParse('${value ?? ''}') ?? 0;
}

int? _asNullableInt(dynamic value) {
  if (value == null) return null;
  return _asInt(value);
}

class QuizQuestion {
  QuizQuestion({
    required this.id,
    required this.type,
    required this.instruction,
    required this.options,
    required this.points,
  });

  factory QuizQuestion.fromJson(Map<String, dynamic> json) => QuizQuestion(
    id: '${json['id']}',
    type: '${json['type']}',
    instruction: '${json['instruction'] ?? ''}',
    options: (json['options'] as List<dynamic>? ?? const [])
        .map((option) => '$option')
        .toList(growable: false),
    points: _asInt(json['points']),
  );

  final String id;
  final String type;
  final String instruction;
  final List<String> options;
  final int points;
}

class MobileQuiz {
  MobileQuiz({
    required this.id,
    required this.title,
    required this.language,
    required this.passingScorePercent,
    required this.questions,
  });

  factory MobileQuiz.fromJson(Map<String, dynamic> json) => MobileQuiz(
    id: '${json['id']}',
    title: '${json['title'] ?? 'Quiz'}',
    language: json['language'] as String?,
    passingScorePercent: _asInt(json['passingScorePercent']),
    questions: (json['questions'] as List<dynamic>? ?? const [])
        .map(
          (question) => QuizQuestion.fromJson(question as Map<String, dynamic>),
        )
        .toList(growable: false),
  );

  final String id;
  final String title;
  final String? language;
  final int passingScorePercent;
  final List<QuizQuestion> questions;
}

class GradedQuestion {
  GradedQuestion({
    required this.questionId,
    required this.correct,
    required this.expected,
    required this.given,
    required this.prompt,
  });

  factory GradedQuestion.fromJson(Map<String, dynamic> json) => GradedQuestion(
    questionId: '${json['questionId']}',
    correct: json['correct'] == true,
    expected: '${json['expected'] ?? ''}',
    given: '${json['given'] ?? ''}',
    prompt: '${json['prompt'] ?? ''}',
  );

  final String questionId;
  final bool correct;
  final String expected;
  final String given;
  final String prompt;
}

class QuizResult {
  QuizResult({
    required this.scorePercent,
    required this.passed,
    required this.questions,
    required this.awardedXp,
    required this.duplicated,
  });

  factory QuizResult.fromJson(Map<String, dynamic> json) {
    final result = json['result'] as Map<String, dynamic>? ?? const {};
    final xp = json['xp'] as Map<String, dynamic>? ?? const {};
    return QuizResult(
      scorePercent: _asInt(result['scorePercent']),
      passed: result['passed'] == true,
      questions: (result['questions'] as List<dynamic>? ?? const [])
          .map(
            (question) =>
                GradedQuestion.fromJson(question as Map<String, dynamic>),
          )
          .toList(growable: false),
      awardedXp: _asInt(xp['awardedXp']),
      duplicated: json['duplicated'] == true,
    );
  }

  final int scorePercent;
  final bool passed;
  final List<GradedQuestion> questions;
  final int awardedXp;

  /// `true` quando o servidor reconheceu a submissão como repetição da mesma
  /// tentativa e, por isso, não voltou a atribuir XP.
  final bool duplicated;
}

class DueFlashcard {
  DueFlashcard({
    required this.id,
    required this.front,
    required this.back,
    required this.repetitionCount,
    required this.isNew,
  });

  factory DueFlashcard.fromJson(Map<String, dynamic> json) => DueFlashcard(
    id: '${json['id']}',
    front: '${json['front'] ?? ''}',
    back: '${json['back'] ?? ''}',
    repetitionCount: _asInt(json['repetitionCount']),
    isNew: json['isNew'] == true,
  );

  final String id;
  final String front;
  final String back;
  final int repetitionCount;
  final bool isNew;
}

class FlashcardReviewOutcome {
  FlashcardReviewOutcome({
    required this.interval,
    required this.nextReviewAt,
    required this.awardedXp,
    required this.duplicated,
  });

  factory FlashcardReviewOutcome.fromJson(Map<String, dynamic> json) {
    final srs = json['srs'] as Map<String, dynamic>? ?? const {};
    final xp = json['xp'] as Map<String, dynamic>? ?? const {};
    return FlashcardReviewOutcome(
      interval: _asInt(srs['interval']),
      nextReviewAt: '${srs['nextReviewAt'] ?? ''}',
      awardedXp: _asInt(xp['awardedXp']),
      duplicated: json['duplicated'] == true,
    );
  }

  final int interval;
  final String nextReviewAt;
  final int awardedXp;
  final bool duplicated;
}

class PronunciationEvaluation {
  PronunciationEvaluation({
    required this.id,
    required this.overallScore,
    required this.accuracyScore,
    required this.fluencyScore,
    required this.transcription,
    required this.generalFeedback,
    required this.improvementTips,
  });

  factory PronunciationEvaluation.fromJson(Map<String, dynamic> json) =>
      PronunciationEvaluation(
        id: '${json['id']}',
        overallScore: _asInt(json['overallScore']),
        accuracyScore: _asInt(json['accuracyScore']),
        fluencyScore: _asInt(json['fluencyScore']),
        transcription: '${json['transcription'] ?? ''}',
        generalFeedback: '${json['generalFeedback'] ?? ''}',
        improvementTips: (json['improvementTips'] as List<dynamic>? ?? const [])
            .map((tip) => '$tip')
            .toList(growable: false),
      );

  final String id;
  final int overallScore;
  final int accuracyScore;
  final int fluencyScore;
  final String transcription;
  final String generalFeedback;
  final List<String> improvementTips;
}

class TimelineEntry {
  TimelineEntry({
    required this.eventId,
    required this.type,
    required this.occurredOn,
    required this.score,
    required this.source,
  });

  factory TimelineEntry.fromJson(Map<String, dynamic> json) => TimelineEntry(
    eventId: '${json['eventId']}',
    type: '${json['type']}',
    occurredOn: '${json['occurredOn'] ?? ''}',
    score: _asInt(json['score']),
    source: '${json['source'] ?? 'mobile'}',
  );

  final String eventId;
  final String type;
  final String occurredOn;
  final int score;
  final String source;

  String get label {
    switch (type) {
      case CanonicalEventTypes.quizCompleted:
        return 'Quiz concluído';
      case CanonicalEventTypes.pronunciationEvaluated:
        return 'Pronúncia avaliada';
      case CanonicalEventTypes.flashcardReviewed:
        return 'Flashcard revisto';
      default:
        return type;
    }
  }
}

class MobileDashboard {
  MobileDashboard({
    required this.tenantId,
    required this.role,
    required this.totalXp,
    required this.level,
    required this.xpIntoLevel,
    required this.xpForNextLevel,
    required this.coins,
    required this.quizAverage,
    required this.pronunciationAverage,
    required this.flashcardAverage,
    required this.activeDays,
    required this.estimatedCefr,
    required this.vocabularyMastered,
    required this.grammarWeaknesses,
    required this.timeline,
  });

  factory MobileDashboard.fromJson(Map<String, dynamic> json) {
    final xp = json['xp'] as Map<String, dynamic>? ?? const {};
    final progress = json['progress'] as Map<String, dynamic>? ?? const {};
    final memory = json['memory'] as Map<String, dynamic>? ?? const {};
    return MobileDashboard(
      tenantId: '${json['tenantId'] ?? ''}',
      role: '${json['role'] ?? ''}',
      totalXp: _asInt(xp['total']),
      level: _asInt(xp['level']),
      xpIntoLevel: _asInt(xp['xpIntoLevel']),
      xpForNextLevel: _asInt(xp['xpForNextLevel']),
      coins: _asInt(xp['coins']),
      quizAverage: _asNullableInt(progress['quizAverage']),
      pronunciationAverage: _asNullableInt(progress['pronunciationAverage']),
      flashcardAverage: _asNullableInt(progress['flashcardAverage']),
      activeDays: _asInt(progress['activeDays']),
      estimatedCefr: progress['estimatedCefr'] as String?,
      vocabularyMastered: (memory['vocabularyMastered'] as List<dynamic>? ??
              const [])
          .map((term) => '$term')
          .toList(growable: false),
      grammarWeaknesses: (memory['grammarWeaknesses'] as List<dynamic>? ??
              const [])
          .map((term) => '$term')
          .toList(growable: false),
      timeline: (json['timeline'] as List<dynamic>? ?? const [])
          .map((entry) => TimelineEntry.fromJson(entry as Map<String, dynamic>))
          .toList(growable: false),
    );
  }

  final String tenantId;
  final String role;
  final int totalXp;
  final int level;
  final int xpIntoLevel;
  final int xpForNextLevel;
  final int coins;

  /// `null` significa "ainda sem evidência", que é diferente de zero. O
  /// dashboard mostra "—" nesse caso em vez de fingir um resultado.
  final int? quizAverage;
  final int? pronunciationAverage;
  final int? flashcardAverage;

  final int activeDays;
  final String? estimatedCefr;
  final List<String> vocabularyMastered;
  final List<String> grammarWeaknesses;
  final List<TimelineEntry> timeline;

  double get levelProgress =>
      xpForNextLevel <= 0 ? 0 : (xpIntoLevel / xpForNextLevel).clamp(0.0, 1.0);
}

class SchoolClaims {
  SchoolClaims({
    required this.role,
    required this.tenantId,
    required this.schoolId,
    required this.classIds,
    required this.crossTenant,
  });

  factory SchoolClaims.fromJson(Map<String, dynamic> json) => SchoolClaims(
    role: '${json['role'] ?? 'STUDENT'}',
    tenantId: '${json['tenantId'] ?? ''}',
    schoolId: json['schoolId'] as String?,
    classIds: (json['classIds'] as List<dynamic>? ?? const [])
        .map((id) => '$id')
        .toList(growable: false),
    crossTenant: json['crossTenant'] == true,
  );

  final String role;
  final String tenantId;
  final String? schoolId;
  final List<String> classIds;
  final bool crossTenant;

  bool get isEducator => const {
    'TEACHER',
    'NATIVE_TEACHER',
    'SCHOOL_ADMIN',
    'ORG_ADMIN',
    'PLATFORM_ADMIN',
    'SUPER_ADMIN',
  }.contains(role);
}
