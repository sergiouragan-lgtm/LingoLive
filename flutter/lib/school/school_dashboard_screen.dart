import 'package:flutter/material.dart';

class SchoolDashboardScreen extends StatelessWidget {
  const SchoolDashboardScreen({super.key});
  @override Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Painel da escola')),
    body: ListView(padding: const EdgeInsets.all(20), children: [
      Icon(Icons.school_outlined, size: 64, color: Theme.of(context).colorScheme.primary),
      const SizedBox(height: 16),
      Text('Acesso escolar protegido', textAlign: TextAlign.center, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
      const SizedBox(height: 10),
      const Text('Os indicadores da escola serão apresentados quando o backend multi-tenant confirmar a escola e o papel desta conta.', textAlign: TextAlign.center),
      const SizedBox(height: 24),
      const Card(child: Column(children: [
        ListTile(leading: Icon(Icons.people_outline), title: Text('Alunos e turmas'), trailing: Text('—')),
        ListTile(leading: Icon(Icons.co_present_outlined), title: Text('Professores'), trailing: Text('—')),
        ListTile(leading: Icon(Icons.analytics_outlined), title: Text('Relatórios'), trailing: Text('Sem dados autorizados')),
      ])),
    ]),
  );
}
