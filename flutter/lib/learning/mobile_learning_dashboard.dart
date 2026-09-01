import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import 'learning_repository.dart';

class MobileLearningDashboard extends StatelessWidget {
  final User user;
  const MobileLearningDashboard({super.key, required this.user});

  @override
  Widget build(BuildContext context) {
    final repository = LearningRepository();
    final name = user.displayName?.trim();
    return Scaffold(
      appBar: AppBar(title: const Text('LingoLIVE')),
      body: SafeArea(
          child: StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
        stream: repository.watchProgress(user.uid),
        builder: (context, progressSnapshot) =>
            StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
          stream: repository.watchGamification(user.uid),
          builder: (context, gameSnapshot) {
            if (progressSnapshot.connectionState == ConnectionState.waiting ||
                gameSnapshot.connectionState == ConnectionState.waiting)
              return const Center(child: CircularProgressIndicator());
            if (progressSnapshot.hasError || gameSnapshot.hasError)
              return const Center(
                  child: Text(
                      'Não foi possível carregar o progresso autenticado.'));
            final progress = progressSnapshot.data?.data();
            final game = gameSnapshot.data?.data();
            final activities =
                (progress?['totalActivities'] as num?)?.round() ?? 0;
            final minutes = (progress?['totalMinutes'] as num?)?.round() ?? 0;
            final xp = (game?['xp'] as num?)?.round() ?? 0;
            final level = (game?['level'] as num?)?.round() ?? 1;
            final completed =
                progress?['completedByType'] as Map<String, dynamic>? ??
                    const {};
            return RefreshIndicator(
                onRefresh: () async {
                  await repository.loadProgress();
                },
                child: ListView(
                    padding: const EdgeInsets.all(20),
                    physics: const AlwaysScrollableScrollPhysics(),
                    children: [
                      Text(
                          name == null || name.isEmpty
                              ? 'Bem-vindo'
                              : 'Bem-vindo, $name',
                          style: Theme.of(context)
                              .textTheme
                              .headlineSmall
                              ?.copyWith(fontWeight: FontWeight.w900)),
                      const SizedBox(height: 6),
                      const Text('Progresso certificado pelo backend'),
                      const SizedBox(height: 24),
                      Row(children: [
                        Expanded(child: _Metric(label: 'XP', value: '$xp')),
                        const SizedBox(width: 12),
                        Expanded(
                            child: _Metric(label: 'Nível', value: '$level'))
                      ]),
                      const SizedBox(height: 12),
                      Row(children: [
                        Expanded(
                            child: _Metric(
                                label: 'Atividades', value: '$activities')),
                        const SizedBox(width: 12),
                        Expanded(
                            child: _Metric(label: 'Minutos', value: '$minutes'))
                      ]),
                      const SizedBox(height: 28),
                      Text('Atividades concluídas',
                          style: Theme.of(context)
                              .textTheme
                              .titleLarge
                              ?.copyWith(fontWeight: FontWeight.w800)),
                      const SizedBox(height: 12),
                      _ActivityCount(label: 'Quiz', value: completed['quiz']),
                      _ActivityCount(
                          label: 'Pronúncia',
                          value: completed['pronunciation']),
                      _ActivityCount(
                          label: 'Flashcards', value: completed['vocabulary']),
                      if (activities == 0)
                        const Padding(
                            padding: EdgeInsets.only(top: 24),
                            child: Text(
                                'Conclua a primeira atividade para iniciar o seu progresso.',
                                textAlign: TextAlign.center)),
                    ]));
          },
        ),
      )),
    );
  }
}

class _Metric extends StatelessWidget {
  final String label, value;
  const _Metric({required this.label, required this.value});
  @override
  Widget build(BuildContext context) => Card(
      child: Padding(
          padding: const EdgeInsets.all(18),
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(label),
            const SizedBox(height: 6),
            Text(value,
                style: Theme.of(context)
                    .textTheme
                    .headlineMedium
                    ?.copyWith(fontWeight: FontWeight.w900))
          ])));
}

class _ActivityCount extends StatelessWidget {
  final String label;
  final dynamic value;
  const _ActivityCount({required this.label, required this.value});
  @override
  Widget build(BuildContext context) => ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(label),
      trailing: Text('${(value as num?)?.round() ?? 0}',
          style: Theme.of(context)
              .textTheme
              .titleMedium
              ?.copyWith(fontWeight: FontWeight.w800)));
}
