import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/realtime_sync_service.dart';
import '../services/local_cache_service.dart';
import '../models/sync_queue.dart';
import 'package:intl/intl.dart';

/// Live Classes Screen - Video conferencing integration
/// Features: Browse classes, join, chat, offline download
class LiveClassesScreen extends StatefulWidget {
  const LiveClassesScreen({Key? key}) : super(key: key);

  @override
  State<LiveClassesScreen> createState() => _LiveClassesScreenState();
}

class _LiveClassesScreenState extends State<LiveClassesScreen> {
  late LocalCacheService _cacheService;
  List<LiveClass> _upcomingClasses = [];
  List<LiveClass> _liveNow = [];
  bool _isLoading = true;
  String _selectedTab = 'upcoming'; // 'upcoming', 'live', 'past'

  @override
  void initState() {
    super.initState();
    _cacheService = LocalCacheService();
    _loadClasses();
    _setupRefreshTimer();
  }

  Future<void> _loadClasses() async {
    await _cacheService.initialize();

    // Load cached classes
    var classes = _cacheService.getCachedUpcomingClasses();

    // If no cached classes, generate sample data
    if (classes.isEmpty) {
      classes = _generateSampleClasses();
      await _cacheService.cacheUpcomingClasses(classes);
    }

    // Separate live vs upcoming
    final now = DateTime.now();
    final live = <LiveClass>[];
    final upcoming = <LiveClass>[];

    for (final liveClass in classes) {
      if (liveClass.status == 'live') {
        live.add(liveClass);
      } else if (liveClass.scheduledTime.isAfter(now)) {
        upcoming.add(liveClass);
      }
    }

    setState(() {
      _upcomingClasses = upcoming;
      _liveNow = live;
      _isLoading = false;
    });
  }

  void _setupRefreshTimer() {
    // Refresh every 30 seconds to show real-time updates
    Future.delayed(const Duration(seconds: 30), () {
      if (mounted) {
        _loadClasses();
        _setupRefreshTimer();
      }
    });
  }

  List<LiveClass> _generateSampleClasses() {
    final now = DateTime.now();
    return [
      LiveClass(
        id: '1',
        teacherId: 'teacher_001',
        teacherName: 'Maria Silva',
        title: 'Conversação em Inglês - Iniciante',
        description: 'Prática de conversação para iniciantes com foco em frases do dia a dia.',
        scheduledTime: now.add(const Duration(hours: 1)),
        duration: const Duration(minutes: 45),
        maxParticipants: 20,
        status: 'scheduled',
        roomCode: 'ENG-CONV-001',
        language: 'English',
        level: 'A1-A2',
        currentParticipants: 8,
      ),
      LiveClass(
        id: '2',
        teacherId: 'teacher_002',
        teacherName: 'João Santos',
        title: 'Gramática Avançada - Present Perfect',
        description: 'Aula sobre Present Perfect com exercícios interativos.',
        scheduledTime: now.add(const Duration(hours: 2)),
        duration: const Duration(minutes: 60),
        maxParticipants: 25,
        status: 'scheduled',
        roomCode: 'ENG-GRAM-002',
        language: 'English',
        level: 'B1-B2',
        currentParticipants: 15,
      ),
      LiveClass(
        id: '3',
        teacherId: 'teacher_003',
        teacherName: 'Ana Costa',
        title: 'Pronúncia e Entoação',
        description: 'Trabalho da pronúncia correta de palavras e entoação.',
        scheduledTime: now.subtract(const Duration(minutes: 15)),
        duration: const Duration(minutes: 45),
        maxParticipants: 15,
        status: 'live',
        roomCode: 'ENG-PRON-003',
        language: 'English',
        level: 'A2-B1',
        currentParticipants: 12,
      ),
    ];
  }

