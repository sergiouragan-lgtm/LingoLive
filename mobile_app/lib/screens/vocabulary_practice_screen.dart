import 'package:flutter/material.dart';
import '../services/local_cache_service.dart';
import '../models/sync_queue.dart';
import 'dart:async';

/// Vocabulary Practice Screen - Offline enabled
/// Features: Learn words, practice pronunciation, track progress
class VocabularyPracticeScreen extends StatefulWidget {
  const VocabularyPracticeScreen({Key? key}) : super(key: key);

  @override
  State<VocabularyPracticeScreen> createState() =>
      _VocabularyPracticeScreenState();
}

class _VocabularyPracticeScreenState extends State<VocabularyPracticeScreen> {
  late LocalCacheService _cacheService;
  List<VocabularyWord> _words = [];
  int _currentIndex = 0;
  int _learned = 0;
  int _practiced = 0;
  bool _showDefinition = false;
  bool _isLoading = true;
  String _filter = 'all'; // 'all', 'unlearned', 'learned'

  @override
  void initState() {
    super.initState();
    _cacheService = LocalCacheService();
    _loadVocabulary();
  }

  Future<void> _loadVocabulary() async {
    await _cacheService.initialize();

    // Load cached vocabulary
    var words = _cacheService.getCachedVocabularyWords();

    // If no cached words, generate sample vocabulary
    if (words.isEmpty) {
      words = _generateSampleVocabulary();
      await _cacheService.cacheVocabularyWords(words);
    }

    // Filter based on selection
    final filtered = _filterWords(words);

    setState(() {
      _words = filtered;
      _learned =
          words.where((w) => w.isLearned).length;
      _practiced = words.fold<int>(
          0, (sum, w) => sum + w.practiceCount);
      _isLoading = false;
    });
  }

  List<VocabularyWord> _filterWords(List<VocabularyWord> words) {
    switch (_filter) {
      case 'unlearned':
        return words.where((w) => !w.isLearned).toList();
      case 'learned':
        return words.where((w) => w.isLearned).toList();
      default:
        return words;
    }
  }

  List<VocabularyWord> _generateSampleVocabulary() {
    return [
      VocabularyWord(
        id: '1',
        word: 'Serendipity',
        pronunciation: '/ˌserənˈdɪpɪti/',
        definition: 'The occurrence of events by chance in a happy or beneficial way',
        exampleSentence: 'It was pure serendipity that we met at the café.',
        language: 'English',
        level: 'B2',
        relatedWords: ['luck', 'coincidence', 'fate'],
        isLearned: false,
        practiceCount: 0,
        lastPracticed: DateTime.now(),
      ),
      VocabularyWord(
        id: '2',
        word: 'Ephemeral',
        pronunciation: '/ɪˈfɛmərəl/',
        definition: 'Lasting for a very short time',
        exampleSentence: 'The beauty of cherry blossoms is ephemeral.',
        language: 'English',
        level: 'C1',
        relatedWords: ['fleeting', 'transient', 'momentary'],
        isLearned: false,
        practiceCount: 0,
        lastPracticed: DateTime.now(),
      ),
      VocabularyWord(
        id: '3',
        word: 'Eloquent',
        pronunciation: '/ˈɛləkwənt/',
        definition: 'Fluent or persuasive in speaking or writing',
        exampleSentence: 'Her eloquent speech moved the entire audience.',
        language: 'English',
        level: 'B1',
        relatedWords: ['articulate', 'expressive', 'fluent'],
        isLearned: true,
        practiceCount: 3,
        lastPracticed: DateTime.now(),
      ),
      VocabularyWord(
        id: '4',
        word: 'Pragmatic',
        pronunciation: '/præɡˈmætɪk/',
        definition: 'Dealing with things in a realistic and practical way',
        exampleSentence: 'We need to take a pragmatic approach to this problem.',
        language: 'English',
        level: 'B2',
        relatedWords: ['practical', 'realistic', 'sensible'],
        isLearned: false,
        practiceCount: 1,
        lastPracticed: DateTime.now(),
      ),
      VocabularyWord(
        id: '5',
        word: 'Mellifluous',
        pronunciation: '/məˈlɪfluəs/',
        definition: 'Sweet or musical; pleasant to hear',
        exampleSentence: 'The singer\'s mellifluous voice captivated the crowd.',
        language: 'English',
        level: 'C1',
        relatedWords: ['melodious', 'musical', 'sweet'],
        isLearned: false,
        practiceCount: 0,
        lastPracticed: DateTime.now(),
      ),
    ];
  }

