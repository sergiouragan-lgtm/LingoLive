import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

/// Supported Language Class
class Language {
  final String code;
  final String name;
  final String flag;

  const Language({
    required this.code,
    required this.name,
    required this.flag,
  });
}

/// Scenario/Thematic Class
class Scenario {
  final String id;
  final String title;
  final String description;
  final IconData icon;

  const Scenario({
    required this.id,
    required this.title,
    required this.description,
    required this.icon,
  });
}

/// Voice Tutor Class
class Voice {
  final String name;
  final String gender;
  final String description;
  final String avatar;

  const Voice({
    required this.name,
    required this.gender,
    required this.description,
    required this.avatar,
  });
}

/// A premium, highly polished Conversation Wizard for LingoLive AI in Flutter.
/// 
/// Integrates with Firestore to automatically load student details (age & targetLanguage)
/// from `/students/{studentId}`, filters out content implicitly based on age,
/// and updates selection states dynamically with a beautiful purple/deep-blue
/// theme accented by a bright cyan CTA button.
class ConversationWizard extends StatefulWidget {
  final String studentId;
  final Function(Language, String, Scenario, Voice, String) onStartSession;

  const ConversationWizard({
    Key? key,
    required this.studentId,
    required this.onStartSession,
  }) : super(key: key);

  @override
  State<ConversationWizard> createState() => _ConversationWizardState();
}

class _ConversationWizardState extends State<ConversationWizard> {
  // Predefined lists for selection
  final List<Language> _languages = const [
    Language(code: 'pt', name: 'Português', flag: '🇵🇹'),
    Language(code: 'en', name: 'Inglês', flag: '🇺🇸'),
    Language(code: 'fr', name: 'Francês', flag: '🇫🇷'),
    Language(code: 'zh', name: 'Mandarim', flag: '🇨🇳'),
  ];

  final List<String> _proficiencies = const ['Básico', 'Intermediário', 'Avançado'];

  final List<Scenario> _allScenarios = const [
    Scenario(
      id: 'casual_chat',
      title: 'Conversa Amigável',
      description: 'Converse com um nativo de forma informal sobre hobbies.',
      icon: Icons.chat_bubble_outline,
    ),
    Scenario(
      id: 'cafe_order',
      title: 'No Restaurante',
      description: 'Peça cafés, doces e personalize suas preferências de mesa.',
      icon: Icons.coffee_outlined,
    ),
    Scenario(
      id: 'hotel_checkin',
      title: 'Check-In no Hotel',
      description: 'Faça check-in, resolva pendências e solicite dicas locais.',
      icon: Icons.hotel_outlined,
    ),
    Scenario(
      id: 'job_interview',
      title: 'Business English',
      description: 'Simule uma entrevista profissional em uma startup criativa.',
      icon: Icons.work_outline,
    ),
  ];

  final List<Voice> _voices = const [
    Voice(
      name: 'Zephyr',
      gender: 'Feminino',
      description: 'Voz calorosa, excelente para dinâmicas gerais.',
      avatar: '👧',
    ),
    Voice(
      name: 'Fenrir',
      gender: 'Masculino',
      description: 'Voz profunda, ritmo estável para escuta clara.',
      avatar: '👦',
    ),
  ];

  // Active state variables
  Language? _selectedLanguage;
  String _selectedProficiency = 'Intermediário';
  Scenario? _selectedScenario;
  Voice? _selectedVoice;
  int? _studentAge;
  bool _isLoading = true;
  String? _isPlayingPreviewName;

  @override
  void initState() {
    super.initState();
    _loadStudentProfile();
  }

