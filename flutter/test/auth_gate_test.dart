import 'package:flutter_test/flutter_test.dart';
import 'package:lingolive_mobile/firebase_options.dart';

void main() {
  test('Firebase project and named database remain canonical', () {
    expect(DefaultFirebaseOptions.projectId, 'lingolive-ia-f5778');
    expect(DefaultFirebaseOptions.databaseId,
        'ai-studio-lingoliveai-669e2e6d-3566-4aa0-ba62-227975dc5edd');
    expect(DefaultFirebaseOptions.android.appId,
        '1:995910450073:android:b32b72f4060a3875be3108');
    expect(DefaultFirebaseOptions.ios.iosBundleId, 'com.lingolive.ai');
  });
}
