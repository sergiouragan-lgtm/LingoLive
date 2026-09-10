import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';

import 'app/lingolive_app.dart';
import 'core/firebase/firebase_bootstrap.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  FirebaseException? startupError;
  try {
    await FirebaseBootstrap.initialize();
  } on FirebaseException catch (error) {
    startupError = error;
  }
  runApp(LingoLiveApp(startupError: startupError));
}