  /// Load student data from Firestore: `/students/{studentId}`
  Future<void> _loadStudentProfile() async {
    try {
      final docSnap = await FirebaseFirestore.instance
          .collection('students')
          .doc(widget.studentId)
          .get();

      if (docSnap.exists) {
        final data = docSnap.data();
        if (data != null) {
          setState(() {
            _studentAge = data['age'] != null ? int.tryParse(data['age'].toString()) : null;
            
            // Match targetLanguage with languages list
            final targetLangStr = (data['targetLanguage'] ?? '').toString().toLowerCase();
            _selectedLanguage = _languages.firstWhere(
              (l) => l.name.toLowerCase().contains(targetLangStr) || l.code.toLowerCase() == targetLangStr,
              orElse: () => _languages[1], // English fallback
            );
            _isLoading = false;
          });
        }
      } else {
        // Fallback or provision defaults if document doesn't exist
        setState(() {
          _studentAge = 18;
          _selectedLanguage = _languages[1]; // English fallback
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint("Erro ao carregar perfil do Firestore: $e");
      setState(() {
        _studentAge = 20; // local fallback
        _selectedLanguage = _languages[1];
        _isLoading = false;
      });
    }

    // Set other defaults
    _selectedScenario = _allScenarios[0];
    _selectedVoice = _voices[0];
  }

  /// Determine implicit ageGroup content filter on backend
  String _getImplicitAgeGroup() {
    if (_studentAge == null) return "Adults";
    if (_studentAge! < 10) return "Infancy";
    if (_studentAge! < 13) return "Kids";
    if (_studentAge! < 18) return "PreTeens";
    return "Adults";
  }

  /// Simulate playing a sound preview for voice
  void _toggleVoicePreview(Voice voice) {
    setState(() {
      if (_isPlayingPreviewName == voice.name) {
        _isPlayingPreviewName = null;
      } else {
        _isPlayingPreviewName = voice.name;
      }
    });

    // Mock speech timeout
    if (_isPlayingPreviewName != null) {
      Future.delayed(const Duration(seconds: 3), () {
        if (mounted && _isPlayingPreviewName == voice.name) {
          setState(() {
            _isPlayingPreviewName = null;
          });
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            CircularProgressIndicator(color: Color(0xFF22D3EE)), // Cyan indicator
            SizedBox(height: 16),
            Text(
              "Carregando preferências do Firestore...",
              style: TextStyle(color: Colors.white70, fontSize: 14),
            )
          ],
        ),
      );
    }

    final double screenWidth = MediaQuery.of(context).size.width;
    final bool isMobile = screenWidth < 768;

    return Container(
      padding: const EdgeInsets.all(24.0),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A), // Dark deep slate/blue
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: const Color(0xFF1E293B), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.4),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header Section
          _buildHeader(),
          const Divider(color: Color(0xFF1E293B), height: 32),

          // Core Steps Grid / Flex List
          isMobile
              ? Column(
                  children: [
                    _buildStepOne(),
                    const SizedBox(height: 24),
                    _buildStepTwo(),
                    const SizedBox(height: 24),
                    _buildStepThree(),
                  ],
                )
              : Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(child: _buildStepOne()),
                    const SizedBox(width: 24),
                    Expanded(child: _buildStepTwo()),
                    const SizedBox(width: 24),
                    Expanded(child: _buildStepThree()),
                  ],
                ),
        ],
      ),
    );
  }

  /// Header Component
  Widget _buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFF6366F1).withOpacity(0.15),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF6366F1).withOpacity(0.3)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: const [
                  Icon(Icons.auto_awesome, color: Color(0xFF22D3EE), size: 12),
                  SizedBox(width: 4),
                  Text(
                    "CONVERSATION WIZARD",
                    style: TextStyle(
                      color: Color(0xFF818CF8),
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.1,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            if (_studentAge != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  "Filtro por Idade (${_studentAge}a) Ativo",
                  style: const TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ),
          ],
        ),
        const SizedBox(height: 12),
        const Text(
          "Configuração de Conversa Inteligente",
          style: TextStyle(
            color: Colors.white,
            fontSize: 22,
            fontWeight: FontWeight.w900,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 4),
        const Text(
          "Otimize seu treino por voz com as ações rápidas abaixo.",
          style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
        ),
      ],
    );
  }

  /// Step 1: Selector of Language and Level (horizontal list + toggle)
  Widget _buildStepOne() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildStepBadge(1, "Idioma e Nível"),
        const SizedBox(height: 12),

        // Horizontal language grid
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 2.2,
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
          ),
          itemCount: _languages.length,
          itemBuilder: (context, index) {
            final lang = _languages[index];
            final isSelected = _selectedLanguage?.code == lang.code;
            return InkWell(
              onTap: () => setState(() => _selectedLanguage = lang),
              borderRadius: BorderRadius.circular(16),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFF4F46E5).withOpacity(0.15) : const Color(0xFF020617).withOpacity(0.5),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isSelected ? const Color(0xFF6366F1) : const Color(0xFF1E293B),
                    width: 1.5,
                  ),
                ),
                child: Row(
                  children: [
                    Text(lang.flag, style: const TextStyle(fontSize: 22)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        lang.name,
                        style: TextStyle(
                          color: isSelected ? Colors.white : const Color(0xFF94A3B8),
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
        const SizedBox(height: 16),

        // Level Segmented button
        const Text(
          "NÍVEL DE PROFICIÊNCIA",
          style: TextStyle(color: Color(0xFF64748B), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.1),
        ),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.all(3),
          decoration: BoxDecoration(
            color: const Color(0xFF020617),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFF1E293B)),
          ),
          child: Row(
            children: _proficiencies.map((p) {
              final isSelected = _selectedProficiency == p;
              return Expanded(
                child: InkWell(
                  onTap: () => setState(() => _selectedProficiency = p),
                  borderRadius: BorderRadius.circular(8),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: isSelected ? const Color(0xFF4F46E5) : Colors.transparent,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      p,
                      style: TextStyle(
                        color: isSelected ? Colors.white : const Color(0xFF64748B),
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  /// Step 2: Grid of Tematics (maximum 4 visual cards with icons based on level)
  Widget _buildStepTwo() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildStepBadge(2, "Temática"),
        const SizedBox(height: 12),

        // Grid of Scenarios (maximum 4)
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 1.1,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
          ),
          itemCount: _allScenarios.length,
          itemBuilder: (context, index) {
            final scen = _allScenarios[index];
            final isSelected = _selectedScenario?.id == scen.id;
            return InkWell(
              onTap: () => setState(() => _selectedScenario = scen),
              borderRadius: BorderRadius.circular(20),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFF06B6D4).withOpacity(0.08) : const Color(0xFF020617).withOpacity(0.5),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isSelected ? const Color(0xFF06B6D4) : const Color(0xFF1E293B),
                    width: 1.5,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: isSelected ? const Color(0xFF06B6D4).withOpacity(0.15) : const Color(0xFF1E293B),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(
                            scen.icon,
                            color: isSelected ? const Color(0xFF22D3EE) : const Color(0xFF94A3B8),
                            size: 16,
                          ),
                        ),
                        if (isSelected)
                          const CircleAvatar(
                            radius: 3.5,
                            backgroundColor: Color(0xFF22D3EE),
                          )
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          scen.title,
                          style: TextStyle(
                            color: isSelected ? const Color(0xFF22D3EE) : Colors.white,
                            fontSize: 11.5,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          scen.description,
                          style: const TextStyle(
                            color: Color(0xFF64748B),
                            fontSize: 9,
                            height: 1.2,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    )
                  ],
                ),
              ),
            );
          },
        )
      ],
    );
  }

  /// Step 3: Selector of Tutor Voice & primary action button
  Widget _buildStepThree() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildStepBadge(3, "Tutor AI (Voz)"),
        const SizedBox(height: 12),

        // Vertical List of Voice Tutors with Preview buttons
        Column(
          children: _voices.map((v) {
            final isSelected = _selectedVoice?.name == v.name;
            final isPlaying = _isPlayingPreviewName == v.name;
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              child: InkWell(
                onTap: () => setState(() => _selectedVoice = v),
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isSelected ? const Color(0xFF8B5CF6).withOpacity(0.1) : const Color(0xFF020617).withOpacity(0.5),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isSelected ? const Color(0xFF8B5CF6) : const Color(0xFF1E293B),
                      width: 1.5,
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: isSelected ? const Color(0xFF8B5CF6) : const Color(0xFF1E293B),
                          shape: BoxShape.circle,
                        ),
                        child: Text(v.avatar, style: const TextStyle(fontSize: 18)),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              v.name,
                              style: TextStyle(
                                color: isSelected ? const Color(0xFFA78BFA) : Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 1),
                            Text(
                              "Voz ${v.gender}",
                              style: const TextStyle(color: Color(0xFF64748B), fontSize: 10),
                            ),
                          ],
                        ),
                      ),

                      // Tiny play button
                      InkWell(
                        onTap: () => _toggleVoicePreview(v),
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: isPlaying
                                ? const Color(0xFF06B6D4)
                                : isSelected
                                    ? const Color(0xFF8B5CF6).withOpacity(0.15)
                                    : const Color(0xFF1E293B),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: isPlaying
                                  ? const Color(0xFF22D3EE)
                                  : isSelected
                                      ? const Color(0xFF8B5CF6).withOpacity(0.3)
                                      : Colors.transparent,
                            ),
                          ),
                          child: Icon(
                            isPlaying ? Icons.volume_up : Icons.play_arrow,
                            color: isPlaying ? Colors.black : const Color(0xFFA78BFA),
                            size: 14,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 16),

        // Primary bright cyan Button "Começar a Falar"
        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton.icon(
            onPressed: () {
              if (_selectedLanguage != null && _selectedScenario != null && _selectedVoice != null) {
                widget.onStartSession(
                  _selectedLanguage!,
                  _selectedProficiency,
                  _selectedScenario!,
                  _selectedVoice!,
                  _getImplicitAgeGroup(),
                );
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF22D3EE), // Bright cyan
              foregroundColor: const Color(0xFF020617), // Deep slate text
              elevation: 4,
              shadowColor: const Color(0xFF22D3EE).withOpacity(0.3),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              padding: const EdgeInsets.symmetric(vertical: 12),
            ),
            icon: const Icon(Icons.mic, size: 18),
            label: const Text(
              "COMEÇAR A FALAR",
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.2,
              ),
            ),
          ),
        )
      ],
    );
  }

  /// Small step index badge helper
  Widget _buildStepBadge(int number, String text) {
    return Row(
      children: [
        Container(
          width: 20,
          height: 20,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: const Color(0xFF6366F1).withOpacity(0.15),
            shape: BoxShape.circle,
          ),
          child: Text(
            number.toString(),
            style: const TextStyle(color: Color(0xFF818CF8), fontSize: 10, fontWeight: FontWeight.bold),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          text,
          style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }
}
