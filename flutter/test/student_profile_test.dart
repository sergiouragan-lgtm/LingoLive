import 'package:flutter_test/flutter_test.dart';
import 'package:lingolive_mobile/features/profile/domain/student_profile.dart';

void main() {
  test('maps the authoritative intelligent profile contract', () {
    final profile = StudentProfile.fromMap({
      'displayName': 'Sofia',
      'targetLanguage': 'Inglês',
      'currentCefr': 'B2',
      'dailyGoalMinutes': 20,
    });
    expect(profile.name, 'Sofia');
    expect(profile.language, 'Inglês');
    expect(profile.cefr, 'B2');
    expect(profile.dailyGoalMinutes, 20);
  });
}
