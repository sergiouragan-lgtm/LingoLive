import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'billing_repository.dart';

class SubscriptionScreen extends StatefulWidget {
  const SubscriptionScreen({super.key});
  @override
  State<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends State<SubscriptionScreen> {
  final _repository = BillingRepository();
  StreamSubscription<Uri>? _linkSubscription;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _linkSubscription = AppLinks().uriLinkStream.listen((uri) {
      if (uri.scheme == 'lingolive' && uri.host == 'billing' && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Regresso recebido. A confirmar a subscrição pelo webhook seguro…')));
      }
    });
  }

  @override
  void dispose() {
    _linkSubscription?.cancel();
    super.dispose();
  }

  Future<void> _checkout(String planId) async {
    setState(() => _busy = true);
    try {
      final uri = await _repository.createCheckout(planId);
      if (!await launchUrl(uri, mode: LaunchMode.externalApplication))
        throw StateError('Não foi possível abrir o pagamento.');
    } catch (error) {
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text(error.toString().replaceFirst('Bad state: ', ''))));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      return const Scaffold(
          body:
              Center(child: Text('Sessão expirada. Volte a iniciar sessão.')));
    }
    final uid = user.uid;
    return Scaffold(
      appBar: AppBar(title: const Text('Plano e faturação')),
      body: StreamBuilder<DocumentSnapshot<Map<String, dynamic>>>(
        stream: _repository.watchSubscription(uid),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting)
            return const Center(child: CircularProgressIndicator());
          if (snapshot.hasError)
            return const Center(
                child: Text('Não foi possível carregar a subscrição.'));
          final data = snapshot.data?.data();
          final active =
              data != null && ['active', 'trialing'].contains(data['status']);
          return ListView(padding: const EdgeInsets.all(20), children: [
            Icon(
                active
                    ? Icons.verified_user_outlined
                    : Icons.credit_card_off_outlined,
                size: 64,
                color: Theme.of(context).colorScheme.primary),
            const SizedBox(height: 16),
            Text(active ? 'Subscrição ativa' : 'Sem plano ativo',
                textAlign: TextAlign.center,
                style: Theme.of(context)
                    .textTheme
                    .headlineSmall
                    ?.copyWith(fontWeight: FontWeight.w800)),
            if (active) ...[
              const SizedBox(height: 20),
              Card(
                  child: Column(children: [
                ListTile(
                    title: const Text('Plano atual'),
                    trailing: Text(data['planId']?.toString() ?? '—')),
                ListTile(
                    title: const Text('Próxima cobrança'),
                    trailing:
                        Text(data['currentPeriodEnd']?.toString() ?? '—')),
                ListTile(
                    title: const Text('Cancelamento agendado'),
                    trailing: Text(
                        data['cancelAtPeriodEnd'] == true ? 'Sim' : 'Não')),
              ])),
              const SizedBox(height: 12),
              const Text(
                  'A alteração e o cancelamento requerem o portal seguro de faturação.'),
            ] else ...[
              const SizedBox(height: 24),
              ...const [
                ('Plano mensal individual', 'individual_monthly'),
                ('Plano trimestral', 'quarterly'),
                ('Plano anual', 'yearly'),
              ].map((plan) => Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(plan.$1,
                                style: Theme.of(context)
                                    .textTheme
                                    .titleLarge
                                    ?.copyWith(fontWeight: FontWeight.w800)),
                            const Text(
                                'Preço e benefícios confirmados no pagamento seguro.'),
                            const SizedBox(height: 14),
                            SizedBox(
                                width: double.infinity,
                                child: FilledButton(
                                    onPressed:
                                        _busy ? null : () => _checkout(plan.$2),
                                    child: const Text('Continuar'))),
                          ])))),
            ],
          ]);
        },
      ),
    );
  }
}
