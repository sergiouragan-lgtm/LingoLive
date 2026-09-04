import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:percent_indicator/percent_indicator.dart';

import '../../../app/theme.dart';
import '../models/enrollment.dart';
import '../providers/library_provider.dart';

class LibraryScreen extends ConsumerWidget {
  const LibraryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncLib = ref.watch(libraryProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('A minha Biblioteca',
          style: TextStyle(fontWeight: FontWeight.w700)),
        actions: [
          IconButton(
            icon: const Icon(Icons.store_outlined),
            tooltip: 'Marketplace',
            onPressed: () => context.go('/marketplace'),
          ),
        ],
      ),
      body: asyncLib.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error:   (e, _) => Center(child: Text('Erro: $e')),
        data:    (list) => list.isEmpty
            ? _EmptyLibrary(onBrowse: () => context.go('/marketplace'))
            : RefreshIndicator(
                onRefresh: () => ref.refresh(libraryProvider.future),
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: list.length,
                  itemBuilder: (_, i) => _EnrollmentCard(
                    enrollment: list[i],
                    onTap: () => context.go('/reader/${list[i].ebookId}'),
                  ),
                ),
              ),
      ),
    );
  }
}

class _EnrollmentCard extends StatelessWidget {
  final EbookEnrollment enrollment;
  final VoidCallback onTap;

  const _EnrollmentCard({required this.enrollment, required this.onTap});

  Color get _coverColor {
    try {
      final hex = (enrollment.ebookCoverColor ?? '#7C3AED').replaceAll('#', '');
      return Color(int.parse('FF$hex', radix: 16));
    } catch (_) {
      return AppTheme.primary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final pct = (enrollment.completionPercent / 100).clamp(0.0, 1.0);
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Cover
              Container(
                width: 56, height: 72,
                decoration: BoxDecoration(
                  color: _coverColor,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.menu_book, color: Colors.white, size: 28),
              ),
              const SizedBox(width: 16),
              // Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(enrollment.ebookTitle,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700, fontSize: 15)),
                    if (enrollment.ebookSubtitle != null) ...[
                      const SizedBox(height: 2),
                      Text(enrollment.ebookSubtitle!,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 12,
                          color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6))),
                    ],
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        if (enrollment.currentCefrLevel != null)
                          _Badge(enrollment.currentCefrLevel!),
                        if (enrollment.ebookLanguage != null) ...[
                          const SizedBox(width: 6),
                          _Badge(enrollment.ebookLanguage!,
                            color: Colors.blue.shade50,
                            textColor: Colors.blue.shade700),
                        ],
                      ],
                    ),
                    const SizedBox(height: 8),
                    LinearPercentIndicator(
                      lineHeight: 6,
                      percent: pct,
                      padding: EdgeInsets.zero,
                      progressColor: AppTheme.primary,
                      backgroundColor: AppTheme.primary.withOpacity(0.12),
                      barRadius: const Radius.circular(3),
                    ),
                    const SizedBox(height: 4),
                    Text('${enrollment.completionPercent.toStringAsFixed(0)}% concluído',
                      style: TextStyle(fontSize: 11,
                        color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5))),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right),
            ],
          ),
        ),
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  final String label;
  final Color? color;
  final Color? textColor;
  const _Badge(this.label, {this.color, this.textColor});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
    decoration: BoxDecoration(
      color: color ?? AppTheme.primary.withOpacity(0.1),
      borderRadius: BorderRadius.circular(99),
    ),
    child: Text(label,
      style: TextStyle(
        fontSize: 10,
        fontWeight: FontWeight.w700,
        color: textColor ?? AppTheme.primary,
      )),
  );
}

class _EmptyLibrary extends StatelessWidget {
  final VoidCallback onBrowse;
  const _EmptyLibrary({required this.onBrowse});

  @override
  Widget build(BuildContext context) => Center(
    child: Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.library_books_outlined, size: 72,
          color: Theme.of(context).colorScheme.onSurface.withOpacity(0.25)),
        const SizedBox(height: 16),
        const Text('A tua biblioteca está vazia',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        const Text('Descobre e-books no marketplace para começar a aprender.',
          textAlign: TextAlign.center,
          style: TextStyle(color: Colors.grey)),
        const SizedBox(height: 24),
        ElevatedButton.icon(
          onPressed: onBrowse,
          icon: const Icon(Icons.store_outlined),
          label: const Text('Ver Marketplace'),
        ),
      ],
    ),
  );
}
