import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../memory/memory_control_screen.dart';
import '../profile/profile_hub_screen.dart';

class AppShell extends StatefulWidget {
  final User user;

  const AppShell({super.key, required this.user});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    final pages = <Widget>[
      _AuthenticatedHome(user: widget.user),
      const _LearningEntryScreen(),
      MemoryControlScreen(user: widget.user, embedded: true),
      ProfileHubScreen(user: widget.user),
    ];

    return Scaffold(
      body: IndexedStack(index: _selectedIndex, children: pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (index) => setState(() => _selectedIndex = index),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Início'),
          NavigationDestination(icon: Icon(Icons.menu_book_outlined), selectedIcon: Icon(Icons.menu_book), label: 'Aprender'),
          NavigationDestination(icon: Icon(Icons.psychology_outlined), selectedIcon: Icon(Icons.psychology), label: 'Memória'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Perfil'),
        ],
      ),
    );
  }
}

class _AuthenticatedHome extends StatelessWidget {
  final User user;

  const _AuthenticatedHome({required this.user});

  @override
  Widget build(BuildContext context) {
    final name = user.displayName?.trim();
    return Scaffold(
      appBar: AppBar(title: const Text('LingoLIVE')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                name == null || name.isEmpty ? 'Bem-vindo' : 'Bem-vindo, $name',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 8),
              const Text('O seu percurso autenticado está pronto para continuar.'),
            ],
          ),
        ),
      ),
    );
  }
}

class _LearningEntryScreen extends StatelessWidget {
  const _LearningEntryScreen();

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Aprender')),
        body: const SafeArea(
          child: Center(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Text('As atividades disponíveis serão carregadas a partir do percurso real do aluno.', textAlign: TextAlign.center),
            ),
          ),
        ),
      );
}
