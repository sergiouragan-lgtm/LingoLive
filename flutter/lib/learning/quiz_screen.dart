import 'package:flutter/material.dart';
import 'learning_repository.dart';

class QuizScreen extends StatefulWidget {
  final String language;
  const QuizScreen({super.key, required this.language});
  @override
  State<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends State<QuizScreen> {
  final _repository = LearningRepository();
  QuizSession? _session;
  QuizResult? _result;
  final List<int> _answers = [];
  DateTime? _startedAt;
  int _index = 0;
  bool _busy = false;
  String? _error;

  Future<void> _start() async {
    setState(() {
      _busy = true;
      _error = null;
      _result = null;
    });
    try {
      final session = await _repository.generateQuiz(language: widget.language);
      if (!mounted) return;
      setState(() {
        _session = session;
        _answers.clear();
        _index = 0;
        _startedAt = DateTime.now();
      });
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _answer(int answer) async {
    _answers.add(answer);
    final session = _session!;
    if (_index < session.questions.length - 1) {
      setState(() => _index++);
      return;
    }
    setState(() => _busy = true);
    try {
      final duration =
          DateTime.now().difference(_startedAt!).inMilliseconds / 60000;
      final result = await _repository.submitQuiz(
          session.id, List.unmodifiable(_answers), duration);
      if (mounted) setState(() => _result = result);
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final session = _session;
    return Scaffold(
      appBar: AppBar(title: const Text('Quiz adaptativo')),
      body: SafeArea(
          child: Padding(
              padding: const EdgeInsets.all(20),
              child: _result != null
                  ? _resultView()
                  : session == null
                      ? _startView()
                      : _questionView(session))),
    );
  }

  Widget _startView() =>
      Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        const Spacer(),
        Icon(Icons.auto_awesome_outlined,
            size: 72, color: Theme.of(context).colorScheme.primary),
        const SizedBox(height: 20),
        Text('Quiz criado para o seu percurso',
            textAlign: TextAlign.center,
            style: Theme.of(context)
                .textTheme
                .headlineSmall
                ?.copyWith(fontWeight: FontWeight.w800)),
        const SizedBox(height: 10),
        Text(
            'Idioma: ${widget.language}. As perguntas são geradas a partir da memória e do progresso reais.',
            textAlign: TextAlign.center),
        if (_error != null)
          Padding(
              padding: const EdgeInsets.only(top: 16),
              child: Text(_error!,
                  textAlign: TextAlign.center,
                  style:
                      TextStyle(color: Theme.of(context).colorScheme.error))),
        const Spacer(),
        FilledButton(
            onPressed: _busy ? null : _start,
            child: Text(_busy ? 'A preparar…' : 'Criar quiz')),
      ]);

  Widget _questionView(QuizSession session) {
    final question = session.questions[_index];
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      LinearProgressIndicator(value: (_index + 1) / session.questions.length),
      const SizedBox(height: 14),
      Text('Pergunta ${_index + 1} de ${session.questions.length}',
          style: Theme.of(context).textTheme.labelLarge),
      const SizedBox(height: 28),
      Text(question.question,
          style: Theme.of(context)
              .textTheme
              .headlineSmall
              ?.copyWith(fontWeight: FontWeight.w800)),
      const SizedBox(height: 28),
      ...question.options.asMap().entries.map(
            (entry) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: OutlinedButton(
                    onPressed: _busy ? null : () => _answer(entry.key),
                    child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        child: Align(
                            alignment: Alignment.centerLeft,
                            child: Text(entry.value))))),
          ),
      if (_busy)
        const Padding(
            padding: EdgeInsets.only(top: 12),
            child: Center(child: CircularProgressIndicator())),
      if (_error != null)
        Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Text(_error!,
                style: TextStyle(color: Theme.of(context).colorScheme.error))),
    ]);
  }

  Widget _resultView() {
    final result = _result!;
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      const Spacer(),
      Icon(Icons.verified_outlined,
          size: 72, color: Theme.of(context).colorScheme.primary),
      const SizedBox(height: 18),
      Text('${result.score}%',
          textAlign: TextAlign.center,
          style: Theme.of(context)
              .textTheme
              .displayMedium
              ?.copyWith(fontWeight: FontWeight.w900)),
      Text(
          '${result.correctAnswers} de ${result.totalQuestions} respostas corretas',
          textAlign: TextAlign.center),
      const SizedBox(height: 16),
      Text(
          result.duplicate
              ? 'Tentativa já certificada — nenhum XP duplicado.'
              : '+${result.xpAwarded} XP · Total ${result.newTotalXp} XP',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.titleMedium),
      const Spacer(),
      FilledButton(onPressed: _start, child: const Text('Novo quiz')),
    ]);
  }
}
