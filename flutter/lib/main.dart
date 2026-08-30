import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'auth/auth_gate.dart';
import 'firebase_options.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  runApp(const LingoLiveApp());
}

class LingoLiveApp extends StatelessWidget {
  const LingoLiveApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LingoLIVE',
      debugShowCheckedModeBanner: false,
      themeMode: ThemeMode.system,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF278A78)),
        scaffoldBackgroundColor: const Color(0xFFF8F6F0),
        useMaterial3: true,
      ),
      darkTheme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF714BFF), brightness: Brightness.dark),
        scaffoldBackgroundColor: const Color(0xFF02051B),
        useMaterial3: true,
      ),
      home: const AuthGate(),
    );
  }
}
