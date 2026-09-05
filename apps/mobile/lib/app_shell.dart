import 'package:flutter/material.dart';

import 'core/api_client.dart';
import 'core/crash_reporter.dart';
import 'core/theme.dart';
import 'data/billing_repository.dart';
import 'data/learning_repository.dart';
import 'features/billing/checkout_screen.dart';
import 'features/dashboard/dashboard_screen.dart';
import 'features/flashcards/flashcards_screen.dart';
import 'features/pronunciation/pronunciation_screen.dart';
import 'features/quiz/quiz_screen.dart';

/// Casca da aplicação: dashboard + catálogo de atividades + subscrição.
class AppShell extends StatefulWidget {
  const AppShell({
    super.key,
    required this.learningRepository,
    required this.billingRepository,
  });

  final LearningRepository learningRepository;
  final BillingRepository billingRepository;

  /// Abre o ecrã de subscrição no navegador raiz da aplicação para verificar
  /// uma sessão de checkout devolvida por deep link. `sessionId` nulo significa
  /// que o utilizador cancelou.
  ///
  /// É estático e recebe o `navigatorKey` da `MaterialApp` porque o retorno de
  /// pagamento pode chegar antes de a casca estar montada.
  static void openBilling(
    GlobalKey<NavigatorState> navigatorKey,
    BillingRepository repository,
    String? sessionId,
  ) {
    navigatorKey.currentState?.push(
      MaterialPageRoute<void>(
        builder:
            (_) => CheckoutScreen(
              repository: repository,
              pendingSessionId: sessionId,
            ),
      ),
    );
  }

  @override
  State<AppShell> createState() => AppShellState();
}

class AppShellState extends State<AppShell> {
  int _tab = 0;

  /// Incrementado após cada atividade concluída, para forçar o dashboard a
  /// recarregar e mostrar o XP e os eventos acabados de registar.
  int _dashboardEpoch = 0;

  @override
  void initState() {
    super.initState();
    _loadClaims();
  }

  Future<void> _loadClaims() async {
    try {
      final claims = await widget.learningRepository.loadClaims();
      await CrashReporter.identify(
        userId: 'current',
        tenantId: claims.tenantId,
        role: claims.role,
      );
    } on ApiException catch (error, stack) {
      // Falhar a leitura das claims não pode bloquear a app: o backend volta a
      // validá-las em cada pedido.
      await CrashReporter.recordHandled(
        error,
        stack,
        reason: 'leitura de claims',
      );
    }
  }

  void _onActivityCompleted() => setState(() => _dashboardEpoch += 1);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('LingoLIVE'),
        actions: [
          IconButton(
            tooltip: 'Subscrição',
            icon: const Icon(Icons.workspace_premium_outlined),
            onPressed:
                () => Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder:
                        (_) => CheckoutScreen(
                          repository: widget.billingRepository,
                        ),
                  ),
                ),
          ),
        ],
      ),
      body:
          _tab == 0
              ? DashboardScreen(
                key: ValueKey<int>(_dashboardEpoch),
                repository: widget.learningRepository,
              )
              : _ActivitiesTab(
                repository: widget.learningRepository,
                onActivityCompleted: _onActivityCompleted,
              ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (index) => setState(() => _tab = index),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.insights_outlined),
            selectedIcon: Icon(Icons.insights),
            label: 'Progresso',
          ),
          NavigationDestination(
            icon: Icon(Icons.school_outlined),
            selectedIcon: Icon(Icons.school),
            label: 'Atividades',
          ),
        ],
      ),
    );
  }
}

class _ActivitiesTab extends StatefulWidget {
  const _ActivitiesTab({
    required this.repository,
    required this.onActivityCompleted,
  });

  final LearningRepository repository;
  final VoidCallback onActivityCompleted;

  @override
  State<_ActivitiesTab> createState() => _ActivitiesTabState();
}

class _ActivitiesTabState extends State<_ActivitiesTab> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.repository.loadActivities();
  }

  Future<void> _refresh() async {
    setState(() => _future = widget.repository.loadActivities());
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          final error = snapshot.error;
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    error is ApiException
                        ? error.message
                        : 'Não foi possível carregar as atividades.',
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: _refresh,
                    child: const Text('Tentar novamente'),
                  ),
                ],
              ),
            ),
          );
        }

        final data = snapshot.data ?? const <String, dynamic>{};
        final quizzes = (data['quizzes'] as List<dynamic>? ?? const []);
        final prompts =
            (data['pronunciationPrompts'] as List<dynamic>? ?? const []);
        final flashcards = (data['flashcards'] as List<dynamic>? ?? const []);

        return RefreshIndicator(
          onRefresh: _refresh,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _SectionHeader(
                title: 'Quiz',
                emptyMessage:
                    quizzes.isEmpty
                        ? 'Ainda não há quizzes publicados para a tua escola.'
                        : null,
              ),
              ...quizzes.map((quiz) {
                final map = quiz as Map<String, dynamic>;
                return Card(
                  child: ListTile(
                    leading: const Icon(
                      Icons.quiz_outlined,
                      color: LingoColors.accent,
                    ),
                    title: Text('${map['title']}'),
                    subtitle: Text(
                      '${map['questionCount']} perguntas',
                      style: const TextStyle(fontSize: 12),
                    ),
                    onTap:
                        () => Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder:
                                (_) => QuizScreen(
                                  repository: widget.repository,
                                  quizId: '${map['id']}',
                                  onCompleted: widget.onActivityCompleted,
                                ),
                          ),
                        ),
                  ),
                );
              }),
              const SizedBox(height: 12),
              _SectionHeader(
                title: 'Pronúncia',
                emptyMessage:
                    prompts.isEmpty
                        ? 'Ainda não há frases de pronúncia publicadas.'
                        : null,
              ),
              ...prompts.map((prompt) {
                final map = prompt as Map<String, dynamic>;
                return Card(
                  child: ListTile(
                    leading: const Icon(
                      Icons.mic_none,
                      color: LingoColors.accent,
                    ),
                    title: Text('${map['text']}'),
                    subtitle: Text(
                      '${map['language'] ?? 'idioma do teu perfil'}',
                      style: const TextStyle(fontSize: 12),
                    ),
                    onTap:
                        () => Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder:
                                (_) => PronunciationScreen(
                                  repository: widget.repository,
                                  targetText: '${map['text']}',
                                  language: map['language'] as String?,
                                  onCompleted: widget.onActivityCompleted,
                                ),
                          ),
                        ),
                  ),
                );
              }),
              const SizedBox(height: 12),
              _SectionHeader(
                title: 'Flashcards',
                emptyMessage:
                    flashcards.isEmpty
                        ? 'Ainda não há cartas na biblioteca da tua escola.'
                        : null,
              ),
              if (flashcards.isNotEmpty)
                Card(
                  child: ListTile(
                    leading: const Icon(
                      Icons.style_outlined,
                      color: LingoColors.accent,
                    ),
                    title: const Text('Sessão de revisão espaçada'),
                    subtitle: Text(
                      '${flashcards.length} cartas na biblioteca',
                      style: const TextStyle(fontSize: 12),
                    ),
                    onTap:
                        () => Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder:
                                (_) => FlashcardsScreen(
                                  repository: widget.repository,
                                  onCompleted: widget.onActivityCompleted,
                                ),
                          ),
                        ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, this.emptyMessage});

  final String title;
  final String? emptyMessage;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
          if (emptyMessage != null) ...[
            const SizedBox(height: 4),
            Text(
              emptyMessage!,
              style: const TextStyle(
                color: LingoColors.textSecondary,
                fontSize: 12,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
