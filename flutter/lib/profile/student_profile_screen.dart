import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../firebase_services.dart';

class StudentProfileScreen extends StatefulWidget {
  final User user;

  const StudentProfileScreen({super.key, required this.user});

  @override
  State<StudentProfileScreen> createState() => _StudentProfileScreenState();
}

class _StudentProfileScreenState extends State<StudentProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final _displayName = TextEditingController();
  final _countryCode = TextEditingController();
  final _nativeLanguage = TextEditingController();
  final _learningLanguage = TextEditingController();
  bool _loading = true;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _displayName.dispose();
    _countryCode.dispose();
    _nativeLanguage.dispose();
    _learningLanguage.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final snapshot = await FirebaseServices.firestore
          .collection('users')
          .doc(widget.user.uid)
          .get();
      final data = snapshot.data();
      _displayName.text =
          data?['displayName'] as String? ?? widget.user.displayName ?? '';
      _countryCode.text = data?['countryCode'] as String? ?? '';
      _nativeLanguage.text = data?['nativeLanguage'] as String? ?? '';
      _learningLanguage.text = data?['learningLanguage'] as String? ?? '';
    } catch (_) {
      _error = 'Não foi possível carregar o perfil.';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final name = _displayName.text.trim();
      await FirebaseServices.firestore
          .collection('users')
          .doc(widget.user.uid)
          .update({
        'displayName': name,
        'countryCode': _countryCode.text.trim().toUpperCase(),
        'nativeLanguage': _nativeLanguage.text.trim(),
        'learningLanguage': _learningLanguage.text.trim(),
        'updatedAt': FieldValue.serverTimestamp(),
      });
      await widget.user.updateDisplayName(name);
      if (mounted)
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Perfil atualizado.')));
    } catch (_) {
      if (mounted)
        setState(() => _error = 'Não foi possível guardar o perfil.');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading)
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    return Scaffold(
      appBar: AppBar(title: const Text('Perfil do aluno')),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              TextFormField(
                controller: _displayName,
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(
                    labelText: 'Nome', border: OutlineInputBorder()),
                validator: (value) => (value?.trim().length ?? 0) < 2
                    ? 'Introduza o seu nome.'
                    : null,
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: _countryCode,
                textCapitalization: TextCapitalization.characters,
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(
                    labelText: 'Código do país',
                    hintText: 'AO',
                    border: OutlineInputBorder()),
                validator: (value) {
                  final code = value?.trim() ?? '';
                  return code.isNotEmpty && code.length != 2
                      ? 'Use um código ISO de duas letras.'
                      : null;
                },
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: _nativeLanguage,
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(
                    labelText: 'Idioma nativo', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: _learningLanguage,
                decoration: const InputDecoration(
                    labelText: 'Idioma de aprendizagem',
                    border: OutlineInputBorder()),
              ),
              if (_error != null)
                Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: Text(_error!,
                        style: TextStyle(
                            color: Theme.of(context).colorScheme.error))),
              const SizedBox(height: 20),
              FilledButton(
                  onPressed: _saving ? null : _save,
                  child: Text(_saving ? 'A guardar…' : 'Guardar perfil')),
            ],
          ),
        ),
      ),
    );
  }
}
