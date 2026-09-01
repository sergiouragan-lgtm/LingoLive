import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../firebase_services.dart';

class StudyPreferencesScreen extends StatefulWidget {
  final User user;

  const StudyPreferencesScreen({super.key, required this.user});

  @override
  State<StudyPreferencesScreen> createState() => _StudyPreferencesScreenState();
}

class _StudyPreferencesScreenState extends State<StudyPreferencesScreen> {
  static const _goals = ['Conversação', 'Trabalho', 'Viagens', 'Exames'];
  static const _frequencies = <int, String>{
    1: '1 dia por semana',
    3: '3 dias por semana',
    5: '5 dias por semana',
    7: 'Todos os dias'
  };
  String? _learningGoal;
  int? _studyFrequency;
  double _dailyGoal = 15;
  bool _loading = true;
  bool _saving = false;
  String? _error;

  DocumentReference<Map<String, dynamic>> get _reference =>
      FirebaseServices.firestore.collection('users').doc(widget.user.uid);

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = (await _reference.get()).data();
      if (data != null) {
        final goal = data['learningGoal'] as String?;
        final frequency = data['studyFrequency'];
        _learningGoal = _goals.contains(goal) ? goal : null;
        _studyFrequency =
            frequency is num && _frequencies.containsKey(frequency.toInt())
                ? frequency.toInt()
                : null;
        final minutes = data['dailyGoal'];
        if (minutes is num && minutes >= 5 && minutes <= 120)
          _dailyGoal = minutes.toDouble();
      }
    } catch (_) {
      _error = 'Não foi possível carregar as preferências.';
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _save() async {
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await _reference.set({
        'learningGoal': _learningGoal,
        'studyFrequency': _studyFrequency,
        'dailyGoal': _dailyGoal.round(),
        'updatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Preferências guardadas.')));
    } catch (_) {
      if (mounted)
        setState(() => _error = 'Não foi possível guardar as preferências.');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading)
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    return Scaffold(
      appBar: AppBar(title: const Text('Preferências de estudo')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            DropdownButtonFormField<String>(
              initialValue: _learningGoal,
              decoration: const InputDecoration(
                  labelText: 'Objetivo de aprendizagem',
                  border: OutlineInputBorder()),
              items: _goals
                  .map((value) =>
                      DropdownMenuItem(value: value, child: Text(value)))
                  .toList(),
              onChanged: (value) => setState(() => _learningGoal = value),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<int>(
              initialValue: _studyFrequency,
              decoration: const InputDecoration(
                  labelText: 'Frequência de estudo',
                  border: OutlineInputBorder()),
              items: _frequencies.entries
                  .map((entry) => DropdownMenuItem(
                      value: entry.key, child: Text(entry.value)))
                  .toList(),
              onChanged: (value) => setState(() => _studyFrequency = value),
            ),
            const SizedBox(height: 24),
            Text('Meta diária: ${_dailyGoal.round()} minutos',
                style: Theme.of(context).textTheme.titleMedium),
            Slider(
                value: _dailyGoal,
                min: 5,
                max: 120,
                divisions: 23,
                label: '${_dailyGoal.round()} min',
                onChanged: (value) => setState(() => _dailyGoal = value)),
            if (_error != null)
              Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: Text(_error!,
                      style: TextStyle(
                          color: Theme.of(context).colorScheme.error))),
            const SizedBox(height: 20),
            FilledButton(
                onPressed: _saving ? null : _save,
                child: Text(_saving ? 'A guardar…' : 'Guardar preferências')),
          ],
        ),
      ),
    );
  }
}
