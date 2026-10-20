import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../auth/providers/auth_provider.dart';
import '../../library/providers/library_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final asyncLib = ref.watch(libraryProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Perfil',
          style: TextStyle(fontWeight: FontWeight.w700)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/dashboard'),
        ),
      ),
      body: ListView(
        children: [
          // Avatar + name
          Container(
            padding: const EdgeInsets.symmetric(vertical: 32),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  AppTheme.primary.withOpacity(0.08),
                  Colors.transparent,
                ],
              ),
            ),
            child: Column(
              children: [
                CircleAvatar(
                  radius: 40,
                  backgroundColor: AppTheme.primary,
                  child: Text(
                    (user?.displayName?.isNotEmpty == true)
                        ? user!.displayName![0].toUpperCase()
                        : '?',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 32,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  user?.displayName ?? 'Aluno',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  user?.email ?? '',
                  style: TextStyle(
                    fontSize: 14,
                    color: Theme.of(context)
                        .colorScheme
                        .onSurface
                        .withOpacity(0.6),
                  ),
                ),
              ],
            ),
          ),

          // Stats
          asyncLib.when(
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
            data: (list) => Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Row(
                children: [
                  Expanded(
                    child: _StatCard(
                      label: 'E-books',
                      value: list.length.toString(),
                      icon: Icons.library_books_outlined,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _StatCard(
                      label: 'Concluídos',
                      value: list
                          .where((e) => e.completionPercent >= 100)
                          .length
                          .toString(),
                      icon: Icons.check_circle_outline,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _StatCard(
                      label: 'Em curso',
                      value: list
                          .where((e) =>
                              e.completionPercent > 0 &&
                              e.completionPercent < 100)
                          .length
                          .toString(),
                      icon: Icons.play_circle_outline,
                    ),
                  ),
                ],
              ),
            ),
          ),

          const Divider(),

          // Menu items
          _MenuItem(
            icon: Icons.library_books_outlined,
            label: 'A minha Biblioteca',
            onTap: () => context.go('/library'),
          ),
          _MenuItem(
            icon: Icons.store_outlined,
            label: 'Marketplace',
            onTap: () => context.go('/marketplace'),
          ),
          const Divider(),
          _MenuItem(
            icon: Icons.logout,
            label: 'Terminar sessão',
            color: AppTheme.error,
            onTap: () async {
              final confirm = await showDialog<bool>(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('Terminar sessão'),
                  content: const Text('Tens a certeza que queres sair?'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(ctx, false),
                      child: const Text('Cancelar'),
                    ),
                    TextButton(
                      onPressed: () => Navigator.pop(ctx, true),
                      child: Text('Sair',
                        style: TextStyle(color: AppTheme.error)),
                    ),
                  ],
                ),
              );
              if (confirm == true) {
                await ref.read(authServiceProvider).signOut();
              }
            },
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;

  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(vertical: 16),
    decoration: BoxDecoration(
      color: AppTheme.primary.withOpacity(0.06),
      borderRadius: BorderRadius.circular(12),
    ),
    child: Column(
      children: [
        Icon(icon, color: AppTheme.primary, size: 22),
        const SizedBox(height: 6),
        Text(value,
          style: const TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 22,
            color: AppTheme.primary,
          )),
        const SizedBox(height: 2),
        Text(label,
          style: TextStyle(
            fontSize: 11,
            color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
          )),
      ],
    ),
  );
}

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color? color;

  const _MenuItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.color,
  });

  @override
  Widget build(BuildContext context) => ListTile(
    leading: Icon(icon, color: color),
    title: Text(label,
      style: TextStyle(
        color: color,
        fontWeight: FontWeight.w500,
      )),
    trailing: const Icon(Icons.chevron_right, size: 20),
    onTap: onTap,
  );
}
