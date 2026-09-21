import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../models/ebook_listing.dart';
import '../providers/marketplace_provider.dart';

class MarketplaceScreen extends ConsumerWidget {
  const MarketplaceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncBooks = ref.watch(marketplaceProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Marketplace',
          style: TextStyle(fontWeight: FontWeight.w700)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/library'),
        ),
      ),
      body: asyncBooks.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erro: $e')),
        data: (books) => books.isEmpty
            ? const Center(child: Text('Nenhum e-book disponível de momento.'))
            : RefreshIndicator(
                onRefresh: () => ref.refresh(marketplaceProvider.future),
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: books.length,
                  itemBuilder: (_, i) => _EbookCard(book: books[i], ref: ref),
                ),
              ),
      ),
    );
  }
}

class _EbookCard extends StatefulWidget {
  final EbookListing book;
  final WidgetRef ref;

  const _EbookCard({required this.book, required this.ref});

  @override
  State<_EbookCard> createState() => _EbookCardState();
}

class _EbookCardState extends State<_EbookCard> {
  bool _enrolling = false;

  Color get _coverColor {
    try {
      final hex = (widget.book.coverColor ?? '#7C3AED').replaceAll('#', '');
      return Color(int.parse('FF$hex', radix: 16));
    } catch (_) {
      return AppTheme.primary;
    }
  }

  Future<void> _enroll() async {
    setState(() => _enrolling = true);
    try {
      final action = widget.ref.read(enrollActionProvider);
      await action(widget.book.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('E-book adicionado à biblioteca!')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _enrolling = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final book = widget.book;
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 56, height: 72,
              decoration: BoxDecoration(
                color: _coverColor,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.menu_book, color: Colors.white, size: 28),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(book.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700, fontSize: 15)),
                  if (book.subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(book.subtitle!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 12,
                        color: Theme.of(context)
                            .colorScheme
                            .onSurface
                            .withOpacity(0.6))),
                  ],
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      if (book.cefrLevel != null)
                        _chip(book.cefrLevel!, AppTheme.primary.withOpacity(0.1),
                          AppTheme.primary),
                      if (book.language != null) ...[
                        const SizedBox(width: 6),
                        _chip(book.language!, Colors.blue.shade50,
                          Colors.blue.shade700),
                      ],
                    ],
                  ),
                  const SizedBox(height: 8),
                  if (book.averageRating != null)
                    Row(
                      children: [
                        const Icon(Icons.star, color: Colors.amber, size: 14),
                        const SizedBox(width: 4),
                        Text(book.averageRating!.toStringAsFixed(1),
                          style: const TextStyle(fontSize: 12,
                            fontWeight: FontWeight.w600)),
                        const SizedBox(width: 6),
                        Text('(${book.enrolledCount} alunos)',
                          style: TextStyle(fontSize: 11,
                            color: Theme.of(context)
                                .colorScheme
                                .onSurface
                                .withOpacity(0.5))),
                      ],
                    ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: book.isEnrolled
                        ? OutlinedButton.icon(
                            onPressed: null,
                            icon: const Icon(Icons.check_circle_outline,
                              size: 16),
                            label: const Text('Na biblioteca'),
                          )
                        : ElevatedButton(
                            onPressed: _enrolling ? null : _enroll,
                            child: _enrolling
                                ? const SizedBox(
                                    width: 16, height: 16,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2, color: Colors.white))
                                : const Text('Adicionar'),
                          ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _chip(String label, Color bg, Color fg) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
    decoration: BoxDecoration(
      color: bg,
      borderRadius: BorderRadius.circular(99),
    ),
    child: Text(label,
      style: TextStyle(
        fontSize: 10,
        fontWeight: FontWeight.w700,
        color: fg,
      )),
  );
}
