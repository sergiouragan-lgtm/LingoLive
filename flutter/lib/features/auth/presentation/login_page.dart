import 'package:flutter/material.dart';

import '../data/firebase_auth_repository.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({required this.repository, super.key});
  final FirebaseAuthRepository repository;
  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final email = TextEditingController();
  final password = TextEditingController();
  String? error;
  bool busy = false;
  Future<void> submit() async {
    setState(() {
      busy = true;
      error = null;
    });
    try {
      await widget.repository.signIn(email.text, password.text);
    } catch (_) {
      if (mounted) {
        setState(
          () => error = 'Não foi possível iniciar sessão. Confirme os dados.',
        );
      }
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  void dispose() {
    email.dispose();
    password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(
      child: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Icon(
                  Icons.language_rounded,
                  size: 56,
                  color: Color(0xFF7C3AED),
                ),
                const SizedBox(height: 16),
                Text(
                  'LingoLive',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.headlineMedium
                      ?.copyWith(fontWeight: FontWeight.w900),
                ),
                const SizedBox(height: 28),
                TextField(
                  controller: email,
                  keyboardType: TextInputType.emailAddress,
                  autofillHints: const [AutofillHints.email],
                  decoration: const InputDecoration(labelText: 'Email'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: password,
                  obscureText: true,
                  autofillHints: const [AutofillHints.password],
                  decoration: const InputDecoration(labelText: 'Palavra-passe'),
                ),
                if (error != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: Semantics(
                      liveRegion: true,
                      child: Text(
                        error!,
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.error,
                        ),
                      ),
                    ),
                  ),
                const SizedBox(height: 18),
                FilledButton(
                  onPressed: busy ? null : submit,
                  child: Text(busy ? 'A entrar…' : 'Entrar'),
                ),
              ],
            ),
          ),
        ),
      ),
    ),
  );
}