  Future<void> _markAsLearned() async {
    if (_words.isEmpty) return;
    final word = _words[_currentIndex];

    await _cacheService.updateVocabularyWordStatus(
      wordId: word.id,
      isLearned: true,
      practiceCount: word.practiceCount + 1,
    );

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('✓ "${word.word}" marcado como aprendido!'),
        duration: const Duration(seconds: 2),
      ),
    );

    // Move to next word
    _nextWord();
  }

  void _nextWord() {
    if (_words.isEmpty) return;

    setState(() {
      if (_currentIndex < _words.length - 1) {
        _currentIndex++;
        _showDefinition = false;
      } else {
        // End of words in this filter
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Parabéns! Praticou todas as palavras!')),
        );
        _currentIndex = 0;
        _showDefinition = false;
      }
    });
  }

  void _previousWord() {
    setState(() {
      if (_currentIndex > 0) {
        _currentIndex--;
        _showDefinition = false;
      }
    });
  }

  void _toggleDefinition() {
    setState(() {
      _showDefinition = !_showDefinition;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_words.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Vocabulário')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.vocabulary, size: 64, color: Colors.grey[400]),
              const SizedBox(height: 16),
              const Text('Nenhuma palavra nesta categoria'),
            ],
          ),
        ),
      );
    }

    final currentWord = _words[_currentIndex];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Vocabulário'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(50),
          child: Padding(
            padding: const EdgeInsets.all(8),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildFilterChip('Todas', 'all'),
                  const SizedBox(width: 8),
                  _buildFilterChip('Não Aprendidas', 'unlearned'),
                  const SizedBox(width: 8),
                  _buildFilterChip('Aprendidas', 'learned'),
                ],
              ),
            ),
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Progress indicators
            Row(
              children: [
                Expanded(
                  child: Column(
                    children: [
                      Text(
                        '$_learned',
                        style: Theme.of(context)
                            .textTheme
                            .headlineSmall
                            ?.copyWith(
                              color: Colors.green,
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 4),
                      const Text('Aprendidas'),
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    children: [
                      Text(
                        '${_words.length}',
                        style: Theme.of(context)
                            .textTheme
                            .headlineSmall
                            ?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 4),
                      const Text('Total'),
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    children: [
                      Text(
                        '$_practiced',
                        style: Theme.of(context)
                            .textTheme
                            .headlineSmall
                            ?.copyWith(
                              color: Colors.blue,
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 4),
                      const Text('Práticas'),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),
            // Word card
            Card(
              elevation: 4,
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Word
                    Text(
                      currentWord.word,
                      style:
                          Theme.of(context).textTheme.headlineMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 12),
                    // Pronunciation button
                    ElevatedButton.icon(
                      icon: const Icon(Icons.volume_up),
                      label: Text(currentWord.pronunciation),
                      onPressed: () {
                        // TODO: Implement text-to-speech
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Pronunciação (offline disponível)'),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 24),
                    // Definition toggle
                    if (_showDefinition)
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Definição',
                            style: Theme.of(context)
                                .textTheme
                                .titleSmall
                                ?.copyWith(fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            currentWord.definition,
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Exemplo',
                            style: Theme.of(context)
                                .textTheme
                                .titleSmall
                                ?.copyWith(fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            currentWord.exampleSentence,
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(
                                  fontStyle: FontStyle.italic,
                                ),
                          ),
                          const SizedBox(height: 16),
                          Wrap(
                            spacing: 8,
                            children: currentWord.relatedWords
                                .map((word) => Chip(label: Text(word)))
                                .toList(),
                          ),
                        ],
                      )
                    else
                      ElevatedButton(
                        onPressed: _toggleDefinition,
                        child: const Text('Mostrar definição'),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 32),
            // Controls
            Row(
              children: [
                ElevatedButton.icon(
                  icon: const Icon(Icons.chevron_left),
                  label: const Text('Anterior'),
                  onPressed: _currentIndex > 0 ? _previousWord : null,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    '${_currentIndex + 1} / ${_words.length}',
                    textAlign: TextAlign.center,
                  ),
                ),
                ElevatedButton.icon(
                  icon: const Icon(Icons.check_circle),
                  label: const Text('Aprendida'),
                  onPressed: _markAsLearned,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    return FilterChip(
      label: Text(label),
      selected: _filter == value,
      onSelected: (selected) async {
        setState(() {
          _filter = value;
          _currentIndex = 0;
        });
        await _loadVocabulary();
      },
    );
  }
}
