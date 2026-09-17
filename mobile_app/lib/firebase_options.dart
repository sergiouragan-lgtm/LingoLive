import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter_dotenv/flutter_dotenv.dart';

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    return web;
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    appId: '1:xxxxxxxxxx:android:xxxxxxxxxxxxxxxx',
    messagingSenderId: 'xxxxxxxxxx',
    projectId: 'lingolive-ia-f5778',
    databaseURL: 'https://lingolive-ia-f5778.firebaseio.com',
    storageBucket: 'lingolive-ia-f5778.appspot.com',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    appId: '1:xxxxxxxxxx:ios:xxxxxxxxxxxxxxxx',
    messagingSenderId: 'xxxxxxxxxx',
    projectId: 'lingolive-ia-f5778',
    databaseURL: 'https://lingolive-ia-f5778.firebaseio.com',
    storageBucket: 'lingolive-ia-f5778.appspot.com',
    iosBundleId: 'com.lingolive.mobile',
  );

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    appId: '1:xxxxxxxxxx:web:xxxxxxxxxxxxxxxx',
    messagingSenderId: 'xxxxxxxxxx',
    projectId: 'lingolive-ia-f5778',
    databaseURL: 'https://lingolive-ia-f5778.firebaseio.com',
    storageBucket: 'lingolive-ia-f5778.appspot.com',
    authDomain: 'lingolive-ia-f5778.firebaseapp.com',
  );
}
