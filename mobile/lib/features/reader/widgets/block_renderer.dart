import 'package:flutter/material.dart';

import '../../../app/theme.dart';
import '../models/reader_models.dart';

class BlockRenderer extends StatelessWidget {
  final ContentBlock block;
  const BlockRenderer({super.key, required this.block});

  @override
  Widget build(BuildContext context) {
    switch (block.type) {
      case 'paragraph':
        return _Paragraph(data: block.data);
      case 'dialogue':
        return _Dialogue(data: block.data);
      case 'grammar-table':
        return _GrammarTable(data: block.data);
      case 'vocab-card':
        return _VocabCard(data: block.data);
      case 'accordion':
        return _Accordion(data: block.data);
      case 'quiz':
        return _Quiz(data: block.data);
      case 'audio-player':
        return _AudioPlayer(data: block.data);
      default:
        return _Paragraph(data: block.data);
    }
  }
}

class _Paragraph extends StatelessWidget {
  final Map<String, dynamic> data;
  const _Paragraph({required this.data});

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 16),
    child: Text(
      data['text'] as String? ?? '',
      style: Theme.of(context).textTheme.bodyLarge?.copyWith(height: 1.7),
    ),
  );
}

class _Dialogue extends StatelessWidget {
  final Map<String, dynamic> data;
  const _Dialogue({required this.data});

  @override
  Widget build(BuildContext context) {
    final lines = (data['lines'] as List?) ?? [];
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Theme.of(context).colorScheme.outline.withOpacity(0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            const Icon(Icons.chat_bubble_outline, size: 16),
            const SizedBox(width: 6),
            Text(data['title'] as String? ?? 'Diálogo',
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
          ]),
          const SizedBox(height: 12),
          ...lines.map((line) {
            final l = line as Map<String, dynamic>;
            final speaker = l['speaker'] as String? ?? '';
            final text = l['text'] as String? ?? '';
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    width: 80,
                    child: Text(speaker,
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                        color: AppTheme.primary,
                      )),
                  ),
                  Expanded(child: Text(text)),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}

class _GrammarTable extends StatelessWidget {
  final Map<String, dynamic> data;
  const _GrammarTable({required this.data});

