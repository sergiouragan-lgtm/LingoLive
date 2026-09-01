import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../firebase_services.dart';

class PrivacyDataScreen extends StatefulWidget {
  final User user;
  const PrivacyDataScreen({super.key, required this.user});
  @override
  State<PrivacyDataScreen> createState() => _PrivacyDataScreenState();
}

class _PrivacyDataScreenState extends State<PrivacyDataScreen> {
  bool _analytics = false, _loading = true, _saving = false;
  DocumentReference<Map<String, dynamic>> get _ref => FirebaseServices.firestore
      .collection('users')
      .doc(widget.user.uid)
      .collection('settings')
      .doc('privacy');
  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      _analytics =
          (await _ref.get()).data()?['analyticsConsent'] as bool? ?? false;
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await _ref.set({
        'analyticsConsent': _analytics,
        'updatedAt': FieldValue.serverTimestamp()
      }, SetOptions(merge: true));
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Preferência guardada.')));
    } catch (_) {
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Não foi possível guardar.')));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading)
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    return Scaffold(
        appBar: AppBar(title: const Text('Privacidade e dados')),
        body: SafeArea(
            child: ListView(padding: const EdgeInsets.all(20), children: [
          SwitchListTile(
              title: const Text('Dados de utilização'),
              subtitle:
                  const Text('Autorizar métricas para melhorar o produto'),
              value: _analytics,
              onChanged: (value) => setState(() => _analytics = value)),
          FilledButton(
              onPressed: _saving ? null : _save,
              child: Text(_saving ? 'A guardar…' : 'Guardar preferência')),
          const SizedBox(height: 28),
          const Text(
              'A exportação e eliminação exigem reautenticação, auditoria e processamento seguro no backend.'),
          const SizedBox(height: 12),
          OutlinedButton.icon(
              onPressed: null,
              icon: const Icon(Icons.download_outlined),
              label: const Text('Exportar dados — indisponível')),
          OutlinedButton.icon(
              onPressed: null,
              icon: const Icon(Icons.delete_forever_outlined),
              label: const Text('Eliminar conta e dados — indisponível')),
        ])));
  }
}
