import 'package:flutter/material.dart';

import '../../core/api_client.dart';
import '../../core/crash_reporter.dart';
import '../../core/theme.dart';
import '../../data/learning_repository.dart';
import '../../models/learning_models.dart';

/// Sessão de flashcards com repetição espaçada.
///
/// O intervalo e a data da próxima revisão são calculados no servidor (SM-2 em
/// `flashcardSrs.service.ts`); aqui só recolhemos a autoavaliação do utilizador.
class FlashcardsScreen extends StatefulWidget {
  const FlashcardsScreen({
    super.key,
    required this.repository,
    required this.onCompleted,
  });

  final LearningRepository repository;
  final VoidCallback onCompleted;

  @override
  State<FlashcardsScreen> createState() => _FlashcardsScreenState();
}

class _FlashcardsScreenState extends State<FlashcardsScreen> {
  /// Identifica a sessão de estudo. Rever a mesma carta duas vezes no mesmo dia
  /// e sessão é tratado pelo servidor como o mesmo evento canónico.
  late final String _sessionId =
      'session_${DateTime.now().toUtc().millisecondsSinceEpoch}';

  late Future<List<DueFlashcard>> _future;
  List<DueFlashcard> _cards = const [];
  int _index = 0;
  bool _revealed = false;
  bool _saving = false;
  int _xpEarned = 0;
  String? _error;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<DueFlashcard>> _load() async {
    final cards = await widget.repository.loadDueFlashcards();
    _cards = cards;
    return cards;
  }

  Future<void> _rate(int quality) async {
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final outcome = await widget.repository.reviewFlashcard(
        cardId: _cards[_index].id,
        quality: quality,
        sessionId: _sessionId,
      );
      if (!mounted) return;
      setState(() {
        _xpEarned += outcome.awardedXp;
        _revealed = false;
        _index += 1;
      });
      widget.onCompleted();
    } on ApiException catch (error, stack) {
      await CrashReporter.recordHandled(
        error,
        stack,
        reason: 'revisão de flashcard',
      );
      if (!mounted) return;
      setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Flashcards')),
      body: FutureBuilder<List<DueFlashcard>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            final error = snapshot.error;
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  error is ApiException
                      ? error.message
                      : 'Não foi possível carregar as cartas.',
                  textAlign: TextAlign.center,
                ),
              ),
            );
          }

          if (_cards.isEmpty) {
            return const _EmptyState(
              icon: Icons.check_circle_outline,
              message: 'Não há cartas para rever hoje. Volta amanhã!',
            );
          }

          if (_index >= _cards.length) {
            return _SessionSummary(
              reviewed: _cards.length,
              xpEarned: _xpEarned,
              onClose: () => Navigator.of(context).pop(),
            );
          }

          return _buildCard(_cards[_index]);
        },
      ),
    );
  }

  Widget _buildCard(DueFlashcard card) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          Text(
            'Carta ${_index + 1} de ${_cards.length}'
            '${card.isNew ? ' · nova' : ' · ${card.repetitionCount} revisões'}',
            style: const TextStyle(
              color: LingoColors.textSecondary,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _revealed = true),
              child: Card(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          card.front,
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                        if (_revealed) ...[
                          const Divider(height: 40),
                          Text(
                            card.back,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              fontSize: 18,
                              color: LingoColors.accent,
                            ),
                          ),
                        ] else ...[
                          const SizedBox(height: 24),
                          const Text(
                            'Toca para revelar',
                            style: TextStyle(
                              color: LingoColors.textSecondary,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(color: LingoColors.danger)),
          ],
          const SizedBox(height: 16),
          if (_revealed)
            Row(
              children: [
                Expanded(
                  child: _RateButton(
                    label: 'Errei',
                    color: LingoColors.danger,
                    enabled: !_saving,
                    onTap: () => _rate(1),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _RateButton(
                    label: 'Com esforço',
                    color: LingoColors.primary,
                    enabled: !_saving,
                    onTap: () => _rate(3),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _RateButton(
                    label: 'Fácil',
                    color: LingoColors.success,
                    enabled: !_saving,
                    onTap: () => _rate(5),
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }
}

class _RateButton extends StatelessWidget {
  const _RateButton({
    required this.label,
    required this.color,
    required this.enabled,
    required this.onTap,
  });

  final String label;
  final Color color;
  final bool enabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return FilledButton(
      onPressed: enabled ? onTap : null,
      style: FilledButton.styleFrom(
        backgroundColor: color,
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 4),
      ),
      child: Text(label, style: const TextStyle(fontSize: 12)),
    );
  }
}

class _SessionSummary extends StatelessWidget {
  const _SessionSummary({
    required this.reviewed,
    required this.xpEarned,
    required this.onClose,
  });

  final int reviewed;
  final int xpEarned;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.celebration, size: 48, color: LingoColors.success),
            const SizedBox(height: 16),
            Text(
              '$reviewed cartas revistas',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              '+$xpEarned XP',
              style: const TextStyle(color: LingoColors.accent),
            ),
            const SizedBox(height: 24),
            FilledButton(onPressed: onClose, child: const Text('Concluir')),
          ],
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.icon, required this.message});

  final IconData icon;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 40, color: LingoColors.textSecondary),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}
