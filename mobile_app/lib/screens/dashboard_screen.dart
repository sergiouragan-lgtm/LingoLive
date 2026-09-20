import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import 'ebook_reader_screen.dart';
import 'vocabulary_practice_screen.dart';
import 'live_classes_screen.dart';
import '../models/sync_queue.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _selectedIndex = 0;

  late final List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    _screens = [
      const _HomeTab(),
      const VocabularyPracticeScreen(),
      const LiveClassesScreen(),
      const _ProfileTab(),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('LingoLive AI'),
        elevation: 0,
      ),
      body: _screens[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        type: BottomNavigationBarType.fixed,
        onTap: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.vocabulary), label: 'Palavras'),
          BottomNavigationBarItem(icon: Icon(Icons.videocam), label: 'Aulas'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Perfil'),
        ],
      ),
    );
  }
}

class _HomeTab extends StatelessWidget {
  const _HomeTab();

  List<EbookModel> _generateSampleEbooks() {
    return [
      EbookModel(
        id: '1',
        title: 'English for Beginners',
        author: 'Sarah Johnson',
        description: 'Perfect introduction to English language',
        price: 9.99,
        language: 'English',
        level: 'A1',
        pageCount: 150,
        format: 'pdf',
        fileSize: 5242880,
        coverUrl: 'https://via.placeholder.com/150',
        rating: 4.5,
        reviewCount: 234,
        publishedDate: DateTime.now().subtract(const Duration(days: 90)),
        skills: ['vocabulary', 'listening'],
      ),
      EbookModel(
        id: '2',
        title: 'Intermediate Grammar Guide',
        author: 'John Smith',
        description: 'Complete grammar reference for intermediate learners',
        price: 14.99,
        language: 'English',
        level: 'B1',
        pageCount: 320,
        format: 'pdf',
        fileSize: 8388608,
        coverUrl: 'https://via.placeholder.com/150',
        rating: 4.8,
        reviewCount: 456,
        publishedDate: DateTime.now().subtract(const Duration(days: 60)),
        skills: ['grammar', 'writing'],
      ),
      EbookModel(
        id: '3',
        title: 'Advanced Conversation',
        author: 'Emily Brown',
        description: 'Master conversational English for business',
        price: 19.99,
        language: 'English',
        level: 'C1',
        pageCount: 280,
        format: 'epub',
        fileSize: 4194304,
        coverUrl: 'https://via.placeholder.com/150',
        rating: 4.6,
        reviewCount: 189,
        publishedDate: DateTime.now().subtract(const Duration(days: 30)),
        skills: ['speaking', 'listening'],
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final ebooks = _generateSampleEbooks();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Bem-vindo ao LingoLive!',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Meta diária',
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: LinearProgressIndicator(
                      value: 0.6,
                      minHeight: 8,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '6 de 10 minutos',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'E-books Recomendados',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 280,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: ebooks.length,
              itemBuilder: (context, index) {
                final ebook = ebooks[index];
                return Container(
                  width: 200,
                  margin: const EdgeInsets.only(right: 12),
                  child: Card(
                    child: InkWell(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) =>
                                EbookReaderScreen(ebook: ebook),
                          ),
                        );
                      },
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            height: 140,
                            color: Colors.grey[300],
                            child: Center(
                              child: Icon(
                                Icons.book,
                                size: 48,
                                color: Colors.grey[600],
                              ),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  ebook.title,
                                  style: Theme.of(context)
                                      .textTheme
                                      .titleSmall,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  ebook.author,
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodySmall,
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    const Icon(Icons.star,
                                        size: 14, color: Colors.orange),
                                    const SizedBox(width: 4),
                                    Text(
                                      '${ebook.rating}',
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodySmall,
                                    ),
                                    const Spacer(),
                                    Text(
                                      '€${ebook.price}',
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodySmall
                                          ?.copyWith(
                                            fontWeight: FontWeight.bold,
                                          ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Continua de onde paraste',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 12),
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: 3,
            itemBuilder: (context, index) {
              return Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  leading: const Icon(Icons.book),
                  title: Text('Lição ${index + 1}'),
                  subtitle: const Text('Intermédia'),
                  trailing: const Icon(Icons.arrow_forward),
                  onTap: () {},
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _CoursesTab extends StatelessWidget {
  const _CoursesTab();

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Os meus cursos',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 16),
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: 5,
            itemBuilder: (context, index) {
              final languages = ['Espanhol', 'Francês', 'Alemão', 'Italiano', 'Português'];
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  leading: CircleAvatar(
                    child: Text(languages[index][0]),
                  ),
                  title: Text(languages[index]),
                  subtitle: Text('${(index + 1) * 10}% completo'),
                  onTap: () {},
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _ProfileTab extends StatelessWidget {
  const _ProfileTab();

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthService>(
      builder: (context, authService, _) {
        return SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 50,
                      child: Text(
                        authService.currentUser?.email?[0].toUpperCase() ?? 'U',
                        style: const TextStyle(fontSize: 32),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      authService.currentUser?.email ?? 'Utilizador',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              ListTile(
                leading: const Icon(Icons.settings),
                title: const Text('Definições'),
                trailing: const Icon(Icons.arrow_forward),
                onTap: () {},
              ),
              ListTile(
                leading: const Icon(Icons.help),
                title: const Text('Ajuda'),
                trailing: const Icon(Icons.arrow_forward),
                onTap: () {},
              ),
              ListTile(
                leading: const Icon(Icons.info),
                title: const Text('Sobre'),
                trailing: const Icon(Icons.arrow_forward),
                onTap: () {},
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () async {
                    await authService.signOut();
                  },
                  icon: const Icon(Icons.logout),
                  label: const Text('Sair'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
