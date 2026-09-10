import 'package:flutter/material.dart';

class ExercisesPage extends StatefulWidget {
  const ExercisesPage({super.key});
  @override
  State<ExercisesPage> createState() => _ExercisesPageState();
}

class _ExercisesPageState extends State<ExercisesPage> {
  String? answer;
  @override
  Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.all(20),
    children: [
      const Text(
        'Praticar',
        style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900),
      ),
      const SizedBox(height: 18),
      const Text('Complete: Could we ___ the agenda first?'),
      RadioGroup<String>(
        groupValue: answer,
        onChanged: (value) => setState(() => answer = value),
        child: Column(
          children: [
            for (final option in ['review', 'reviews', 'reviewed'])
              RadioListTile(value: option, title: Text(option)),
          ],
        ),
      ),
      FilledButton(
        onPressed: answer == null
            ? null
            : () => ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    answer == 'review'
                        ? 'Resposta correta!'
                        : 'Tente novamente.',
                  ),
                ),
              ),
        child: const Text('Confirmar'),
      ),
    ],
  );
}
