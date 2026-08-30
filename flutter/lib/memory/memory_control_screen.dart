import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../firebase_services.dart';

class MemoryControlScreen extends StatefulWidget {
  final User user;
  const MemoryControlScreen({super.key, required this.user});

  @override
  State<MemoryControlScreen> createState() => _MemoryControlScreenState();
}

class _MemoryControlScreenState extends State<MemoryControlScreen> {
  bool _enabled = true;
  String _correction = 'Equilibrado';
  String _frequency = 'Por definir';
  String _goals = 'Por definir';
  bool _loading = true;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final snapshot = await FirebaseServices.firestore
          .collection('users').doc(widget.user.uid)
          .collection('settings').doc('memory').get();
      final data = snapshot.data();
      if (data != null) {
        _enabled = data['enabled'] as bool? ?? true;
        _correction = data['correctionStyle'] as String? ?? _correction;
        _frequency = data['studyFrequency'] as String? ?? _frequency;
        _goals = data['personalGoals'] as String? ?? _goals;
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await FirebaseServices.firestore
          .collection('users').doc(widget.user.uid)
          .collection('settings').doc('memory').set({
        'enabled': _enabled,
        'correctionStyle': _correction,
        'studyFrequency': _frequency,
        'personalGoals': _goals,
        'updatedAt': DateTime.now().toUtc().toIso8601String(),
      });
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Preferências guardadas.')));
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Não foi possível guardar as alterações.')));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _choose(String title, List<String> values, ValueChanged<String> onSelected) async {
    final selected = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          ListTile(title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700))),
          ...values.map((value) => ListTile(title: Text(value), onTap: () => Navigator.pop(context, value))),
        ]),
      ),
    );
    if (selected != null) setState(() => onSelected(selected));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final dark = theme.brightness == Brightness.dark;
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Controlo da memória'),
        centerTitle: true,
        actions: [IconButton(tooltip: 'Terminar sessão', onPressed: FirebaseAuth.instance.signOut, icon: const Icon(Icons.logout_rounded))],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: 2,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), label: 'Início'),
          NavigationDestination(icon: Icon(Icons.menu_book_outlined), label: 'Aprender'),
          NavigationDestination(icon: Icon(Icons.psychology_outlined), label: 'Memória'),
          NavigationDestination(icon: Icon(Icons.person_outline), label: 'Perfil'),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(22, 12, 22, 28),
          children: [
            const SizedBox(height: 8),
            Center(child: Container(width: 82, height: 82, decoration: BoxDecoration(shape: BoxShape.circle, color: colors.primary.withValues(alpha: .08)), child: Icon(Icons.shield_outlined, size: 58, color: colors.primary))),
            const SizedBox(height: 20),
            Text('Os seus dados de\naprendizagem pertencem-lhe.', textAlign: TextAlign.center, style: theme.textTheme.headlineSmall?.copyWith(fontFamily: 'serif', fontWeight: FontWeight.w700, height: 1.1)),
            const SizedBox(height: 10),
            Text('Controle como a sua memória é usada\npara personalizar a sua experiência.', textAlign: TextAlign.center, style: theme.textTheme.bodySmall?.copyWith(color: colors.onSurfaceVariant)),
            const SizedBox(height: 28),
            Container(
              decoration: BoxDecoration(color: dark ? colors.surfaceContainer : Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: colors.outlineVariant)),
              child: Column(children: [
                SwitchListTile(title: const Text('Personalização com memória', style: TextStyle(fontWeight: FontWeight.w700)), subtitle: const Text('O tutor pode usar e atualizar a memória'), value: _enabled, onChanged: (value) => setState(() => _enabled = value)),
                const Divider(height: 1),
                _SettingTile(icon: Icons.tune, label: 'Estilo de correção', value: _correction, onTap: () => _choose('Estilo de correção', ['Suave', 'Equilibrado', 'Direto'], (value) => _correction = value)),
                _SettingTile(icon: Icons.calendar_month_outlined, label: 'Frequência de estudo', value: _frequency, onTap: () => _choose('Frequência de estudo', ['Diária', '3 vezes por semana', 'Semanal', 'Por definir'], (value) => _frequency = value)),
                _SettingTile(icon: Icons.track_changes_outlined, label: 'Objetivos pessoais', value: _goals, onTap: () => _choose('Objetivos pessoais', ['Conversação', 'Trabalho', 'Viagens', 'Exames', 'Por definir'], (value) => _goals = value)),
              ]),
            ),
            const SizedBox(height: 16),
            FilledButton(onPressed: _saving ? null : _save, child: Padding(padding: const EdgeInsets.symmetric(vertical: 14), child: Text(_saving ? 'A guardar…' : 'Guardar alterações'))),
            const SizedBox(height: 12),
            OutlinedButton.icon(onPressed: _enabled ? () => setState(() => _enabled = false) : null, icon: const Icon(Icons.shield_outlined), label: const Padding(padding: EdgeInsets.symmetric(vertical: 12), child: Text('Desativar preserva os dados e impede o uso.'))),
            const SizedBox(height: 10),
            OutlinedButton.icon(onPressed: null, icon: const Icon(Icons.delete_outline), label: const Padding(padding: EdgeInsets.symmetric(vertical: 12), child: Text('Eliminar toda a memória pelo portal de privacidade'))),
          ],
        ),
      ),
    );
  }
}

class _SettingTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final VoidCallback onTap;
  const _SettingTile({required this.icon, required this.label, required this.value, required this.onTap});

  @override
  Widget build(BuildContext context) => ListTile(
    leading: Icon(icon, color: Theme.of(context).colorScheme.primary),
    title: Text(label),
    trailing: Row(mainAxisSize: MainAxisSize.min, children: [Text(value, style: Theme.of(context).textTheme.bodySmall), const Icon(Icons.chevron_right)]),
    onTap: onTap,
  );
}
