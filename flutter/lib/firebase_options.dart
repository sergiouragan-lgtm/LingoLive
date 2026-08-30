import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart' show TargetPlatform, defaultTargetPlatform, kIsWeb;

abstract final class DefaultFirebaseOptions {
  static const projectId = 'lingolive-ia-f5778';
  static const databaseId = 'ai-studio-lingoliveai-669e2e6d-3566-4aa0-ba62-227975dc5edd';
  static const messagingSenderId = '995910450073';
  static const storageBucket = 'lingolive-ia-f5778.firebasestorage.app';

  static FirebaseOptions get currentPlatform {
    if (kIsWeb) return web;
    return switch (defaultTargetPlatform) {
      TargetPlatform.android => android,
      TargetPlatform.iOS || TargetPlatform.macOS => ios,
      _ => throw UnsupportedError('Plataforma ainda não configurada no FlutterFire.'),
    };
  }

  static const web = FirebaseOptions(
    apiKey: 'AIzaSyBbX50RcztVjJfk0RWBE0RwhnqLQlVKlSg',
    appId: '1:995910450073:web:4f34f7f8b3b4afc2be3108',
    messagingSenderId: messagingSenderId,
    projectId: projectId,
    authDomain: 'lingolive-ia-f5778.firebaseapp.com',
    storageBucket: storageBucket,
  );

  static const android = FirebaseOptions(
    apiKey: 'AIzaSyBn6v2RL6RGKweMf9dKJsOQi-KsWXTyGig',
    appId: '1:995910450073:android:b32b72f4060a3875be3108',
    messagingSenderId: messagingSenderId,
    projectId: projectId,
    storageBucket: storageBucket,
  );

  static const ios = FirebaseOptions(
    apiKey: 'AIzaSyD41boFVSXlT4DVcV2YQ6rmhgljoprV4e4',
    appId: '1:995910450073:ios:24644446f4b0a957be3108',
    messagingSenderId: messagingSenderId,
    projectId: projectId,
    storageBucket: storageBucket,
    iosBundleId: 'com.lingolive.ai',
  );
}
