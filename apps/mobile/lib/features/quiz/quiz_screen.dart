import 'package:flutter/material.dart';

import '../../core/api_client.dart';
import '../../core/crash_reporter.dart';
import '../../core/theme.dart';
import '../../data/learning_repository.dart';
import '../../models/learning_models.dart';

/// Quiz mobile.
///
/// O ecrã nunca conhece a resposta correta antes da submissão: as questões
/// chegam sem gabarito e a correção vem de `/api/mobile/quiz/submit`.
class QuizScreen extends StatefulWidget {
  const QuizScreen({
    super.key,
    required this.repository,
    required this.quizId,
    required this.onCompleted,
  });

  final LearningRepository repository;
  final String quizId;

  /// Chamado depois de uma submissão bem-sucedida, para o dashboard recarregar.
  final VoidCallback onCompleted;

  @override
  State<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends State<QuizScreen> {
  late Future<MobileQuiz> _quizFuture;
  final Map<String, String> _answers = <String, String>{};

  /// Um controlador por questão de resposta livre, mantido entre reconstruções
  /// para não perder o texto nem a posição do cursor.
  final Map<String, TextEditingController> _textControllers =
      <String, TextEditingController>{};

  /// Identificador estável da tentativa: reenviar após uma falha de rede
  /// resolve-se no servidor como a mesma tentativa, sem XP duplicado.
  late final String _attemptId =
      'attempt_${DateTime.now().toUtc().millisecondsSinceEpoch}';

  int _index = 0;
  bool _submitting = false;
  QuizResult? _result;
  String? _error;

  @override
  void initState() {
    super.initState();
    _quizFuture = widget.repository.loadQuiz(widget.quizId);
  }

  @override
  void dispose() {
    for (final controller in _textControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  TextEditingController _controllerFor(String questionId) =>
      _textControllers.putIfAbsent(
        questionId,
        () => TextEditingController(text: _answers[questionId] ?? ''),
      );

  Future<void> _submit(MobileQuiz quiz) async {
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      final result = await widget.repository.submitQuiz(
        quizId: quiz.id,
        answers: _answers,
        attemptId: _attemptId,
      );
      if (!mounted) return;
      setState(() => _result = result);
      widget.onCompleted();
    } on ApiException catch (error, stack) {
      await CrashReporter.recordHandled(
        error,
        stack,
        reason: 'submissão de quiz',
      );
      if (!mounted) return;
      setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Quiz')),
      body: FutureBuilder<MobileQuiz>(
        future: _quizFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            final api = snapshot.error;
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  api is ApiException
                      ? api.message
                      : 'Não foi possível carregar este quiz.',
                  textAlign: TextAlign.center,
                ),
              ),
            );
          }

          final quiz = snapshot.data!;
          if (_result != null) {
            return _QuizResultView(result: _result!, quiz: quiz);
          }
          return _buildQuestion(quiz);
        },
      ),
    );
  }

  Widget _buildQuestion(MobileQuiz quiz) {
    final question = quiz.questions[_index];
    final selected = _answers[question.id];
    final isLast = _index == quiz.questions.length - 1;
    final options =
        question.type == 'true-false' && question.options.isEmpty
            ? const ['Verdadeiro', 'Falso']
            : question.options;

    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          LinearProgressIndicator(
            value: (_index + 1) / quiz.questions.length,
            backgroundColor: LingoColors.surface,
          ),
          const SizedBox(height: 8),
          Text(
            'Pergunta ${_index + 1} de ${quiz.questions.length}',
            style: const TextStyle(
              color: LingoColors.textSecondary,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 20),
          Text(
            question.instruction,
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 20),
          Expanded(
            child:
                options.isEmpty
                    ? TextField(
                      decoration: const InputDecoration(
                        labelText: 'A tua resposta',
                        border: OutlineInputBorder(),
                      ),
                      controller: _controllerFor(question.id),
                      // `setState` é necessário para reavaliar se o botão
                      // "Seguinte" pode ficar ativo.
                      onChanged:
                          (value) =>
                              setState(() => _answers[question.id] = value),
                    )
                    : ListView(
                      children: options
                          .map(
                            (option) => RadioListTile<String>(
                              value: option,
                              groupValue: selected,
                              title: Text(option),
                              onChanged:
                                  (value) => setState(
                                    () => _answers[question.id] = value ?? '',
                                  ),
                            ),
                          )
                          .toList(growable: false),
                    ),
          ),
          if (_error != null) ...[
            Text(_error!, style: const TextStyle(color: LingoColors.danger)),
            const SizedBox(height: 8),
          ],
          Row(
            children: [
              if (_index > 0)
                TextButton(
                  onPressed:
                      _submitting ? null : () => setState(() => _index -= 1),
                  child: const Text('Anterior'),
                ),
              const Spacer(),
              FilledButton(
                onPressed:
                    _submitting || (_answers[question.id] ?? '').isEmpty
                        ? null
                        : () {
                          if (isLast) {
                            _submit(quiz);
                          } else {
                            setState(() => _index += 1);
                          }
                        },
                child:
                    _submitting
                        ? const SizedBox(
                          height: 18,
                          width: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                        : Text(isLast ? 'Submeter' : 'Seguinte'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _QuizResultView extends StatelessWidget {
  const _QuizResultView({required this.result, required this.quiz});

  final QuizResult result;
  final MobileQuiz quiz;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Icon(
                  result.passed ? Icons.verified : Icons.refresh,
                  size: 48,
                  color:
                      result.passed ? LingoColors.success : LingoColors.danger,
                ),
                const SizedBox(height: 12),
                Text(
                  '${result.scorePercent}%',
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                Text(
                  result.passed
                      ? 'Aprovado (mínimo ${quiz.passingScorePercent}%)'
                      : 'Abaixo do mínimo de ${quiz.passingScorePercent}%',
                ),
                const SizedBox(height: 8),
                Text(
                  result.duplicated
                      ? 'Tentativa já registada — sem XP adicional.'
                      : '+${result.awardedXp} XP atribuídos',
                  style: const TextStyle(color: LingoColors.accent),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 8),
        ...result.questions.map(
          (question) => Card(
            child: ListTile(
              leading: Icon(
                question.correct ? Icons.check_circle : Icons.cancel,
                color:
                    question.correct ? LingoColors.success : LingoColors.danger,
              ),
              title: Text(
                question.prompt,
                style: const TextStyle(fontSize: 14),
              ),
              subtitle: Text(
                question.correct
                    ? 'Resposta: ${question.given}'
                    : 'A tua resposta: ${question.given.isEmpty ? '(vazia)' : question.given}\n'
                        'Correta: ${question.expected}',
                style: const TextStyle(fontSize: 12),
              ),
              isThreeLine: !question.correct,
            ),
          ),
        ),
        const SizedBox(height: 16),
        FilledButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Voltar às atividades'),
        ),
      ],
    );
  }
}
