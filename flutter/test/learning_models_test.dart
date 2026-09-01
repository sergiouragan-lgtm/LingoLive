import 'package:flutter_test/flutter_test.dart';
import 'package:lingolive_mobile/learning/learning_repository.dart';

void main() {
  test('quiz result preserves backend idempotency fields', () {
    final result = QuizResult.fromJson({
      'score': 80,
      'correctAnswers': 4,
      'totalQuestions': 5,
      'xpAwarded': 0,
      'newTotalXp': 700,
      'duplicated': true,
      'results': <Map<String, dynamic>>[],
    });
    expect(result.duplicate, isTrue);
    expect(result.xpAwarded, 0);
    expect(result.newTotalXp, 700);
  });

  test('saved word requires only persisted content fields', () {
    final word = SavedWord.fromJson(
        {'id': 'w1', 'word': 'hello', 'meaning': 'olá', 'language': 'en'}, 0);
    expect(word.id, 'w1');
    expect(word.word, 'hello');
    expect(word.language, 'en');
  });
}
