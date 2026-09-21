import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../auth/providers/auth_provider.dart';
import '../../library/providers/library_provider.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final asyncLib = ref.watch(libraryProvider);

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 160,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [AppTheme.primary, AppTheme.primary.withBlue(255)],
                  ),
                ),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Olá, ${user?.displayName?.split(' ').first ?? 'Aluno'}!',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 22,
                                    fontWeight: FontWeight.w800,
                                  )),
                                const SizedBox(height: 4),
                                const Text('Continua a aprender hoje',
                                  style: TextStyle(
                                    color: Colors.white70,
                                    fontSize: 14,
                                  )),
                              ],
                            ),
                            CircleAvatar(
                              radius: 24,
                              backgroundColor: Colors.white24,
                              child: Text(
                                (user?.displayName?.isNotEmpty == true)
                                    ? user!.displayName![0].toUpperCase()
                                    : '?',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 18,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.person_outline, color: Colors.white),
                onPressed: () => context.go('/profile'),
              ),
            ],
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Quick action cards
                  Row(
                    children: [
                      Expanded(
                        child: _ActionCard(
                          icon: Icons.library_books_outlined,
                          label: 'Biblioteca',
                          color: AppTheme.primary,
                          onTap: () => context.go('/library'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _ActionCard(
                          icon: Icons.store_outlined,
                          label: 'Marketplace',
                          color: Colors.blue.shade600,
                          onTap: () => context.go('/marketplace'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Continue reading section
                  const Text('Continuar a ler',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 12),

                  asyncLib.when(
                    loading: () => const Center(child: CircularProgressIndicator()),
                    error: (e, _) => Center(child: Text('Erro: $e')),
                    data: (list) {
                      if (list.isEmpty) {
                        return _EmptyState(
                          message: 'Ainda não tens e-books na biblioteca.',
                          actionLabel: 'Descobrir e-books',
                          onAction: () => context.go('/marketplace'),
                        );
                      }
                      final inProgress = list
                          .where((e) => e.completionPercent > 0 && e.completionPercent < 100)
                          .toList();
                      final display = inProgress.isNotEmpty ? inProgress : list.take(3).toList();
                      return Column(
                        children: display.map((enrollment) {
                          final pct = (enrollment.completionPercent / 100).clamp(0.0, 1.0);
                          return Card(
                            margin: const EdgeInsets.only(bottom: 10),
                            child: InkWell(
                              onTap: () => context.go('/reader/${enrollment.ebookId}'),
                              borderRadius: BorderRadius.circular(12),
                              child: Padding(
                                padding: const EdgeInsets.all(14),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 48, height: 60,
                                      decoration: BoxDecoration(
                                        color: AppTheme.primary,
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: const Icon(Icons.menu_book,
                                        color: Colors.white, size: 24),
                                    ),
                                    const SizedBox(width: 14),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(enrollment.ebookTitle,
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w600,
                                              fontSize: 14,
                                            )),
                                          const SizedBox(height: 4),
                                          LinearProgressIndicator(
                                            value: pct,
                                            backgroundColor: AppTheme.primary.withOpacity(0.12),
                                            valueColor: AlwaysStoppedAnimation(AppTheme.primary),
                                            minHeight: 4,
                                            borderRadius: BorderRadius.circular(2),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            '${enrollment.completionPercent.toStringAsFixed(0)}% concluído',
                                            style: TextStyle(
                                              fontSize: 11,
                                              color: Theme.of(context)
                                                  .colorScheme
                                                  .onSurface
                                                  .withOpacity(0.5),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const Icon(Icons.play_circle_outline,
                                      color: AppTheme.primary, size: 28),
                                  ],
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ActionCard({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(14),
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 18),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 32),
          const SizedBox(height: 8),
          Text(label,
            style: TextStyle(
              fontWeight: FontWeight.w600,
              color: color,
              fontSize: 13,
            )),
        ],
      ),
    ),
  );
}

class _EmptyState extends StatelessWidget {
  final String message;
  final String actionLabel;
  final VoidCallback onAction;

  const _EmptyState({
    required this.message,
    required this.actionLabel,
    required this.onAction,
  });

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(24),
    decoration: BoxDecoration(
      color: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.5),
      borderRadius: BorderRadius.circular(14),
    ),
    child: Column(
      children: [
        Icon(Icons.library_books_outlined, size: 48,
          color: Theme.of(context).colorScheme.onSurface.withOpacity(0.3)),
        const SizedBox(height: 12),
        Text(message,
          textAlign: TextAlign.center,
          style: TextStyle(
            color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
          )),
        const SizedBox(height: 16),
        OutlinedButton(
          onPressed: onAction,
          child: Text(actionLabel),
        ),
      ],
    ),
  );
}
