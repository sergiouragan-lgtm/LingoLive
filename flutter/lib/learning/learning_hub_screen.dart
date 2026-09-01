import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../firebase_services.dart';
import 'flashcards_screen.dart';
import 'pronunciation_screen.dart';
import 'quiz_screen.dart';

class LearningHubScreen extends StatelessWidget {
  final User user;
  const LearningHubScreen({super.key, required this.user});

  void _open(BuildContext context, Widget screen) => Navigator.of(context)
      .push(MaterialPageRoute<void>(builder: (_) => screen));

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Aprender')),
        body: StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
          stream: FirebaseServices.firestore
              .collection('users')
              .doc(user.uid)
              .snapshots(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting)
              return const Center(child: CircularProgressIndicator());
            if (snapshot.hasError)
              return const Center(
                  child: Text('Não foi possível carregar o percurso.'));
            final data = snapshot.data?.data();
            final language =
                (data?['learningLanguage'] ?? data?['targetLanguage'] ?? '')
                    .toString()
                    .trim();
            return ListView(padding: const EdgeInsets.all(20), children: [
              Text('Continue o seu percurso',
                  style: Theme.of(context)
                      .textTheme
                      .headlineSmall
                      ?.copyWith(fontWeight: FontWeight.w900)),
              const SizedBox(height: 8),
              Text(language.isEmpty
                  ? 'Defina o idioma de aprendizagem no perfil para criar um quiz.'
                  : 'Idioma atual: $language'),
              const SizedBox(height: 24),
              _ActivityTile(
                  icon: Icons.auto_awesome_outlined,
                  title: 'Quiz adaptativo',
                  subtitle: 'Perguntas criadas com a sua memória e progresso',
                  enabled: language.isNotEmpty,
                  onTap: () => _open(context, QuizScreen(language: language))),
              _ActivityTile(
                  icon: Icons.mic_none,
                  title: 'Pronúncia',
                  subtitle: 'Grave uma expressão real e receba avaliação',
                  onTap: () => _open(context, const PronunciationScreen())),
              _ActivityTile(
                  icon: Icons.style_outlined,
                  title: 'Flashcards',
                  subtitle: 'Reveja as palavras guardadas no seu percurso',
                  onTap: () => _open(context, const FlashcardsScreen())),
            ]);
          },
        ),
      );
}

class _ActivityTile extends StatelessWidget {
  final IconData icon;
  final String title, subtitle;
  final VoidCallback onTap;
  final bool enabled;
  const _ActivityTile(
      {required this.icon,
      required this.title,
      required this.subtitle,
      required this.onTap,
      this.enabled = true});
  @override
  Widget build(BuildContext context) => Card(
      margin: const EdgeInsets.only(bottom: 14),
      child: ListTile(
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          leading: Icon(icon,
              size: 32,
              color: enabled ? Theme.of(context).colorScheme.primary : null),
          title:
              Text(title, style: const TextStyle(fontWeight: FontWeight.w800)),
          subtitle: Text(subtitle),
          trailing: const Icon(Icons.chevron_right),
          enabled: enabled,
          onTap: enabled ? onTap : null));
}
