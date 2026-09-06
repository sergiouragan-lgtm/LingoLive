import 'package:flutter_test/flutter_test.dart';
import 'package:lingolive_mobile/models/learning_models.dart';

void main() {
  test('o dashboard distingue ausência de evidência de zero', () {
    final dashboard = MobileDashboard.fromJson(<String, dynamic>{
      'tenantId': 'escola-1',
      'role': 'STUDENT',
      'xp': {
        'total': 620,
        'level': 2,
        'xpIntoLevel': 120,
        'xpForNextLevel': 500,
      },
      'progress': {
        'quizAverage': 0,
        'pronunciationAverage': null,
        'flashcardAverage': 80,
        'activeDays': 3,
      },
      'memory': {
        'vocabularyMastered': <String>['hello'],
      },
      'timeline': <dynamic>[],
    });

    expect(dashboard.quizAverage, 0);
    expect(dashboard.pronunciationAverage, isNull);
    expect(dashboard.flashcardAverage, 80);
    expect(dashboard.levelProgress, closeTo(0.24, 0.001));
    expect(dashboard.vocabularyMastered, ['hello']);
  });

  test('a linha temporal rotula os tipos canónicos', () {
    final entry = TimelineEntry.fromJson(<String, dynamic>{
      'eventId': 'e1',
      'type': CanonicalEventTypes.pronunciationEvaluated,
      'occurredOn': '2026-01-02T10:00:00.000Z',
      'score': 88,
      'source': 'mobile',
    });
    expect(entry.label, 'Pronúncia avaliada');
    expect(entry.score, 88);
  });

  test('o resultado do quiz expõe o XP atribuído pelo servidor', () {
    final result = QuizResult.fromJson(<String, dynamic>{
      'result': {
        'scorePercent': 75,
        'passed': true,
        'questions': [
          {
            'questionId': 'q1',
            'correct': false,
            'expected': 'blue',
            'given': 'red',
            'prompt': 'Cor do céu?',
          },
        ],
      },
      'xp': {'awardedXp': 100},
      'duplicated': false,
    });

    expect(result.scorePercent, 75);
    expect(result.awardedXp, 100);
    expect(result.questions.single.expected, 'blue');
  });
}
