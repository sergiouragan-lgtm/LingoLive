import 'dart:io';

import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';

import '../../core/api_client.dart';
import '../../core/crash_reporter.dart';
import '../../core/theme.dart';
import '../../data/learning_repository.dart';
import '../../models/learning_models.dart';

/// Prática de pronúncia com gravação real do microfone.
///
/// O áudio é enviado para `/api/pronunciation/evaluate`, que corre Whisper ou
/// Gemini. Nenhuma pontuação é estimada no dispositivo: quando o avaliador está
/// indisponível o servidor devolve 503 e mostramos isso ao utilizador.
class PronunciationScreen extends StatefulWidget {
  const PronunciationScreen({
    super.key,
    required this.repository,
    required this.targetText,
    required this.language,
    required this.onCompleted,
  });

  final LearningRepository repository;
  final String targetText;
  final String? language;
  final VoidCallback onCompleted;

  @override
  State<PronunciationScreen> createState() => _PronunciationScreenState();
}

class _PronunciationScreenState extends State<PronunciationScreen> {
  final AudioRecorder _recorder = AudioRecorder();

  bool _recording = false;
  bool _evaluating = false;
  String? _error;
  PronunciationEvaluation? _evaluation;

  @override
  void dispose() {
    _recorder.dispose();
    super.dispose();
  }

  Future<void> _startRecording() async {
    if (!await _recorder.hasPermission()) {
      setState(() => _error = 'Permissão de microfone recusada.');
      return;
    }
    final directory = await getTemporaryDirectory();
    final path =
        '${directory.path}/pronunciation_${DateTime.now().millisecondsSinceEpoch}.m4a';

    await _recorder.start(
      const RecordConfig(encoder: AudioEncoder.aacLc, sampleRate: 16000),
      path: path,
    );
    setState(() {
      _recording = true;
      _error = null;
      _evaluation = null;
    });
  }

  Future<void> _stopAndEvaluate() async {
    final path = await _recorder.stop();
    setState(() {
      _recording = false;
      _evaluating = true;
    });

    if (path == null) {
      setState(() {
        _evaluating = false;
        _error = 'A gravação não produziu áudio.';
      });
      return;
    }

    try {
      final bytes = await File(path).readAsBytes();
      final evaluation = await widget.repository.evaluatePronunciation(
        targetText: widget.targetText,
        audioBytes: bytes,
        mimeType: 'audio/m4a',
        language: widget.language,
      );
      if (!mounted) return;
      setState(() => _evaluation = evaluation);
      widget.onCompleted();
    } on ApiException catch (error, stack) {
      await CrashReporter.recordHandled(
        error,
        stack,
        reason: 'avaliação de pronúncia',
      );
      if (!mounted) return;
      setState(() => _error = error.message);
    } finally {
      // O ficheiro temporário contém voz do utilizador: apagamos assim que o
      // upload termina, independentemente do resultado.
      await File(path).delete().catchError((_) => File(path));
      if (mounted) setState(() => _evaluating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Pronúncia')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Lê em voz alta',
                    style: TextStyle(
                      color: LingoColors.textSecondary,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    widget.targetText,
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          Center(
            child: FilledButton.icon(
              onPressed:
                  _evaluating
                      ? null
                      : (_recording ? _stopAndEvaluate : _startRecording),
              icon: Icon(_recording ? Icons.stop : Icons.mic),
              label: Text(
                _evaluating
                    ? 'A avaliar…'
                    : _recording
                    ? 'Parar e avaliar'
                    : 'Gravar',
              ),
              style: FilledButton.styleFrom(
                backgroundColor:
                    _recording ? LingoColors.danger : LingoColors.primary,
              ),
            ),
          ),
          if (_error != null) ...[
            const SizedBox(height: 16),
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: const TextStyle(color: LingoColors.danger),
            ),
          ],
          if (_evaluation != null) ...[
            const SizedBox(height: 20),
            _EvaluationCard(evaluation: _evaluation!),
          ],
        ],
      ),
    );
  }
}

class _EvaluationCard extends StatelessWidget {
  const _EvaluationCard({required this.evaluation});

  final PronunciationEvaluation evaluation;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _Score(label: 'Global', value: evaluation.overallScore),
                _Score(label: 'Precisão', value: evaluation.accuracyScore),
                _Score(label: 'Fluência', value: evaluation.fluencyScore),
              ],
            ),
            const Divider(height: 28),
            const Text('Transcrição', style: TextStyle(fontSize: 12)),
            const SizedBox(height: 4),
            Text(
              '"${evaluation.transcription}"',
              style: const TextStyle(fontStyle: FontStyle.italic),
            ),
            const SizedBox(height: 16),
            Text(
              evaluation.generalFeedback,
              style: const TextStyle(fontSize: 13),
            ),
            if (evaluation.improvementTips.isNotEmpty) ...[
              const SizedBox(height: 16),
              const Text('Como melhorar', style: TextStyle(fontSize: 12)),
              const SizedBox(height: 6),
              ...evaluation.improvementTips.map(
                (tip) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('• '),
                      Expanded(
                        child: Text(tip, style: const TextStyle(fontSize: 13)),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _Score extends StatelessWidget {
  const _Score({required this.label, required this.value});

  final String label;
  final int value;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          '$value',
          style: Theme.of(
            context,
          ).textTheme.headlineSmall?.copyWith(color: LingoColors.accent),
        ),
        Text(label, style: const TextStyle(fontSize: 11)),
      ],
    );
  }
}
