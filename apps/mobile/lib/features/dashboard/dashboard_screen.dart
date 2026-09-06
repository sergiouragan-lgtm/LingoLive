import 'package:flutter/material.dart';

import '../../core/api_client.dart';
import '../../core/theme.dart';
import '../../data/learning_repository.dart';
import '../../models/learning_models.dart';

/// Dashboard mobile: XP, progresso por competência, memória de longo prazo e
/// a linha temporal dos eventos canónicos — tudo lido de `/api/mobile/dashboard`.
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key, required this.repository});

  final LearningRepository repository;

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late Future<MobileDashboard> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.repository.loadDashboard();
  }

  Future<void> _refresh() async {
    final reload = widget.repository.loadDashboard();
    setState(() => _future = reload);
    // O erro é apresentado pelo FutureBuilder; aqui só esperamos que o
    // indicador de recarregamento feche.
    await reload.then<void>((_) {}, onError: (_) {});
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<MobileDashboard>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return _DashboardError(error: snapshot.error!, onRetry: _refresh);
        }

        final dashboard = snapshot.data!;
        return RefreshIndicator(
          onRefresh: _refresh,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _XpCard(dashboard: dashboard),
              const SizedBox(height: 8),
              _ProgressCard(dashboard: dashboard),
              const SizedBox(height: 8),
              _MemoryCard(dashboard: dashboard),
              const SizedBox(height: 8),
              _TimelineCard(timeline: dashboard.timeline),
            ],
          ),
        );
      },
    );
  }
}

class _DashboardError extends StatelessWidget {
  const _DashboardError({required this.error, required this.onRetry});

  final Object error;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    final api = error is ApiException ? error as ApiException : null;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.cloud_off,
              size: 40,
              color: LingoColors.textSecondary,
            ),
            const SizedBox(height: 12),
            Text(
              api?.message ?? 'Não foi possível carregar o teu progresso.',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: onRetry,
              child: const Text('Tentar novamente'),
            ),
          ],
        ),
      ),
    );
  }
}

class _XpCard extends StatelessWidget {
  const _XpCard({required this.dashboard});

  final MobileDashboard dashboard;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Nível ${dashboard.level}',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                Text(
                  '${dashboard.coins} moedas',
                  style: const TextStyle(color: LingoColors.accent),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: LinearProgressIndicator(
                value: dashboard.levelProgress,
                minHeight: 10,
                backgroundColor: LingoColors.background,
                valueColor: const AlwaysStoppedAnimation<Color>(
                  LingoColors.accent,
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '${dashboard.xpIntoLevel} / ${dashboard.xpForNextLevel} XP para o próximo nível '
              '· ${dashboard.totalXp} XP no total',
              style: const TextStyle(
                color: LingoColors.textSecondary,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProgressCard extends StatelessWidget {
  const _ProgressCard({required this.dashboard});

  final MobileDashboard dashboard;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Progresso por atividade',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            _MetricRow(label: 'Quiz', value: dashboard.quizAverage),
            _MetricRow(
              label: 'Pronúncia',
              value: dashboard.pronunciationAverage,
            ),
            _MetricRow(label: 'Flashcards', value: dashboard.flashcardAverage),
            const Divider(height: 24),
            Text(
              'Nível CEFR estimado: ${dashboard.estimatedCefr ?? 'ainda sem avaliação'} · '
              '${dashboard.activeDays} dias com atividade registada',
              style: const TextStyle(
                color: LingoColors.textSecondary,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MetricRow extends StatelessWidget {
  const _MetricRow({required this.label, required this.value});

  final String label;

  /// `null` indica ausência de evidência — mostramos "—", nunca 0%.
  final int? value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          SizedBox(width: 110, child: Text(label)),
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: LinearProgressIndicator(
                value: (value ?? 0) / 100,
                minHeight: 8,
                backgroundColor: LingoColors.background,
              ),
            ),
          ),
          const SizedBox(width: 12),
          SizedBox(
            width: 44,
            child: Text(
              value == null ? '—' : '$value%',
              textAlign: TextAlign.right,
              style: const TextStyle(color: LingoColors.textSecondary),
            ),
          ),
        ],
      ),
    );
  }
}

class _MemoryCard extends StatelessWidget {
  const _MemoryCard({required this.dashboard});

  final MobileDashboard dashboard;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Memória de longo prazo',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            if (dashboard.vocabularyMastered.isEmpty &&
                dashboard.grammarWeaknesses.isEmpty)
              const Text(
                'Ainda não há vocabulário consolidado. Completa uma atividade para começar.',
                style: TextStyle(
                  color: LingoColors.textSecondary,
                  fontSize: 12,
                ),
              )
            else ...[
              if (dashboard.vocabularyMastered.isNotEmpty) ...[
                const Text('Dominado', style: TextStyle(fontSize: 12)),
                const SizedBox(height: 6),
                _ChipWrap(
                  terms: dashboard.vocabularyMastered,
                  color: LingoColors.success,
                ),
                const SizedBox(height: 12),
              ],
              if (dashboard.grammarWeaknesses.isNotEmpty) ...[
                const Text(
                  'A precisar de reforço',
                  style: TextStyle(fontSize: 12),
                ),
                const SizedBox(height: 6),
                _ChipWrap(
                  terms: dashboard.grammarWeaknesses,
                  color: LingoColors.danger,
                ),
              ],
            ],
          ],
        ),
      ),
    );
  }
}

class _ChipWrap extends StatelessWidget {
  const _ChipWrap({required this.terms, required this.color});

  final List<String> terms;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 6,
      runSpacing: 6,
      children: terms
          .map(
            (term) => Chip(
              label: Text(term, style: const TextStyle(fontSize: 11)),
              backgroundColor: color.withValues(alpha: 0.15),
              side: BorderSide(color: color.withValues(alpha: 0.4)),
              visualDensity: VisualDensity.compact,
            ),
          )
          .toList(growable: false),
    );
  }
}

class _TimelineCard extends StatelessWidget {
  const _TimelineCard({required this.timeline});

  final List<TimelineEntry> timeline;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Eventos recentes',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            if (timeline.isEmpty)
              const Text(
                'Sem eventos registados. As atividades que completares aparecem aqui.',
                style: TextStyle(
                  color: LingoColors.textSecondary,
                  fontSize: 12,
                ),
              )
            else
              ...timeline.map(
                (entry) => ListTile(
                  contentPadding: EdgeInsets.zero,
                  dense: true,
                  leading: Icon(
                    _iconFor(entry.type),
                    color: LingoColors.accent,
                  ),
                  title: Text(
                    entry.label,
                    style: const TextStyle(fontSize: 14),
                  ),
                  subtitle: Text(
                    '${entry.occurredOn.split('T').first} · via ${entry.source}',
                    style: const TextStyle(fontSize: 11),
                  ),
                  trailing: Text('${entry.score}%'),
                ),
              ),
          ],
        ),
      ),
    );
  }

  IconData _iconFor(String type) {
    switch (type) {
      case CanonicalEventTypes.quizCompleted:
        return Icons.quiz_outlined;
      case CanonicalEventTypes.pronunciationEvaluated:
        return Icons.mic_none;
      case CanonicalEventTypes.flashcardReviewed:
        return Icons.style_outlined;
      default:
        return Icons.circle_outlined;
    }
  }
}
