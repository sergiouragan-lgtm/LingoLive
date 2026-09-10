import 'package:flutter/material.dart';

class EbookReaderPage extends StatelessWidget {
  const EbookReaderPage({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Inglês para reuniões')),
    body: const SelectionArea(
      child: SingleChildScrollView(
        padding: EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Capítulo 1',
              style: TextStyle(
                color: Color(0xFF7C3AED),
                fontWeight: FontWeight.w800,
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Abrir uma reunião',
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900),
            ),
            SizedBox(height: 18),
            Text(
              'Use frases claras para iniciar e confirmar a agenda.',
              style: TextStyle(fontSize: 18, height: 1.6),
            ),
          ],
        ),
      ),
    ),
  );
}