  Future<void> _joinClass(LiveClass liveClass) async {
    // In production, this would join the LiveKit room
    // For now, show a mock joining flow

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Entrar em "${liveClass.title}"'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Professor: ${liveClass.teacherName}'),
            const SizedBox(height: 8),
            Text('Sala: ${liveClass.roomCode}'),
            const SizedBox(height: 8),
            Text('Participantes: ${liveClass.currentParticipants} / ${liveClass.maxParticipants}'),
            const SizedBox(height: 16),
            const Text('Permissões solicitadas:'),
            CheckboxListTile(
              title: const Text('Câmera'),
              value: true,
              onChanged: (value) {},
            ),
            CheckboxListTile(
              title: const Text('Microfone'),
              value: true,
              onChanged: (value) {},
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _showLiveClassRoom(liveClass);
            },
            child: const Text('Entrar'),
          ),
        ],
      ),
    );
  }

  void _showLiveClassRoom(LiveClass liveClass) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => LiveClassRoomScreen(liveClass: liveClass),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Aulas ao Vivo'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Próximas'),
              Tab(text: 'Ao Vivo'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            // Upcoming classes tab
            _upcomingClasses.isEmpty
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.calendar_today,
                            size: 64, color: Color(0xFFCCCCCC)),
                        SizedBox(height: 16),
                        Text('Nenhuma aula agendada'),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(8),
                    itemCount: _upcomingClasses.length,
                    itemBuilder: (context, index) {
                      final liveClass = _upcomingClasses[index];
                      return _buildClassCard(liveClass);
                    },
                  ),
            // Live now tab
            _liveNow.isEmpty
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.videocam_off,
                            size: 64, color: Color(0xFFCCCCCC)),
                        SizedBox(height: 16),
                        Text('Nenhuma aula ao vivo no momento'),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(8),
                    itemCount: _liveNow.length,
                    itemBuilder: (context, index) {
                      final liveClass = _liveNow[index];
                      return _buildLiveClassCard(liveClass);
                    },
                  ),
          ],
        ),
      ),
    );
  }

  Widget _buildClassCard(LiveClass liveClass) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        liveClass.title,
                        style: Theme.of(context).textTheme.titleMedium,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        liveClass.teacherName,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.blue[100],
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    liveClass.level,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.blue[900],
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              liveClass.description,
              style: Theme.of(context).textTheme.bodySmall,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(Icons.access_time, size: 16, color: Colors.grey[600]),
                const SizedBox(width: 4),
                Text(
                  DateFormat('dd/MM HH:mm').format(liveClass.scheduledTime),
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                const Spacer(),
                Icon(Icons.people, size: 16, color: Colors.grey[600]),
                const SizedBox(width: 4),
                Text(
                  '${liveClass.currentParticipants}/${liveClass.maxParticipants}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => _joinClass(liveClass),
                child: const Text('Entrar'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLiveClassCard(LiveClass liveClass) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      color: Colors.red[50],
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: Colors.red,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                const Text(
                  'AO VIVO',
                  style: TextStyle(
                    color: Colors.red,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              liveClass.title,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 4),
            Text(
              liveClass.teacherName,
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(Icons.people, size: 16, color: Colors.grey[600]),
                const SizedBox(width: 4),
                Text(
                  '${liveClass.currentParticipants} participantes',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => _joinClass(liveClass),
                child: const Text('Entrar Agora'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Live Class Room Screen - WebRTC Video Room
class LiveClassRoomScreen extends StatefulWidget {
  final LiveClass liveClass;

  const LiveClassRoomScreen({Key? key, required this.liveClass})
      : super(key: key);

  @override
  State<LiveClassRoomScreen> createState() => _LiveClassRoomScreenState();
}

class _LiveClassRoomScreenState extends State<LiveClassRoomScreen> {
  bool _videoEnabled = true;
  bool _audioEnabled = true;
  bool _showChat = false;
  final List<Map<String, String>> _chatMessages = [
    {
      'user': 'Maria Silva (Professor)',
      'message': 'Bem-vindo a todos! Vamos começar em breve.',
      'time': '14:30'
    },
    {'user': 'João', 'message': 'Olá! Pronto para começar', 'time': '14:31'},
    {'user': 'Ana', 'message': 'Oi pessoal!', 'time': '14:32'},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Aula ao Vivo'),
        actions: [
          IconButton(
            icon: const Icon(Icons.close),
            onPressed: () => Navigator.pop(context),
          ),
        ],
      ),
      body: Stack(
        children: [
          // Video area (placeholder for LiveKit integration)
          Container(
            color: Colors.black,
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 120,
                    height: 120,
                    decoration: const BoxDecoration(
                      color: Colors.grey,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.videocam,
                      size: 48,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Câmera da ${widget.liveClass.teacherName}',
                    style: const TextStyle(color: Colors.white),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    '(Integração LiveKit awaiting)',
                    style: TextStyle(color: Colors.grey, fontSize: 12),
                  ),
                ],
              ),
            ),
          ),
          // Controls overlay
          Positioned(
            bottom: 16,
            left: 16,
            right: 16,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                FloatingActionButton.extended(
                  onPressed: () {
                    setState(() {
                      _audioEnabled = !_audioEnabled;
                    });
                  },
                  backgroundColor:
                      _audioEnabled ? Colors.blue : Colors.red,
                  icon: Icon(_audioEnabled ? Icons.mic : Icons.mic_off),
                  label: Text(_audioEnabled ? 'Áudio On' : 'Áudio Off'),
                ),
                FloatingActionButton.extended(
                  onPressed: () {
                    setState(() {
                      _videoEnabled = !_videoEnabled;
                    });
                  },
                  backgroundColor:
                      _videoEnabled ? Colors.blue : Colors.red,
                  icon: Icon(
                      _videoEnabled ? Icons.videocam : Icons.videocam_off),
                  label: Text(_videoEnabled ? 'Vídeo On' : 'Vídeo Off'),
                ),
                FloatingActionButton.extended(
                  onPressed: () {
                    setState(() {
                      _showChat = !_showChat;
                    });
                  },
                  backgroundColor: Colors.purple,
                  icon: const Icon(Icons.chat),
                  label: const Text('Chat'),
                ),
              ],
            ),
          ),
          // Chat panel
          if (_showChat)
            Positioned(
              bottom: 80,
              right: 16,
              width: 300,
              height: 400,
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: const [
                    BoxShadow(blurRadius: 10, color: Colors.black12)
                  ],
                ),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.purple[100],
                        borderRadius: const BorderRadius.only(
                          topLeft: Radius.circular(12),
                          topRight: Radius.circular(12),
                        ),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.chat, size: 20),
                          SizedBox(width: 8),
                          Text('Chat da Aula',
                              style: TextStyle(fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                    Expanded(
                      child: ListView.builder(
                        itemCount: _chatMessages.length,
                        itemBuilder: (context, index) {
                          final msg = _chatMessages[index];
                          return Padding(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      msg['user']!,
                                      style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 12),
                                    ),
                                    Text(
                                      msg['time']!,
                                      style: const TextStyle(
                                          fontSize: 10, color: Colors.grey),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(msg['message']!,
                                    style: const TextStyle(fontSize: 12)),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(8),
                      child: Row(
                        children: [
                          Expanded(
                            child: TextField(
                              decoration: InputDecoration(
                                hintText: 'Escreva uma mensagem...',
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                contentPadding:
                                    const EdgeInsets.symmetric(horizontal: 12),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          FloatingActionButton(
                            mini: true,
                            onPressed: () {},
                            child: const Icon(Icons.send, size: 20),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
