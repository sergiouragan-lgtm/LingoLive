import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

class EmailVerificationScreen extends StatefulWidget {
  final User user;
  const EmailVerificationScreen({super.key, required this.user});

  @override
  State<EmailVerificationScreen> createState() =>
      _EmailVerificationScreenState();
}

class _EmailVerificationScreenState extends State<EmailVerificationScreen> {
  bool _busy = false;
  String? _message;

  Future<void> _refresh() async {
    setState(() {
      _busy = true;
      _message = null;
    });
    try {
      await widget.user.reload();
      await FirebaseAuth.instance.currentUser?.getIdToken(true);
      if (mounted &&
          !(FirebaseAuth.instance.currentUser?.emailVerified ?? false)) {
        setState(() => _message = 'A confirmação ainda não foi detetada.');
      }
    } catch (_) {
      if (mounted)
        setState(() => _message = 'Não foi possível atualizar o estado.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _resend() async {
    setState(() {
      _busy = true;
      _message = null;
    });
    try {
      await widget.user.sendEmailVerification();
      if (mounted)
        setState(() => _message = 'Novo e-mail de verificação enviado.');
    } on FirebaseAuthException catch (error) {
      if (mounted)
        setState(() => _message = error.code == 'too-many-requests'
            ? 'Aguarde antes de pedir um novo envio.'
            : 'Não foi possível reenviar o e-mail.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 420),
                child: Column(children: [
                  Icon(Icons.mark_email_unread_outlined,
                      size: 68, color: Theme.of(context).colorScheme.primary),
                  const SizedBox(height: 24),
                  Text('Confirme o seu e-mail',
                      style: Theme.of(context)
                          .textTheme
                          .headlineSmall
                          ?.copyWith(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 10),
                  Text(
                      'Enviámos uma ligação para ${widget.user.email ?? 'o seu endereço'}. Confirme-a antes de aceder à aprendizagem.',
                      textAlign: TextAlign.center),
                  if (_message != null)
                    Padding(
                        padding: const EdgeInsets.only(top: 16),
                        child: Text(_message!, textAlign: TextAlign.center)),
                  const SizedBox(height: 24),
                  SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                          onPressed: _busy ? null : _refresh,
                          child:
                              Text(_busy ? 'A verificar…' : 'Já confirmei'))),
                  TextButton(
                      onPressed: _busy ? null : _resend,
                      child: const Text('Reenviar e-mail')),
                  TextButton(
                      onPressed: _busy ? null : FirebaseAuth.instance.signOut,
                      child: const Text('Terminar sessão')),
                ]),
              ),
            ),
          ),
        ),
      );
}
