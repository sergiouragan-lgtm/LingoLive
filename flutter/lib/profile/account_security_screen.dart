import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

class AccountSecurityScreen extends StatefulWidget {
  final User user;
  const AccountSecurityScreen({super.key, required this.user});
  @override
  State<AccountSecurityScreen> createState() => _AccountSecurityScreenState();
}

class _AccountSecurityScreenState extends State<AccountSecurityScreen> {
  bool _busy = false;
  Future<void> _resetPassword() async {
    final email = widget.user.email;
    if (email == null) return;
    setState(() => _busy = true);
    try {
      await FirebaseAuth.instance.sendPasswordResetEmail(email: email);
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('E-mail de alteração de palavra-passe enviado.')));
    } on FirebaseAuthException {
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Não foi possível enviar o e-mail.')));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Conta e autenticação')),
        body: SafeArea(
            child: ListView(padding: const EdgeInsets.all(20), children: [
          ListTile(
              leading: const Icon(Icons.email_outlined),
              title: const Text('E-mail'),
              subtitle: Text(widget.user.email ?? 'Não disponível')),
          ListTile(
              leading: const Icon(Icons.verified_user_outlined),
              title: const Text('Verificação'),
              subtitle: Text(widget.user.emailVerified
                  ? 'E-mail verificado'
                  : 'Verificação pendente')),
          const Divider(),
          FilledButton.icon(
              onPressed:
                  _busy || widget.user.email == null ? null : _resetPassword,
              icon: const Icon(Icons.password),
              label: Text(_busy ? 'A enviar…' : 'Alterar palavra-passe')),
          const SizedBox(height: 8),
          OutlinedButton.icon(
              onPressed: FirebaseAuth.instance.signOut,
              icon: const Icon(Icons.logout),
              label: const Text('Terminar sessão')),
        ])),
      );
}
