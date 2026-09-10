import 'package:flutter/material.dart';

import '../../ebook_reader/presentation/ebook_reader_page.dart';

class CatalogPage extends StatelessWidget {
  const CatalogPage({super.key});
  @override
  Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.all(18),
    children: [
      const Text(
        'Biblioteca',
        style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900),
      ),
      const SizedBox(height: 16),
      Card(
        child: ListTile(
          onTap: () => Navigator.of(context).push(
            MaterialPageRoute<void>(builder: (_) => const EbookReaderPage()),
          ),
          leading: const Icon(
            Icons.menu_book_rounded,
            color: Color(0xFF7C3AED),
          ),
          title: const Text('Inglês para reuniões'),
          subtitle: const Text('Fascículo adaptativo · B2'),
          trailing: const Icon(Icons.chevron_right),
        ),
      ),
    ],
  );
}
