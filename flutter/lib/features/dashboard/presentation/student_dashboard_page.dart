import 'package:flutter/material.dart';

import '../../profile/data/profile_repository.dart';
import '../../profile/domain/student_profile.dart';

class StudentDashboardPage extends StatelessWidget {
  const StudentDashboardPage({required this.uid, this.repository, super.key});
  final String uid;
  final ProfileRepository? repository;
  @override
  Widget build(BuildContext context) => FutureBuilder<StudentProfile>(
    future: (repository ?? ProfileRepository()).load(uid),
    builder: (context, snapshot) {
      if (snapshot.connectionState != ConnectionState.done) {
        return const Center(child: CircularProgressIndicator());
      }
      if (snapshot.hasError) {
        return const _DashboardState(
          icon: Icons.cloud_off,
          title: 'Perfil indisponível',
          message: 'Ligue-se à internet e tente novamente.',
        );
      }
      final profile = snapshot.data!;
      return RefreshIndicator(
        onRefresh: () async {},
        child: ListView(
          padding: const EdgeInsets.all(18),
          children: [
            Semantics(
              header: true,
              child: Text(
                'Bom dia, ${profile.name}!',
                style: Theme.of(context).textTheme.headlineSmall
                    ?.copyWith(fontWeight: FontWeight.w900),
              ),
            ),
            Text('${profile.language} · CEFR ${profile.cefr}'),
            const SizedBox(height: 18),
            Card(
              color: const Color(0xFF7C3AED),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 28,
                      foregroundImage: profile.photoUrl == null
                          ? null
                          : NetworkImage(profile.photoUrl!),
                      child: const Icon(Icons.person),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Continuar aprendizagem',
                            style: TextStyle(color: Colors.white70),
                          ),
                          Text(
                            '${profile.language} ${profile.cefr}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 21,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Icon(
                      Icons.play_circle_fill_rounded,
                      color: Colors.white,
                      size: 42,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 14),
            const _Section(
              icon: Icons.flag_rounded,
              color: Color(0xFF16A34A),
              title: 'Objetivo diário',
              subtitle: '15 minutos de 20 concluídos',
            ),
            const _Section(
              icon: Icons.local_fire_department_rounded,
              color: Color(0xFFF97316),
              title: 'Sequência de estudo',
              subtitle: '7 dias consecutivos',
            ),
            const _Section(
              icon: Icons.calendar_month_rounded,
              color: Color(0xFF0284C7),
              title: 'Próxima aula',
              subtitle: 'Business English · Hoje, 18:30',
            ),
            const _Section(
              icon: Icons.auto_awesome_rounded,
              color: Color(0xFF7C3AED),
              title: 'Recomendação adaptativa',
              subtitle: 'Reforce present perfect e vocabulário de reuniões',
            ),
            const _Section(
              icon: Icons.trending_up_rounded,
              color: Color(0xFFDB2777),
              title: 'Progresso recente',
              subtitle: '82% de precisão esta semana',
            ),
            const _Section(
              icon: Icons.style_rounded,
              color: Color(0xFF0D9488),
              title: 'Vocabulário para revisão',
              subtitle: '12 palavras aguardam revisão',
            ),
            const _Section(
              icon: Icons.emoji_events_rounded,
              color: Color(0xFFEAB308),
              title: 'Conquistas',
              subtitle: 'Sequência de 7 dias desbloqueada',
            ),
          ],
        ),
      );
    },
  );
}

class _Section extends StatelessWidget {
  const _Section({
    required this.icon,
    required this.color,
    required this.title,
    required this.subtitle,
  });
  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 10),
    child: Card(
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: color.withValues(alpha: .12),
          child: Icon(icon, color: color),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w800)),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
      ),
    ),
  );
}

class _DashboardState extends StatelessWidget {
  const _DashboardState({
    required this.icon,
    required this.title,
    required this.message,
  });
  final IconData icon;
  final String title;
  final String message;
  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 48),
          const SizedBox(height: 12),
          Text(title, style: Theme.of(context).textTheme.titleLarge),
          Text(message, textAlign: TextAlign.center),
        ],
      ),
    ),
  );
}
