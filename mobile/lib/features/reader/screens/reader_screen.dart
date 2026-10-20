import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme.dart';
import '../models/reader_models.dart';
import '../providers/reader_provider.dart';
import '../widgets/block_renderer.dart';
import '../widgets/ai_assistant_sheet.dart';

class ReaderScreen extends ConsumerStatefulWidget {
  final String ebookId;
  const ReaderScreen({super.key, required this.ebookId});

  @override
  ConsumerState<ReaderScreen> createState() => _ReaderScreenState();
}

class _ReaderScreenState extends ConsumerState<ReaderScreen> {
  final _scroll = ScrollController();

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  void _openAssistant(String chapterId) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => AiAssistantSheet(
        ebookId: widget.ebookId,
        chapterId: chapterId,
      ),
    );
  }

  void _openChapterList(ReaderState state) {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => _ChapterListSheet(
        state: state,
        onSelect: (idx) {
          ref.read(currentChapterIndexProvider.notifier).state = idx;
          Navigator.pop(ctx);
          _scroll.jumpTo(0);
        },
      ),
    );
  }

  Future<void> _markComplete(ReaderState state) async {
    final chapter = state.currentChapter;
    if (chapter == null) return;
    try {
      final fn = ref.read(markCompleteProvider);
      await fn(widget.ebookId, chapter.id);
      ref.invalidate(readerProvider(widget.ebookId));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Capítulo marcado como concluído!')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final asyncReader = ref.watch(readerProvider(widget.ebookId));
    final chapterIdx = ref.watch(currentChapterIndexProvider);

    return asyncReader.when(
      loading: () => Scaffold(
        appBar: AppBar(),
        body: const Center(child: CircularProgressIndicator()),
      ),
      error: (e, _) => Scaffold(
        appBar: AppBar(),
        body: Center(child: Text('Erro ao carregar: $e')),
      ),
      data: (state) {
        final effectiveIdx = chapterIdx.clamp(0, (state.chapters.length - 1).clamp(0, 999));
        final chapter = state.chapters.isNotEmpty
            ? state.chapters[effectiveIdx]
            : null;

        return Scaffold(
          appBar: AppBar(
            title: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(state.ebookTitle,
                  style: const TextStyle(fontSize: 13, color: Colors.grey),
                  overflow: TextOverflow.ellipsis),
                if (chapter != null)
                  Text(chapter.title,
                    style: const TextStyle(
                      fontSize: 16, fontWeight: FontWeight.w700),
                    overflow: TextOverflow.ellipsis),
              ],
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.list_alt_outlined),
                tooltip: 'Capítulos',
                onPressed: () => _openChapterList(state),
              ),
              if (chapter != null)
                IconButton(
                  icon: const Icon(Icons.auto_awesome),
                  tooltip: 'Assistente IA',
                  onPressed: () => _openAssistant(chapter.id),
                ),
            ],
          ),
          body: chapter == null
              ? const Center(child: Text('Nenhum capítulo disponível.'))
              : Column(
                  children: [
                    // Progress bar
                    LinearProgressIndicator(
                      value: state.chapters.isEmpty
                          ? 0
                          : (effectiveIdx + 1) / state.chapters.length,
                      backgroundColor: AppTheme.primary.withOpacity(0.12),
                      valueColor: AlwaysStoppedAnimation(AppTheme.primary),
                      minHeight: 3,
                    ),

                    // Content
                    Expanded(
                      child: ListView.builder(
                        controller: _scroll,
                        padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
                        itemCount: chapter.blocks.length,
                        itemBuilder: (_, i) =>
                            BlockRenderer(block: chapter.blocks[i]),
                      ),
                    ),
                  ],
                ),

          // Bottom nav + complete
          bottomNavigationBar: chapter == null
              ? null
              : SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                    child: Row(
                      children: [
                        // Previous
                        IconButton(
                          onPressed: effectiveIdx > 0
                              ? () {
                                  ref.read(currentChapterIndexProvider.notifier)
                                      .state = effectiveIdx - 1;
                                  _scroll.jumpTo(0);
                                }
                              : null,
                          icon: const Icon(Icons.chevron_left),
                          style: IconButton.styleFrom(
                            backgroundColor: Theme.of(context)
                                .colorScheme
                                .surfaceVariant,
                          ),
                        ),
                        const SizedBox(width: 8),

                        // Mark complete / next
                        Expanded(
                          child: chapter.isCompleted
                              ? ElevatedButton.icon(
                                  onPressed: effectiveIdx < state.chapters.length - 1
                                      ? () {
                                          ref
                                              .read(currentChapterIndexProvider
                                                  .notifier)
                                              .state = effectiveIdx + 1;
                                          _scroll.jumpTo(0);
                                        }
                                      : null,
                                  icon: const Icon(Icons.check_circle_outline),
                                  label: effectiveIdx < state.chapters.length - 1
                                      ? const Text('Próximo capítulo')
                                      : const Text('Concluído'),
                                )
                              : ElevatedButton(
                                  onPressed: () => _markComplete(state),
                                  child: const Text('Marcar como concluído'),
                                ),
                        ),

                        const SizedBox(width: 8),
                        // Next
                        IconButton(
                          onPressed: effectiveIdx < state.chapters.length - 1
                              ? () {
                                  ref.read(currentChapterIndexProvider.notifier)
                                      .state = effectiveIdx + 1;
                                  _scroll.jumpTo(0);
                                }
                              : null,
                          icon: const Icon(Icons.chevron_right),
                          style: IconButton.styleFrom(
                            backgroundColor: Theme.of(context)
                                .colorScheme
                                .surfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
        );
      },
    );
  }
}

class _ChapterListSheet extends StatelessWidget {
  final ReaderState state;
  final void Function(int) onSelect;

  const _ChapterListSheet({required this.state, required this.onSelect});

  @override
  Widget build(BuildContext context) => Column(
    mainAxisSize: MainAxisSize.min,
    children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
        child: Text('Capítulos',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w700)),
      ),
      const Divider(height: 1),
      Flexible(
        child: ListView.builder(
          shrinkWrap: true,
          itemCount: state.chapters.length,
          itemBuilder: (_, i) {
            final ch = state.chapters[i];
            return ListTile(
              leading: CircleAvatar(
                radius: 14,
                backgroundColor: ch.isCompleted
                    ? Colors.green.shade100
                    : AppTheme.primary.withOpacity(0.1),
                child: ch.isCompleted
                    ? const Icon(Icons.check, size: 14, color: Colors.green)
                    : Text('${i + 1}',
                        style: const TextStyle(
                          fontSize: 11, fontWeight: FontWeight.w700,
                          color: AppTheme.primary)),
              ),
              title: Text(ch.title,
                style: const TextStyle(fontSize: 14)),
              onTap: () => onSelect(i),
            );
          },
        ),
      ),
      const SizedBox(height: 16),
    ],
  );
}
