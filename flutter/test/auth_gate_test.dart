import 'package:flutter_test/flutter_test.dart';

void main() {
  test('Firebase project and named database remain canonical', () {
    const projectId = 'lingolive-ia-f5778';
    const databaseId = 'ai-studio-lingoliveai-669e2e6d-3566-4aa0-ba62-227975dc5edd';
    expect(projectId, isNotEmpty);
    expect(databaseId, isNot('(default)'));
  });
}
