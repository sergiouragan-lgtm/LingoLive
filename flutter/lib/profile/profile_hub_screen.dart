import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../billing/subscription_screen.dart';
import '../firebase_services.dart';
import '../school/school_dashboard_screen.dart';

import 'student_profile_screen.dart';
import 'study_preferences_screen.dart';

class ProfileHubScreen extends StatelessWidget {
  final User user;

  const ProfileHubScreen({super.key, required this.user});

  Future<void> _open(BuildContext context, Widget screen) async {
    await Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => screen));
  }

  @override
  Widget build(BuildContext context) {
    final displayName = user.displayName?.trim();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Perfil'),
        actions: [
          IconButton(
            tooltip: 'Terminar sessão',
            onPressed: FirebaseAuth.instance.signOut,
            icon: const Icon(Icons.logout_rounded),
          ),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            CircleAvatar(
              radius: 38,
              backgroundImage: user.photoURL == null ? null : NetworkImage(user.photoURL!),
              child: user.photoURL == null ? const Icon(Icons.person, size: 38) : null,
            ),
            const SizedBox(height: 12),
            Text(
              displayName == null || displayName.isEmpty ? 'Aluno' : displayName,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
            ),
            if (user.email != null) Text(user.email!, textAlign: TextAlign.center),
            const SizedBox(height: 28),
            Card(
              clipBehavior: Clip.antiAlias,
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.badge_outlined),
                    title: const Text('Perfil do aluno'),
                    subtitle: const Text('Identidade e percurso linguístico'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => _open(context, StudentProfileScreen(user: user)),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.tune_rounded),
                    title: const Text('Preferências de estudo'),
                    subtitle: const Text('Objetivo, ritmo e frequência'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => _open(context, StudyPreferencesScreen(user: user)),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.credit_card_outlined),
                    title: const Text('Plano e faturação'),
                    subtitle: const Text('Subscrição e pagamento seguro'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => _open(context, const SubscriptionScreen()),
                  ),
                  StreamBuilder(
                    stream: FirebaseServices.firestore.collection('users').doc(user.uid).snapshots(),
                    builder: (context, snapshot) {
                      final role = snapshot.data?.data()?['role']?.toString().toUpperCase();
                      final allowed = {'SCHOOL_ADMIN', 'ORG_ADMIN', 'ADMIN', 'SUPER_ADMIN'}.contains(role);
                      if (!allowed) return const SizedBox.shrink();
                      return Column(children: [
                        const Divider(height: 1),
                        ListTile(
                          leading: const Icon(Icons.school_outlined),
                          title: const Text('Painel da escola'),
                          subtitle: const Text('Acesso institucional protegido'),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () => _open(context, const SchoolDashboardScreen()),
                        ),
                      ]);
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
