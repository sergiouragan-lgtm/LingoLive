import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/api_client.dart';
import '../../core/crash_reporter.dart';
import '../../core/theme.dart';
import '../../data/billing_repository.dart';

/// Planos disponíveis. Os montantes reais são cobrados a partir de
/// `server/config/plans.ts`; estes rótulos são apenas apresentação.
class BillingPlan {
  const BillingPlan({
    required this.id,
    required this.name,
    required this.price,
  });

  final String id;
  final String name;
  final String price;
}

const List<BillingPlan> kBillingPlans = <BillingPlan>[
  BillingPlan(id: 'monthly', name: 'Plano Mensal', price: 'USD 5,00 / mês'),
  BillingPlan(id: 'quarterly', name: 'Plano Trimestral', price: 'USD 15,00'),
  BillingPlan(id: 'yearly', name: 'Plano Anual', price: 'USD 60,00 / ano'),
];

/// Checkout mobile.
///
/// O pagamento decorre no navegador externo (requisito do Stripe Checkout) e o
/// utilizador regressa por deep link. O desbloqueio depende sempre de
/// `verifySession`, nunca do link de retorno em si.
class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({
    super.key,
    required this.repository,
    this.pendingSessionId,
  });

  final BillingRepository repository;

  /// Sessão devolvida por um deep link de retorno, a verificar ao abrir o ecrã.
  final String? pendingSessionId;

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen>
    with WidgetsBindingObserver {
  Entitlement? _entitlement;
  String? _openSessionId;
  String? _status;
  String? _error;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _openSessionId = widget.pendingSessionId;
    _loadEntitlement();
    if (widget.pendingSessionId != null) {
      _verify(widget.pendingSessionId!);
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Num dispositivo real o utilizador pode fechar o navegador sem seguir o
    // link de retorno. Ao voltar à app verificamos a sessão pendente na mesma.
    if (state == AppLifecycleState.resumed &&
        _openSessionId != null &&
        !_busy) {
      _verify(_openSessionId!);
    }
  }

  Future<void> _loadEntitlement() async {
    try {
      final entitlement = await widget.repository.loadEntitlement();
      if (mounted) setState(() => _entitlement = entitlement);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    }
  }

  Future<void> _startCheckout(BillingPlan plan) async {
    setState(() {
      _busy = true;
      _error = null;
      _status = null;
    });
    try {
      final session = await widget.repository.createCheckoutSession(plan.id);
      _openSessionId = session.sessionId;

      final launched = await launchUrl(
        Uri.parse(session.url),
        mode: LaunchMode.externalApplication,
      );
      if (!launched) {
        setState(
          () => _error = 'Não foi possível abrir o checkout no navegador.',
        );
        return;
      }
      setState(() => _status = 'A aguardar a conclusão do pagamento…');
    } on ApiException catch (error, stack) {
      await CrashReporter.recordHandled(
        error,
        stack,
        reason: 'criação de checkout',
      );
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _verify(String sessionId) async {
    setState(() {
      _busy = true;
      _error = null;
      _status = 'A confirmar o pagamento…';
    });
    try {
      final verification = await widget.repository.verifySession(sessionId);
      if (!mounted) return;

      if (verification.paid) {
        _openSessionId = null;
        setState(() => _status = 'Pagamento confirmado. Subscrição ativa.');
        await _loadEntitlement();
      } else {
        setState(
          () =>
              _status =
                  'Pagamento ainda não concluído (estado: ${verification.paymentStatus}).',
        );
      }
    } on ApiException catch (error, stack) {
      await CrashReporter.recordHandled(
        error,
        stack,
        reason: 'verificação de checkout',
      );
      if (!mounted) return;
      setState(() {
        _status = null;
        _error = error.message;
      });
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final entitlement = _entitlement;
    return Scaffold(
      appBar: AppBar(title: const Text('Subscrição')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          if (entitlement != null)
            Card(
              child: ListTile(
                leading: Icon(
                  entitlement.active ? Icons.verified_user : Icons.lock_outline,
                  color:
                      entitlement.active
                          ? LingoColors.success
                          : LingoColors.textSecondary,
                ),
                title: Text(
                  entitlement.active
                      ? 'Subscrição ativa'
                      : 'Sem subscrição ativa',
                ),
                subtitle: Text(
                  entitlement.active
                      ? '${entitlement.planId ?? 'plano'} · válida até '
                          '${entitlement.paidUntil?.split('T').first ?? 'sem data'}'
                      : 'Estado: ${entitlement.subscriptionStatus}',
                  style: const TextStyle(fontSize: 12),
                ),
              ),
            ),
          if (_status != null) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                if (_busy)
                  const SizedBox(
                    height: 14,
                    width: 14,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                if (_busy) const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _status!,
                    style: const TextStyle(
                      color: LingoColors.accent,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
          ],
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: const TextStyle(color: LingoColors.danger)),
          ],
          if (_openSessionId != null) ...[
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: _busy ? null : () => _verify(_openSessionId!),
              icon: const Icon(Icons.refresh),
              label: const Text('Já paguei — verificar agora'),
            ),
          ],
          const SizedBox(height: 24),
          const Text(
            'Escolhe um plano',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          ...kBillingPlans.map(
            (plan) => Card(
              child: ListTile(
                title: Text(plan.name),
                subtitle: Text(
                  plan.price,
                  style: const TextStyle(fontSize: 12),
                ),
                trailing: FilledButton(
                  onPressed: _busy ? null : () => _startCheckout(plan),
                  child: const Text('Subscrever'),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'O pagamento é processado pelo Stripe num separador externo. Ao voltar '
            'à aplicação, a subscrição só é ativada depois de o servidor confirmar '
            'o pagamento junto do Stripe.',
            style: TextStyle(color: LingoColors.textSecondary, fontSize: 11),
          ),
        ],
      ),
    );
  }
}
