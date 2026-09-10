import 'package:flutter/material.dart';

import '../features/catalog/presentation/catalog_page.dart';
import '../features/dashboard/presentation/student_dashboard_page.dart';
import '../features/exercises/presentation/exercises_page.dart';

class AppShell extends StatefulWidget {
  const AppShell({required this.uid, required this.onSignOut, super.key});
  final String uid;
  final Future<void> Function() onSignOut;
  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  var index = 0;
  @override
  Widget build(BuildContext context) {
    final pages = [
      StudentDashboardPage(uid: widget.uid),
      const CatalogPage(),
      const ExercisesPage(),
    ];
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'LingoLive',
          style: TextStyle(fontWeight: FontWeight.w900),
        ),
        actions: [
          IconButton(
            tooltip: 'Terminar sessão',
            onPressed: widget.onSignOut,
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: SafeArea(
        child: IndexedStack(index: index, children: pages),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (value) => setState(() => index = value),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'Início',
          ),
          NavigationDestination(
            icon: Icon(Icons.menu_book_outlined),
            selectedIcon: Icon(Icons.menu_book),
            label: 'Biblioteca',
          ),
          NavigationDestination(
            icon: Icon(Icons.fitness_center_outlined),
            selectedIcon: Icon(Icons.fitness_center),
            label: 'Praticar',
          ),
        ],
      ),
    );
  }
}
