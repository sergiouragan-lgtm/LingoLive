import 'dart:async';
import 'dart:typed_data';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:record/record.dart';

import 'learning_repository.dart';

class PronunciationScreen extends StatefulWidget {
  const PronunciationScreen({super.key});
  @override
  State<PronunciationScreen> createState() => _PronunciationScreenState();
}

class _PronunciationScreenState extends State<PronunciationScreen> {
  final _repository = LearningRepository();
  final _recorder = AudioRecorder();
  final List<int> _audio = [];
  List<SavedWord> _phrases = const [];
  SavedWord? _selected;
  StreamSubscription<Uint8List>? _recording;
  DateTime? _startedAt;
  bool _busy = true, _recordingNow = false;
  String? _error;
  Map<String, dynamic>? _result;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) throw const LearningApiException('Sessão expirada.');
      final phrases = await _repository.loadSavedWords(user.uid);
      if (mounted)
        setState(() {
          _phrases = phrases;
          _selected = phrases.isEmpty ? null : phrases.first;
        });
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _start() async {
    if (!await _recorder.hasPermission()) {
      setState(() => _error = 'A permissão do microfone é necessária.');
      return;
    }
    _audio.clear();
    _result = null;
    _error = null;
    final stream = await _recorder.startStream(const RecordConfig(
        encoder: AudioEncoder.wav, sampleRate: 16000, numChannels: 1));
    _recording = stream.listen(_audio.addAll);
    setState(() {
      _recordingNow = true;
      _startedAt = DateTime.now();
    });
  }

  Future<void> _stopAndEvaluate() async {
    setState(() {
      _busy = true;
      _recordingNow = false;
    });
    try {
      await _recorder.stop();
      await _recording?.cancel();
      final phrase = _selected;
      if (phrase == null || _audio.isEmpty)
        throw const LearningApiException('Não foi possível captar o áudio.');
      final attemptId = 'mobile_${DateTime.now().microsecondsSinceEpoch}';
      final result = await _repository.evaluatePronunciation(
          attemptId: attemptId,
          targetText: phrase.word,
          language: phrase.language.isEmpty ? 'unknown' : phrase.language,
          audio: Uint8List.fromList(_audio),
          durationMinutes:
              DateTime.now().difference(_startedAt!).inMilliseconds / 60000);
      if (mounted) setState(() => _result = result);
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  void dispose() {
    _recording?.cancel();
    _recorder.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
      appBar: AppBar(title: const Text('Pronúncia')),
      body: SafeArea(
          child: Padding(padding: const EdgeInsets.all(20), child: _body())));
  Widget _body() {
    if (_busy) return const Center(child: CircularProgressIndicator());
    if (_phrases.isEmpty)
      return const Center(
          child: Text(
              'Guarde primeiro uma palavra ou expressão real para praticar a pronúncia.',
              textAlign: TextAlign.center));
    final result = _result;
    if (result != null)
      return ListView(children: [
        const Icon(Icons.graphic_eq, size: 64),
        const SizedBox(height: 12),
        Text('${result['overallScore'] ?? 0}%',
            textAlign: TextAlign.center,
            style: Theme.of(context)
                .textTheme
                .displayMedium
                ?.copyWith(fontWeight: FontWeight.w900)),
        Text((result['generalFeedback'] ?? '').toString(),
            textAlign: TextAlign.center),
        const SizedBox(height: 16),
        Text(
            result['duplicate'] == true
                ? 'Tentativa já certificada — nenhum XP duplicado.'
                : '+${result['xpAwarded'] ?? 0} XP · Total ${result['newTotalXp'] ?? 0} XP',
            textAlign: TextAlign.center),
        const SizedBox(height: 24),
        FilledButton(
            onPressed: () => setState(() => _result = null),
            child: const Text('Praticar novamente')),
      ]);
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      DropdownButtonFormField<SavedWord>(
          initialValue: _selected,
          decoration: const InputDecoration(
              labelText: 'Expressão guardada', border: OutlineInputBorder()),
          items: _phrases
              .map((word) => DropdownMenuItem(
                  value: word,
                  child: Text(word.word, overflow: TextOverflow.ellipsis)))
              .toList(),
          onChanged: _recordingNow
              ? null
              : (value) => setState(() => _selected = value)),
      const Spacer(),
      Text(_selected!.word,
          textAlign: TextAlign.center,
          style: Theme.of(context)
              .textTheme
              .headlineMedium
              ?.copyWith(fontWeight: FontWeight.w900)),
      if (_selected!.pronunciation.isNotEmpty)
        Text(_selected!.pronunciation, textAlign: TextAlign.center),
      const SizedBox(height: 28),
      Icon(_recordingNow ? Icons.mic : Icons.mic_none,
          size: 72,
          color: _recordingNow
              ? Theme.of(context).colorScheme.error
              : Theme.of(context).colorScheme.primary),
      if (_error != null)
        Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Text(_error!,
                textAlign: TextAlign.center,
                style: TextStyle(color: Theme.of(context).colorScheme.error))),
      const Spacer(),
      FilledButton(
          onPressed: _recordingNow ? _stopAndEvaluate : _start,
          child:
              Text(_recordingNow ? 'Terminar e avaliar' : 'Começar gravação')),
    ]);
  }
}
