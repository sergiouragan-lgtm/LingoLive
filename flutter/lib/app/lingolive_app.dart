import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../core/theme/lingolive_theme.dart';
import '../features/auth/data/firebase_auth_repository.dart';
import '../features/auth/presentation/login_page.dart';
import 'app_shell.dart';

class LingoLiveApp extends StatelessWidget {
  const LingoLiveApp({this.startupError, this.authRepository, super.key});
  final FirebaseException? startupError;
  final FirebaseAuthRepository? authRepository;
  @override
  Widget build(BuildContext context) => MaterialApp(
    debugShowCheckedModeBanner: false,
    title: 'LingoLive',
    theme: LingoLiveTheme.light,
    home: startupError == null
        ? _AuthGate(repository: authRepository ?? FirebaseAuthRepository())
        : FirebaseSetupPage(error: startupError!),
  );
}

class _AuthGate extends StatelessWidget {
  const _AuthGate({required this.repository});
  final FirebaseAuthRepository repository;
  @override
  Widget build(BuildContext context) => StreamBuilder<User?>(
    stream: repository.watchUser(),
    initialData: repository.currentUser,
    builder: (context, snapshot) {
      if (snapshot.connectionState == ConnectionState.waiting) {
        return const Scaffold(body: Center(child: CircularProgressIndicator()));
      }
      final user = snapshot.data;
      return user == null
          ? LoginPage(repository: repository)
          : AppShell(uid: user.uid, onSignOut: repository.signOut);
    },
  );
}

class FirebaseSetupPage extends StatelessWidget {
  const FirebaseSetupPage({required this.error, super.key});
  final FirebaseException error;
  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.settings_suggest_outlined, size: 52),
              const SizedBox(height: 12),
              const Text(
                'Configuração Firebase necessária',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 8),
              const Text(
                'Adicione google-services.json e GoogleService-Info.plist para ligar este build ao projeto LingoLive.',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(error.code, style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
        ),
      ),
    ),
  );
}
