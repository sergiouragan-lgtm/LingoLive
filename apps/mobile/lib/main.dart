import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';

import 'app_shell.dart';
import 'core/api_client.dart';
import 'core/app_config.dart';
import 'core/crash_reporter.dart';
import 'core/deep_links.dart';
import 'core/push_messaging.dart';
import 'core/theme.dart';
import 'data/billing_repository.dart';
import 'data/learning_repository.dart';

Future<void> main() async {
  await CrashReporter.guard(() async {
    WidgetsFlutterBinding.ensureInitialized();
    await Firebase.initializeApp();
    await CrashReporter.install();

    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

    runApp(const LingoLiveApp());
  });
}

class LingoLiveApp extends StatefulWidget {
  const LingoLiveApp({super.key});

  @override
  State<LingoLiveApp> createState() => _LingoLiveAppState();
}

class _LingoLiveAppState extends State<LingoLiveApp> {
  final AppConfig _config = AppConfig.fromEnvironment();
  final GlobalKey<NavigatorState> _navigatorKey = GlobalKey<NavigatorState>();
  final DeepLinkListener _deepLinks = DeepLinkListener();

  late final ApiClient _api = ApiClient(baseUrl: _config.apiBaseUrl);
  late final LearningRepository _learning = LearningRepository(_api);
  late final BillingRepository _billing = BillingRepository(_api);
  late final PushMessaging _push = PushMessaging(_learning);

  /// Guarda um retorno de pagamento que chegou antes de a árvore de navegação
  /// existir (a app foi aberta pelo próprio deep link).
  BillingReturn? _pendingBillingReturn;
  bool _pushReady = false;

  @override
  void initState() {
    super.initState();
    _deepLinks.start(_onBillingReturn);
  }

  @override
  void dispose() {
    _deepLinks.dispose();
    _api.close();
    super.dispose();
  }

  void _onBillingReturn(BillingReturn result) {
    if (_navigatorKey.currentState == null) {
      // A app arrancou a partir do link: guardamos até haver navegador.
      _pendingBillingReturn = result;
      return;
    }
    AppShell.openBilling(
      _navigatorKey,
      _billing,
      result.success ? result.sessionId : null,
    );
  }

  /// Entrega um retorno de pagamento pendente assim que a sessão estiver
  /// autenticada e o navegador montado.
  void _drainPendingBillingReturn() {
    final pending = _pendingBillingReturn;
    if (pending == null) return;
    _pendingBillingReturn = null;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      AppShell.openBilling(
        _navigatorKey,
        _billing,
        pending.success ? pending.sessionId : null,
      );
    });
  }

  /// O push só é inicializado depois de haver sessão: o registo do token
  /// precisa de um ID token válido e o token tem de ficar ligado a este
  /// utilizador, não ao anterior.
  Future<void> _ensurePushRegistered(User user) async {
    if (_pushReady) return;
    _pushReady = true;
    await CrashReporter.identify(userId: user.uid);
    if (await _push.requestPermission()) {
      await _push.initialize(appVersion: _config.appVersion);
    }
  }

  Future<void> _teardownPush() async {
    if (!_pushReady) return;
    _pushReady = false;
    await _push.revoke();
    await CrashReporter.clearIdentity();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LingoLIVE',
      debugShowCheckedModeBanner: false,
      navigatorKey: _navigatorKey,
      theme: buildLingoTheme(),
      home: StreamBuilder<User?>(
        stream: FirebaseAuth.instance.authStateChanges(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            );
          }

          final user = snapshot.data;
          if (user == null) {
            _teardownPush();
            return const _SignedOutScreen();
          }

          _ensurePushRegistered(user);
          _drainPendingBillingReturn();
          return AppShell(
            learningRepository: _learning,
            billingRepository: _billing,
          );
        },
      ),
    );
  }
}

/// Ecrã de sessão terminada.
///
/// A autenticação continua a ser feita pelo fluxo de entrada canónico da
/// plataforma; aqui apenas indicamos que é preciso iniciar sessão.
class _SignedOutScreen extends StatelessWidget {
  const _SignedOutScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.translate, size: 56, color: LingoColors.accent),
              const SizedBox(height: 20),
              Text(
                'LingoLIVE IA',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 12),
              const Text(
                'Inicia sessão para aceder às tuas atividades, ao teu progresso '
                'e à tua subscrição.',
                textAlign: TextAlign.center,
                style: TextStyle(color: LingoColors.textSecondary),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
