import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../firebase_services.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _register = false;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _busy = true; _error = null; });
    try {
      if (_register) {
        final credential = await FirebaseAuth.instance.createUserWithEmailAndPassword(
          email: _email.text.trim().toLowerCase(),
          password: _password.text,
        );
        final user = credential.user!;
        try {
          await user.updateDisplayName(_name.text.trim());
          await user.sendEmailVerification();
          await FirebaseServices.firestore.collection('users').doc(user.uid).set({
            'uid': user.uid,
            'email': user.email,
            'displayName': _name.text.trim(),
            'role': 'LEARNER',
            'onboardingCompleted': false,
            'createdAt': FieldValue.serverTimestamp(),
            'updatedAt': FieldValue.serverTimestamp(),
          });
        } catch (_) {
          await user.delete().catchError((_) {});
          await FirebaseAuth.instance.signOut();
          rethrow;
        }
      } else {
        await FirebaseAuth.instance.signInWithEmailAndPassword(
          email: _email.text.trim().toLowerCase(),
          password: _password.text,
        );
      }
    } on FirebaseAuthException catch (error) {
      if (!mounted) return;
      setState(() => _error = switch (error.code) {
        'invalid-credential' => 'E-mail ou palavra-passe inválidos.',
        'email-already-in-use' => 'Este e-mail já está registado.',
        'weak-password' => 'Use uma palavra-passe com pelo menos 8 caracteres.',
        _ => 'Não foi possível autenticar. Tente novamente.',
      });
    } catch (_) {
      if (mounted) setState(() => _error = 'Não foi possível concluir a operação.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _resetPassword() async {
    final email = _email.text.trim().toLowerCase();
    if (!email.contains('@')) {
      setState(() => _error = 'Introduza primeiro um e-mail válido.');
      return;
    }
    setState(() { _busy = true; _error = null; });
    try {
      await FirebaseAuth.instance.sendPasswordResetEmail(email: email);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('E-mail de recuperação enviado.')));
    } on FirebaseAuthException {
      if (mounted) setState(() => _error = 'Não foi possível enviar a recuperação.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Icon(Icons.record_voice_over_rounded, size: 58, color: colors.primary),
                    const SizedBox(height: 18),
                    Text('LingoLIVE', textAlign: TextAlign.center, style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w800)),
                    const SizedBox(height: 8),
                    Text(_register ? 'Crie a sua conta de aprendizagem' : 'Continue o seu percurso', textAlign: TextAlign.center),
                    const SizedBox(height: 32),
                    if (_register) TextFormField(controller: _name, textInputAction: TextInputAction.next, decoration: const InputDecoration(labelText: 'Nome', border: OutlineInputBorder()), validator: (value) => (value?.trim().length ?? 0) < 2 ? 'Introduza o seu nome.' : null),
                    if (_register) const SizedBox(height: 14),
                    TextFormField(controller: _email, keyboardType: TextInputType.emailAddress, textInputAction: TextInputAction.next, decoration: const InputDecoration(labelText: 'E-mail', border: OutlineInputBorder()), validator: (value) => !(value?.contains('@') ?? false) ? 'Introduza um e-mail válido.' : null),
                    const SizedBox(height: 14),
                    TextFormField(controller: _password, obscureText: true, onFieldSubmitted: (_) => _submit(), decoration: const InputDecoration(labelText: 'Palavra-passe', border: OutlineInputBorder()), validator: (value) => (value?.length ?? 0) < 8 ? 'Mínimo de 8 caracteres.' : null),
                    if (_error != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(_error!, style: TextStyle(color: colors.error))),
                    const SizedBox(height: 20),
                    FilledButton(onPressed: _busy ? null : _submit, child: Padding(padding: const EdgeInsets.symmetric(vertical: 13), child: _busy ? const SizedBox.square(dimension: 20, child: CircularProgressIndicator(strokeWidth: 2)) : Text(_register ? 'Criar conta' : 'Entrar'))),
                    TextButton(onPressed: _busy ? null : () => setState(() { _register = !_register; _error = null; }), child: Text(_register ? 'Já tenho conta' : 'Criar uma conta')),
                    if (!_register) TextButton(onPressed: _busy ? null : _resetPassword, child: const Text('Recuperar palavra-passe')),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
