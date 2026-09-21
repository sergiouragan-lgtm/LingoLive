import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api.dart';

class AiMessage {
  final String role;
  final String content;
  const AiMessage({required this.role, required this.content});
}

class AiAssistantSheet extends ConsumerStatefulWidget {
  final String ebookId;
  final String chapterId;

  const AiAssistantSheet({
    super.key,
    required this.ebookId,
    required this.chapterId,
  });

  @override
  ConsumerState<AiAssistantSheet> createState() => _AiAssistantSheetState();
}

class _AiAssistantSheetState extends ConsumerState<AiAssistantSheet> {
  final _ctrl = TextEditingController();
  final _scroll = ScrollController();
  final List<AiMessage> _messages = [];
  bool _loading = false;

  @override
  void dispose() {
    _ctrl.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final text = _ctrl.text.trim();
    if (text.isEmpty || _loading) return;
    _ctrl.clear();
    setState(() {
      _messages.add(AiMessage(role: 'user', content: text));
      _loading = true;
    });
    _scrollToBottom();
    try {
      final client = ref.read(apiClientProvider);
      final res = await client.post(
        ApiConstants.ebookAssistant,
        data: {
          'ebookId': widget.ebookId,
          'chapterId': widget.chapterId,
          'message': text,
          'history': _messages
              .take(_messages.length - 1)
              .map((m) => {'role': m.role, 'content': m.content})
              .toList(),
        },
      );
      final reply = res.data['reply'] as String? ?? '';
      setState(() => _messages.add(AiMessage(role: 'assistant', content: reply)));
    } catch (e) {
      setState(() => _messages.add(AiMessage(
        role: 'assistant',
        content: 'Ocorreu um erro ao contactar o assistente. Tenta novamente.',
      )));
    } finally {
      if (mounted) {
        setState(() => _loading = false);
        _scrollToBottom();
      }
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          _scroll.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      minChildSize: 0.3,
      maxChildSize: 0.92,
      expand: false,
      builder: (context, scrollCtrl) => Column(
        children: [
          // Handle
          Container(
            margin: const EdgeInsets.symmetric(vertical: 10),
            width: 40, height: 4,
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.outline.withOpacity(0.4),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.auto_awesome,
                    color: AppTheme.primary, size: 18),
                ),
                const SizedBox(width: 10),
                const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Assistente IA',
                      style: TextStyle(
                        fontWeight: FontWeight.w700, fontSize: 15)),
                    Text('Tira as tuas dúvidas',
                      style: TextStyle(fontSize: 12, color: Colors.grey)),
                  ],
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Messages
          Expanded(
            child: _messages.isEmpty
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.auto_awesome,
                          size: 48,
                          color: AppTheme.primary.withOpacity(0.3)),
                        const SizedBox(height: 12),
                        const Text('Pergunta algo sobre este capítulo',
                          style: TextStyle(color: Colors.grey)),
                      ],
                    ),
                  )
                : ListView.builder(
                    controller: _scroll,
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (_, i) => _MessageBubble(msg: _messages[i]),
                  ),
          ),

          if (_loading)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  const SizedBox(
                    width: 16, height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2)),
                  const SizedBox(width: 10),
                  Text('A pensar...',
                    style: TextStyle(
                      color: Theme.of(context)
                          .colorScheme
                          .onSurface
                          .withOpacity(0.5))),
                ],
              ),
            ),

          // Input
          const Divider(height: 1),
          Padding(
            padding: EdgeInsets.only(
              left: 12, right: 12, top: 10,
              bottom: MediaQuery.of(context).viewInsets.bottom + 12,
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _ctrl,
                    decoration: InputDecoration(
                      hintText: 'Escreve a tua pergunta…',
                      filled: true,
                      fillColor: Theme.of(context)
                          .colorScheme
                          .surfaceVariant
                          .withOpacity(0.5),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 10),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide.none,
                      ),
                    ),
                    maxLines: 4,
                    minLines: 1,
                    textInputAction: TextInputAction.send,
                    onSubmitted: (_) => _send(),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  onPressed: _loading ? null : _send,
                  icon: const Icon(Icons.send_rounded),
                  color: AppTheme.primary,
                  style: IconButton.styleFrom(
                    backgroundColor: AppTheme.primary.withOpacity(0.1),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final AiMessage msg;
  const _MessageBubble({required this.msg});

  bool get isUser => msg.role == 'user';

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.78),
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isUser
              ? AppTheme.primary
              : Theme.of(context)
                  .colorScheme
                  .surfaceVariant
                  .withOpacity(0.7),
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: isUser
                ? const Radius.circular(16)
                : const Radius.circular(4),
            bottomRight: isUser
                ? const Radius.circular(4)
                : const Radius.circular(16),
          ),
        ),
        child: Text(
          msg.content,
          style: TextStyle(
            color: isUser ? Colors.white : null,
            height: 1.5,
          ),
        ),
      ),
    );
  }
}
