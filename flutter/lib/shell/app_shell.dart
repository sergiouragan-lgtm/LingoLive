import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../memory/memory_control_screen.dart';
import '../profile/profile_hub_screen.dart';
import '../learning/learning_hub_screen.dart';
import '../learning/mobile_learning_dashboard.dart';

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
      MobileLearningDashboard(user: widget.user),
      LearningHubScreen(user: widget.user),
      MemoryControlScreen(user: widget.user, embedded: true),
      ProfileHubScreen(user: widget.user),
    ];

    return Scaffold(
      body: IndexedStack(index: _selectedIndex, children: pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (index) =>
            setState(() => _selectedIndex = index),
        destinations: const [
          NavigationDestination(
              icon: Icon(Icons.home_outlined),
              selectedIcon: Icon(Icons.home),
              label: 'Início'),
          NavigationDestination(
              icon: Icon(Icons.menu_book_outlined),
              selectedIcon: Icon(Icons.menu_book),
              label: 'Aprender'),
          NavigationDestination(
              icon: Icon(Icons.psychology_outlined),
              selectedIcon: Icon(Icons.psychology),
              label: 'Memória'),
          NavigationDestination(
              icon: Icon(Icons.person_outline),
              selectedIcon: Icon(Icons.person),
              label: 'Perfil'),
        ],
      ),
    );
  }
}