  @override
  Widget build(BuildContext context) {
    final headers = (data['headers'] as List?)?.cast<String>() ?? [];
    final rows = (data['rows'] as List?) ?? [];
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Theme.of(context).colorScheme.outline.withOpacity(0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (data['title'] != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 12, 14, 4),
              child: Text(data['title'] as String,
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
            ),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: DataTable(
              headingRowColor: WidgetStateProperty.all(
                AppTheme.primary.withOpacity(0.08)),
              columns: headers
                  .map((h) => DataColumn(
                    label: Text(h,
                      style: const TextStyle(fontWeight: FontWeight.w700))))
                  .toList(),
              rows: rows.map((row) {
                final cells = (row as List).cast<String>();
                return DataRow(
                  cells: cells
                      .map((c) => DataCell(Text(c)))
                      .toList(),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}

class _VocabCard extends StatefulWidget {
  final Map<String, dynamic> data;
  const _VocabCard({required this.data});

  @override
  State<_VocabCard> createState() => _VocabCardState();
}

class _VocabCardState extends State<_VocabCard> {
  bool _showTranslation = false;

  @override
  Widget build(BuildContext context) {
    final word = widget.data['word'] as String? ?? '';
    final translation = widget.data['translation'] as String? ?? '';
    final example = widget.data['example'] as String?;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      color: AppTheme.primary.withOpacity(0.06),
      child: InkWell(
        onTap: () => setState(() => _showTranslation = !_showTranslation),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.translate, size: 16, color: AppTheme.primary),
                  const SizedBox(width: 6),
                  Text(word,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700, fontSize: 16,
                      color: AppTheme.primary)),
                  const Spacer(),
                  Icon(_showTranslation
                    ? Icons.visibility_off_outlined
                    : Icons.visibility_outlined,
                    size: 18,
                    color: AppTheme.primary.withOpacity(0.6)),
                ],
              ),
              if (_showTranslation) ...[
                const SizedBox(height: 8),
                Text(translation,
                  style: const TextStyle(fontSize: 15)),
                if (example != null) ...[
                  const SizedBox(height: 6),
                  Text(example,
                    style: TextStyle(
                      fontSize: 13,
                      fontStyle: FontStyle.italic,
                      color: Theme.of(context)
                          .colorScheme
                          .onSurface
                          .withOpacity(0.6))),
                ],
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _Accordion extends StatefulWidget {
  final Map<String, dynamic> data;
  const _Accordion({required this.data});

  @override
  State<_Accordion> createState() => _AccordionState();
}

class _AccordionState extends State<_Accordion> {
  bool _open = false;

  @override
  Widget build(BuildContext context) {
    final title = widget.data['title'] as String? ?? '';
    final content = widget.data['content'] as String? ?? '';
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Column(
        children: [
          ListTile(
            title: Text(title,
              style: const TextStyle(fontWeight: FontWeight.w600)),
            trailing: Icon(_open
              ? Icons.keyboard_arrow_up
              : Icons.keyboard_arrow_down),
            onTap: () => setState(() => _open = !_open),
          ),
          if (_open)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
              child: Text(content,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  height: 1.6)),
            ),
        ],
      ),
    );
  }
}

class _Quiz extends StatefulWidget {
  final Map<String, dynamic> data;
  const _Quiz({required this.data});

  @override
  State<_Quiz> createState() => _QuizState();
}

class _QuizState extends State<_Quiz> {
  int? _selected;
  bool _submitted = false;

  @override
  Widget build(BuildContext context) {
    final question = widget.data['question'] as String? ?? '';
    final options = (widget.data['options'] as List?)?.cast<String>() ?? [];
    final correct = (widget.data['correctIndex'] as num?)?.toInt() ?? 0;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.primary.withOpacity(0.3)),
        color: AppTheme.primary.withOpacity(0.04),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            const Icon(Icons.quiz_outlined, size: 16, color: AppTheme.primary),
            const SizedBox(width: 6),
            const Text('Pergunta', style: TextStyle(
              fontWeight: FontWeight.w700, fontSize: 12,
              color: AppTheme.primary)),
          ]),
          const SizedBox(height: 10),
          Text(question,
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
          const SizedBox(height: 12),
          ...options.asMap().entries.map((entry) {
            final idx = entry.key;
            final opt = entry.value;
            Color? bg;
            if (_submitted) {
              if (idx == correct) bg = Colors.green.shade50;
              else if (idx == _selected) bg = Colors.red.shade50;
            } else if (_selected == idx) {
              bg = AppTheme.primary.withOpacity(0.1);
            }
            return InkWell(
              onTap: _submitted ? null : () => setState(() => _selected = idx),
              child: Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.symmetric(
                  horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: bg,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: _selected == idx
                        ? AppTheme.primary
                        : Theme.of(context)
                            .colorScheme
                            .outline
                            .withOpacity(0.4),
                  ),
                ),
                child: Text(opt),
              ),
            );
          }),
          if (!_submitted && _selected != null)
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => setState(() => _submitted = true),
                child: const Text('Verificar'),
              ),
            ),
          if (_submitted)
            Text(
              _selected == correct ? '✓ Correto!' : '✗ A resposta correta é: ${options[correct]}',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: _selected == correct ? Colors.green : Colors.red,
              ),
            ),
        ],
      ),
    );
  }
}

class _AudioPlayer extends StatelessWidget {
  final Map<String, dynamic> data;
  const _AudioPlayer({required this.data});

  @override
  Widget build(BuildContext context) {
    final label = data['label'] as String? ?? 'Áudio';
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        color: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.5),
      ),
      child: Row(
        children: [
          Container(
            width: 40, height: 40,
            decoration: BoxDecoration(
              color: AppTheme.primary,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.play_arrow, color: Colors.white),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                const SizedBox(height: 4),
                LinearProgressIndicator(
                  value: 0,
                  backgroundColor: AppTheme.primary.withOpacity(0.15),
                  valueColor: AlwaysStoppedAnimation(AppTheme.primary),
                  minHeight: 3,
                  borderRadius: BorderRadius.circular(2),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
