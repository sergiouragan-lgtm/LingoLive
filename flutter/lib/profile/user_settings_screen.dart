import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../firebase_services.dart';

class NotificationSettingsScreen extends StatelessWidget {
  final User user;
  const NotificationSettingsScreen({super.key, required this.user});
  @override
  Widget build(BuildContext context) => _Settings(user: user, documentId: 'notifications', title: 'Notificações', labels: const {'studyReminders': 'Lembretes de estudo', 'progressUpdates': 'Atualizações de progresso', 'productUpdates': 'Novidades do produto'});
}

class AccessibilitySettingsScreen extends StatelessWidget {
  final User user;
  const AccessibilitySettingsScreen({super.key, required this.user});
  @override
  Widget build(BuildContext context) => _Settings(user: user, documentId: 'accessibility', title: 'Acessibilidade e aparência', labels: const {'largeText': 'Texto ampliado', 'highContrast': 'Contraste reforçado', 'reduceMotion': 'Reduzir movimento', 'followSystemTheme': 'Seguir tema do sistema'});
}

class _Settings extends StatefulWidget {
  final User user;
  final String documentId;
  final String title;
  final Map<String, String> labels;
  const _Settings({required this.user, required this.documentId, required this.title, required this.labels});
  @override
  State<_Settings> createState() => _SettingsState();
}

class _SettingsState extends State<_Settings> {
  final Map<String, bool> _values = {};
  bool _loading = true, _saving = false;
  DocumentReference<Map<String, dynamic>> get _ref => FirebaseServices.firestore.collection('users').doc(widget.user.uid).collection('settings').doc(widget.documentId);
  @override
  void initState() { super.initState(); _load(); }
  Future<void> _load() async {
    try {
      final data = (await _ref.get()).data() ?? const <String, dynamic>{};
      for (final key in widget.labels.keys) { _values[key] = data[key] as bool? ?? false; }
    } finally { if (mounted) setState(() => _loading = false); }
  }
  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await _ref.set({..._values, 'updatedAt': FieldValue.serverTimestamp()}, SetOptions(merge: true));
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Definições guardadas.')));
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Não foi possível guardar.')));
    } finally { if (mounted) setState(() => _saving = false); }
  }
  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    return Scaffold(appBar: AppBar(title: Text(widget.title)), body: SafeArea(child: ListView(padding: const EdgeInsets.all(20), children: [
      Card(child: Column(children: widget.labels.entries.map((entry) => SwitchListTile(title: Text(entry.value), value: _values[entry.key] ?? false, onChanged: (value) => setState(() => _values[entry.key] = value))).toList())),
      const SizedBox(height: 16), FilledButton(onPressed: _saving ? null : _save, child: Text(_saving ? 'A guardar…' : 'Guardar alterações')),
    ])));
  }
}
