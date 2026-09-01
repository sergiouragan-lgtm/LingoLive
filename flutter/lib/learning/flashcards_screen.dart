import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'learning_repository.dart';

class FlashcardsScreen extends StatefulWidget {
  const FlashcardsScreen({super.key});
  @override
  State<FlashcardsScreen> createState() => _FlashcardsScreenState();
}

class _FlashcardsScreenState extends State<FlashcardsScreen> {
  final _repository = LearningRepository();
  List<SavedWord> _cards = const [];
  final List<Map<String, String>> _ratings = [];
  int _index = 0;
  bool _revealed = false, _busy = true, _completed = false;
  String? _error, _completionMessage;
  late final String _sessionId;
  late final DateTime _startedAt;

  @override
  void initState() {
    super.initState();
    _sessionId = 'mobile_${DateTime.now().microsecondsSinceEpoch}';
    _startedAt = DateTime.now();
    _load();
  }

  Future<void> _load() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) throw const LearningApiException('Sessão expirada.');
      final cards = await _repository.loadSavedWords(user.uid);
      if (mounted) setState(() => _cards = cards);
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _rate(String rating) async {
    final card = _cards[_index];
    _ratings.add({'cardId': card.id, 'word': card.word, 'rating': rating});
    if (_index < _cards.length - 1) {
      setState(() {
        _index++;
        _revealed = false;
      });
      return;
    }
    setState(() => _busy = true);
    try {
      final result = await _repository.completeFlashcards(
          sessionId: _sessionId,
          language: card.language.isEmpty ? 'unknown' : card.language,
          durationMinutes:
              DateTime.now().difference(_startedAt).inMilliseconds / 60000,
          ratings: List.unmodifiable(_ratings));
      final duplicate = result['duplicate'] == true;
      if (mounted)
        setState(() {
          _completed = true;
          _completionMessage = duplicate
              ? 'Revisão já certificada — nenhum XP duplicado.'
              : '+${result['xpAwarded'] ?? 0} XP · Total ${result['newTotalXp'] ?? 0} XP';
        });
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
      appBar: AppBar(title: const Text('Flashcards')),
      body: SafeArea(
          child: Padding(padding: const EdgeInsets.all(20), child: _body())));
  Widget _body() {
    if (_busy) return const Center(child: CircularProgressIndicator());
    if (_error != null)
      return Center(
          child: Text(_error!,
              textAlign: TextAlign.center,
              style: TextStyle(color: Theme.of(context).colorScheme.error)));
    if (_cards.isEmpty)
      return const Center(
          child: Text(
              'Ainda não existem palavras reais guardadas para revisão.',
              textAlign: TextAlign.center));
    if (_completed)
      return Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
        const Icon(Icons.check_circle_outline, size: 72),
        const SizedBox(height: 16),
        const Text('Revisão concluída'),
        const SizedBox(height: 8),
        Text(_completionMessage ?? '')
      ]));
    final card = _cards[_index];
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Text('${_index + 1} / ${_cards.length}', textAlign: TextAlign.center),
      const SizedBox(height: 20),
      Expanded(
          child: InkWell(
              onTap: () => setState(() => _revealed = true),
              borderRadius: BorderRadius.circular(24),
              child: Card(
                  child: Padding(
                      padding: const EdgeInsets.all(28),
                      child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(card.word,
                                textAlign: TextAlign.center,
                                style: Theme.of(context)
                                    .textTheme
                                    .headlineMedium
                                    ?.copyWith(fontWeight: FontWeight.w900)),
                            if (card.pronunciation.isNotEmpty) ...[
                              const SizedBox(height: 8),
                              Text(card.pronunciation)
                            ],
                            const SizedBox(height: 28),
                            Text(
                                _revealed ? card.meaning : 'Toque para revelar',
                                textAlign: TextAlign.center,
                                style: Theme.of(context).textTheme.titleLarge),
                          ]))))),
      const SizedBox(height: 16),
      if (_revealed)
        Row(children: [
          Expanded(
              child: OutlinedButton(
                  onPressed: () => _rate('learning'),
                  child: const Text('Rever'))),
          const SizedBox(width: 12),
          Expanded(
              child: FilledButton(
                  onPressed: () => _rate('known'),
                  child: const Text('Conheço')))
        ]),
    ]);
  }
}
