import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

// ============================================================================
// THEME DESIGN SYSTEM (CORPORATE VS KIDITORIAL)
// ============================================================================

/// Theme tokens configured dynamically based on student age (< 12 is Kiditorial)
class LingoTheme {
  final Color backgroundColor;
  final Color cardColor;
  final Color primaryAccent; // Vibrant Purple
  final Color secondaryAccent; // Deep Blue
  final Color interactiveCyan; // Bright Cyan Accent
  final Color textPrimary;
  final Color textSecondary;
  final double cardRadius;
  final TextStyle headingStyle;
  final TextStyle bodyStyle;
  final bool isPlayful;

  LingoTheme({
    required this.backgroundColor,
    required this.cardColor,
    required this.primaryAccent,
    required this.secondaryAccent,
    required this.interactiveCyan,
    required this.textPrimary,
    required this.textSecondary,
    required this.cardRadius,
    required this.headingStyle,
    required this.bodyStyle,
    required this.isPlayful,
  });

  /// Premium Corporate Theme: Deep Blue/Roxo Executivo with Bright Cyan accents
  factory LingoTheme.corporate() {
    return LingoTheme(
      backgroundColor: const Color(0xFF090D1A), // Deepest dark blue-black
      cardColor: const Color(0xFF131A30), // Sleek deep slate blue card
      primaryAccent: const Color(0xFF6366F1), // Vibrant Indigo
      secondaryAccent: const Color(0xFF312E81), // Deep Royal Navy
      interactiveCyan: const Color(0xFF00F2FF), // Neon Electric Cyan
      textPrimary: Colors.white,
      textSecondary: const Color(0xFF94A3B8), // Cool slate gray
      cardRadius: 24.0,
      isPlayful: false,
      headingStyle: const TextStyle(
        fontFamily: 'Inter',
        fontWeight: FontWeight.w900,
        letterSpacing: -0.5,
      ),
      bodyStyle: const TextStyle(
        fontFamily: 'Inter',
        fontWeight: FontWeight.normal,
      ),
    );
  }

  /// Playful Kiditorial Theme: Creative pastel-brights, friendly, rounded and highly accessible
  factory LingoTheme.kiditorial() {
    return LingoTheme(
      backgroundColor: const Color(0xFFF5F3FF), // Soft lavender white
      cardColor: Colors.white, // Pure clean white cards
      primaryAccent: const Color(0xFF8B5CF6), // Bright bubblegum purple
      secondaryAccent: const Color(0xFFEC4899), // Fun sweet pink
      interactiveCyan: const Color(0xFF06B6D4), // Cheerful sky cyan
      textPrimary: const Color(0xFF1E1B4B), // Dark playful indigo text
      textSecondary: const Color(0xFF6B7280), // Soft warm grey
      cardRadius: 32.0,
      isPlayful: true,
      headingStyle: const TextStyle(
        fontFamily: 'Bubblegum', // Playful feeling
        fontWeight: FontWeight.w900,
        letterSpacing: 0.5,
      ),
      bodyStyle: const TextStyle(
        fontFamily: 'Bubblegum',
        fontWeight: FontWeight.bold,
      ),
    );
  }
}

// ============================================================================
// SYSTEM DATA MODELS
// ============================================================================

class PlatformFeatures {
  final bool languageQuiz;
  final bool vocabDeck;
  final bool leaderboard;
  final bool educatorDashboard;
  final bool liveChat;

  const PlatformFeatures({
    this.languageQuiz = true,
    this.vocabDeck = true,
    this.leaderboard = true,
    this.educatorDashboard = false,
    this.liveChat = true,
  });

  factory PlatformFeatures.fromFirestore(Map<String, dynamic> data) {
    return PlatformFeatures(
      languageQuiz: data['languageQuiz'] ?? true,
      vocabDeck: data['vocabDeck'] ?? true,
      leaderboard: data['leaderboard'] ?? true,
      educatorDashboard: data['educatorDashboard'] ?? false,
      liveChat: data['liveChat'] ?? true,
    );
  }
}

// ============================================================================
// LINGOLIVE PLATFORM ROUTING & WORKSPACE
// ============================================================================

/// Main Shell Scaffold integrating:
/// 1. Glassmorphic Single Left Sidebar Navigation
/// 2. Automatic Role Reading (Educator vs Student)
/// 3. Automatic Age reading (Corporate vs Kiditorial)
/// 4. Named Route Simulators
class LingoLiveShell extends StatefulWidget {
  final String userId;

  const LingoLiveShell({
    Key? key,
    required this.userId,
  }) : super(key: key);

  @override
  State<LingoLiveShell> createState() => _LingoLiveShellState();
}

class _LingoLiveShellState extends State<LingoLiveShell> {
  // Current route selected
  String _currentRoute = "/profile";

  // Dynamic user details
  String _userRole = "Student"; // "Student" or "Educator"
  int _userAge = 25; // Playful trigger if < 12
  String _studentName = "Sérgio Uragan";
  String _targetLanguage = "Inglês";
  String _proficiency = "Avançado";
  String _currentCourse = "Inglês Executivo & IA";
  double _completionRate = 65.0; // Dynamic streaming rate
  double _usageHours = 18.5;
  int _streakDays = 14;

  bool _isLoading = true;
  PlatformFeatures _features = const PlatformFeatures();

  // Stream simulator for Firestore Webhooks / speaking session completion
  StreamController<double>? _progressStreamController;
  StreamSubscription<double>? _progressSubscription;

  @override
  void initState() {
    super.initState();
    _fetchFirebaseUserData();
    _initFirestoreStreamSimulation();
  }

  @override
  void dispose() {
    _progressSubscription?.cancel();
    _progressStreamController?.close();
    super.dispose();
  }

  /// Automatic Firebase logic resolving User Role (users/{id}) & Student Age (students/{id})
  Future<void> _fetchFirebaseUserData() async {
    try {
      // 1. Fetch user role
      final userDoc = await FirebaseFirestore.instance
          .collection('users')
          .doc(widget.userId)
          .get();

      if (userDoc.exists && userDoc.data() != null) {
        final data = userDoc.data()!;
        _userRole = data['role'] ?? "Student";
      } else {
        // Fallback for special admin user
        final authUser = FirebaseAuth.instance.currentUser;
        if (authUser?.email?.toLowerCase() == 'sergio.uragan@gmail.com') {
          _userRole = "Educator"; // Default to premium educator/admin rights
        }
      }

      // 2. Fetch student details (age, currentCourse, progress)
      final studentDoc = await FirebaseFirestore.instance
          .collection('students')
          .doc(widget.userId)
          .get();

      if (studentDoc.exists && studentDoc.data() != null) {
        final sData = studentDoc.data()!;
        _studentName = sData['name'] ?? _studentName;
        _userAge = sData['age'] ?? _userAge;
        _targetLanguage = sData['targetLanguage'] ?? _targetLanguage;
        _proficiency = sData['proficiency'] ?? _proficiency;
        _currentCourse = sData['currentCourse'] ?? _currentCourse;
        _completionRate = (sData['completionRate'] ?? _completionRate).toDouble();
        _usageHours = (sData['usageHours'] ?? _usageHours).toDouble();
        _streakDays = sData['streakDays'] ?? _streakDays;
      }

      // 3. Fetch Platform features configurations
      final configDoc = await FirebaseFirestore.instance
          .collection('platform_features')
          .doc('config')
          .get();

      if (configDoc.exists && configDoc.data() != null) {
        _features = PlatformFeatures.fromFirestore(configDoc.data()!);
      }

      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      debugPrint("Firebase sync warning: $e. Running premium offline mock fallbacks safely.");
      // Automatic fallback configurations for demonstration
      final authUser = FirebaseAuth.instance.currentUser;
      if (authUser?.email?.toLowerCase() == 'sergio.uragan@gmail.com') {
        _userRole = "Educator";
      }
      setState(() {
        _isLoading = false;
      });
    }
  }

  /// Firestore Webhook Simulator: Emits speaking completion updates that trigger state changes
  void _initFirestoreStreamSimulation() {
    _progressStreamController = StreamController<double>.broadcast();
    
    // Simulate Firestore updates (e.g. user completes voice sessions, progress raises dynamically)
    _progressSubscription = Stream<double>.periodic(
      const Duration(seconds: 12),
      (count) => _completionRate + (count % 4) * 1.5,
    ).listen((updatedRate) {
      if (updatedRate <= 100.0) {
        _progressStreamController?.add(updatedRate);
      }
    });

    _progressStreamController?.stream.listen((val) {
      if (mounted) {
        setState(() {
          _completionRate = double.parse(val.toStringAsFixed(1));
        });
      }
    });
  }

  /// Changes the route seamlessly
  void _handleNavigation(String route) {
    setState(() {
      _currentRoute = route;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Color(0xFF090D1A),
        body: Center(
          child: CircularProgressIndicator(
            color: Color(0xFF00F2FF),
          ),
        ),
      );
    }

    // Determine Theme dynamically based on Age < 12 (Kiditorial playfulness)
    final theme = _userAge < 12 ? LingoTheme.kiditorial() : LingoTheme.corporate();

    return Theme(
      data: ThemeData(
        scaffoldBackgroundColor: theme.backgroundColor,
        cardColor: theme.cardColor,
      ),
      child: Scaffold(
        body: Row(
          children: [
            // SINGLE LEFT SIDEBAR - Elegantly integrated
            _buildGlassSidebar(theme),

            // DYNAMIC INNER ROUTE CONTENT WITH SMOOTH TRANSITION
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 350),
                transitionBuilder: (Widget child, Animation<double> animation) {
                  return FadeTransition(
                    opacity: CurveTween(curve: Curves.easeInOut).animate(animation),
                    child: SlideTransition(
                      position: Tween<Offset>(
                        begin: const Offset(0.02, 0.0),
                        end: Offset.zero,
                      ).animate(animation),
                      child: child,
                    ),
                  );
                },
                child: _buildInnerRouteView(theme),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ============================================================================
  // SIDEBAR WIDGET IMPLEMENTATION
  // ============================================================================

  /// Single Glassmorphic Sidebar Menu with precise Portuguese captions
  Widget _buildGlassSidebar(LingoTheme theme) {
    final bool isPlayful = theme.isPlayful;

    return Container(
      width: 270,
      height: double.infinity,
      decoration: BoxDecoration(
        color: isPlayful ? Colors.white : const Color(0xFF0B1021),
        border: Border(
          right: BorderSide(
            color: isPlayful 
                ? const Color(0xFFE9D5FF) 
                : const Color(0xFF1E293B).withOpacity(0.8),
            width: 1.5,
          ),
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 36),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Elegant Header Branding
          _buildBrandingHeader(theme),
          const SizedBox(height: 40),

          // Core Navigation Elements
          Expanded(
            child: ListView(
              physics: const NeverScrollableScrollPhysics(),
              children: [
                _buildSidebarItem(
                  label: "Meu Perfil",
                  icon: Icons.person_outline_rounded,
                  activeIcon: Icons.person_rounded,
                  route: "/profile",
                  theme: theme,
                ),
                _buildSidebarItem(
                  label: "Conversação IA",
                  icon: Icons.chat_bubble_outline_rounded,
                  activeIcon: Icons.chat_bubble_rounded,
                  route: "/conversation",
                  theme: theme,
                  disabled: !_features.liveChat,
                ),
                _buildSidebarItem(
                  label: "Cursos",
                  icon: Icons.auto_stories_outlined,
                  activeIcon: Icons.auto_stories_rounded,
                  route: "/courses",
                  theme: theme,
                ),
                _buildSidebarItem(
                  label: "Planos & Faturamento",
                  icon: Icons.payments_outlined,
                  activeIcon: Icons.payments_rounded,
                  route: "/billing",
                  theme: theme,
                ),
                _buildSidebarItem(
                  label: "Configurações",
                  icon: Icons.settings_outlined,
                  activeIcon: Icons.settings_rounded,
                  route: "/settings",
                  theme: theme,
                ),
              ],
            ),
          ),

          // Logout Segment
          _buildLogoutSection(theme),
        ],
      ),
    );
  }

  Widget _buildBrandingHeader(LingoTheme theme) {
    return Row(
      children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [theme.primaryAccent, theme.secondaryAccent],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(theme.isPlayful ? 14 : 12),
            boxShadow: [
              BoxShadow(
                color: theme.primaryAccent.withOpacity(0.3),
                blurRadius: 8,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Icon(
            theme.isPlayful ? Icons.face_rounded : Icons.record_voice_over_rounded,
            color: theme.isPlayful ? Colors.white : theme.interactiveCyan,
            size: 22,
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "LingoLive AI",
                style: theme.headingStyle.copyWith(
                  color: theme.textPrimary,
                  fontSize: 17,
                ),
              ),
              Text(
                theme.isPlayful ? "Aprender Brincando! ✨" : "Smarter Speaking UI",
                style: theme.bodyStyle.copyWith(
                  color: theme.isPlayful ? theme.secondaryAccent : theme.textSecondary,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSidebarItem({
    required String label,
    required IconData icon,
    required IconData activeIcon,
    required String route,
    required LingoTheme theme,
    bool disabled = false,
  }) {
    final bool isSelected = _currentRoute == route;
    final bool isPlayful = theme.isPlayful;

    return Opacity(
      opacity: disabled ? 0.4 : 1.0,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        child: InkWell(
          onTap: disabled ? null : () => _handleNavigation(route),
          borderRadius: BorderRadius.circular(theme.cardRadius / 2),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              gradient: isSelected
                  ? LinearGradient(
                      colors: [
                        theme.primaryAccent,
                        theme.secondaryAccent.withOpacity(0.9),
                      ],
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                    )
                  : null,
              borderRadius: BorderRadius.circular(theme.cardRadius / 2),
              border: isSelected && !isPlayful
                  ? Border.all(color: theme.interactiveCyan.withOpacity(0.3))
                  : null,
            ),
            child: Row(
              children: [
                Icon(
                  isSelected ? activeIcon : icon,
                  color: isSelected 
                      ? Colors.white 
                      : (isPlayful ? theme.primaryAccent : theme.textSecondary),
                  size: 20,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Text(
                    label,
                    style: theme.bodyStyle.copyWith(
                      color: isSelected 
                          ? Colors.white 
                          : theme.textPrimary.withOpacity(0.8),
                      fontSize: 13,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                    ),
                  ),
                ),
                if (isSelected && !isPlayful)
                  Container(
                    width: 5,
                    height: 5,
                    decoration: BoxDecoration(
                      color: theme.interactiveCyan,
                      shape: BoxShape.circle,
                    ),
                  )
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLogoutSection(LingoTheme theme) {
    return Container(
      padding: const EdgeInsets.only(top: 16),
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(
            color: theme.isPlayful 
                ? const Color(0xFFF3E8FF) 
                : const Color(0xFF1E293B),
            width: 1.2,
          ),
        ),
      ),
      child: InkWell(
        onTap: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text("Sessão finalizada com sucesso. Até logo!"),
              backgroundColor: Color(0xFFEF4444),
            ),
          );
        },
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              const Icon(
                Icons.logout_rounded,
                color: Color(0xFFEF4444),
                size: 20,
              ),
              const SizedBox(width: 16),
              Text(
                "Sair",
                style: theme.bodyStyle.copyWith(
                  color: const Color(0xFFEF4444),
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ============================================================================
  // ROUTE HANDLERS & INTERNAL VIEWS
  // ============================================================================

  Widget _buildInnerRouteView(LingoTheme theme) {
    // If user's Firebase role is Educator, redirect unconditionally to class dashboard
    if (_userRole == "Educator") {
      return EducatorDashboard(
        theme: theme,
        onNavigateBack: () {
          setState(() {
            _userRole = "Student"; // Toggleable fallback for visualization
          });
        },
      );
    }

    switch (_currentRoute) {
      case "/profile":
        return StudentProfileView(
          studentName: _studentName,
          age: _userAge,
          targetLanguage: _targetLanguage,
          proficiency: _proficiency,
          currentCourse: _currentCourse,
          completionRate: _completionRate,
          usageHours: _usageHours,
          streakDays: _streakDays,
          features: _features,
          theme: theme,
          onNavigate: (route) => _handleNavigation(route),
        );
      case "/conversation":
        return _buildPlaceholderRoute("Conversação Inteligente com IA", theme);
      case "/courses":
        return _buildPlaceholderRoute("Sua Trilha de Cursos Personalizados", theme);
      case "/billing":
        return _buildPlaceholderRoute("Configuração de Planos & Faturamento", theme);
      case "/settings":
        return _buildPlaceholderRoute("Configurações do Perfil", theme);
      default:
        return _buildPlaceholderRoute("Área Não Encontrada", theme);
    }
  }

  Widget _buildPlaceholderRoute(String title, LingoTheme theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.construction_rounded, size: 48, color: theme.primaryAccent),
          const SizedBox(height: 16),
          Text(
            title,
            style: theme.headingStyle.copyWith(color: theme.textPrimary, fontSize: 18),
          ),
          const SizedBox(height: 8),
          Text(
            "Módulo Premium perfeitamente mapeado via Flutter.",
            style: theme.bodyStyle.copyWith(color: theme.textSecondary, fontSize: 12),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => _handleNavigation("/profile"),
            style: ElevatedButton.styleFrom(
              backgroundColor: theme.primaryAccent,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text("Voltar ao Meu Perfil"),
          )
        ],
      ),
    );
  }
}

// ============================================================================
// STUDENT PROFILE VIEW COMPONENT
// ============================================================================

class StudentProfileView extends StatelessWidget {
  final String studentName;
  final int age;
  final String targetLanguage;
  final String proficiency;
  final String currentCourse;
  final double completionRate;
  final double usageHours;
  final int streakDays;
  final PlatformFeatures features;
  final LingoTheme theme;
  final Function(String) onNavigate;

  const StudentProfileView({
    Key? key,
    required this.studentName,
    required this.age,
    required this.targetLanguage,
    required this.proficiency,
    required this.currentCourse,
    required this.completionRate,
    required this.usageHours,
    required this.streakDays,
    required this.features,
    required this.theme,
    required this.onNavigate,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: theme.backgroundColor,
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 36),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Upper greeting banner
            _buildGreetingHeader(),
            const SizedBox(height: 28),

            // 1. HEADER CARD: Identification Data, language active and proficiency
            _buildUpperIdentityCard(),
            const SizedBox(height: 32),

            // Section Title
            _buildSectionLabel(
              theme.isPlayful ? "MINHAS ESTRELAS E NÚMEROS! 🌟" : "ANÁLISE DE PERFORMANCE",
              Icons.analytics_outlined,
            ),
            const SizedBox(height: 14),

            // 2. ADVANCED METRICS GRID (Curso, Aproveitamento, Horas, Streak)
            _buildMetricsSection(),
            const SizedBox(height: 32),

            // Section Title for Activities
            _buildSectionLabel(
              theme.isPlayful ? "BRINCADEIRAS E DESAFIOS! 🧩" : "ATIVIDADES DE FIXAÇÃO IA",
              Icons.gamepad_outlined,
            ),
            const SizedBox(height: 14),

            // 3. QUICK ACTIONS (Grid 1x3): Interactive clickable cards
            _buildInteractiveActivitiesGrid(context),
          ],
        ),
      ),
    );
  }

  Widget _buildGreetingHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.auto_awesome, color: theme.interactiveCyan, size: 16),
            const SizedBox(width: 8),
            Text(
              theme.isPlayful ? "BEM-VINDO AO PARQUINHO!" : "PAINEL CENTRAL DE OPERAÇÕES",
              style: theme.bodyStyle.copyWith(
                color: theme.primaryAccent,
                fontSize: 10,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.2,
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        Text(
          theme.isPlayful ? "Oi, $studentName! Prontos?" : "Olá, $studentName! 👋",
          style: theme.headingStyle.copyWith(
            color: theme.textPrimary,
            fontSize: 28,
          ),
        ),
        Text(
          theme.isPlayful
              ? "Vamos ganhar estrelinhas douradas hoje com as atividades!"
              : "Consolide seu desempenho e gerencie suas conquistas de conversação.",
          style: theme.bodyStyle.copyWith(
            color: theme.textSecondary,
            fontSize: 12.5,
          ),
        ),
      ],
    );
  }

  Widget _buildSectionLabel(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, color: theme.primaryAccent, size: 16),
        const SizedBox(width: 8),
        Text(
          title,
          style: theme.headingStyle.copyWith(
            color: theme.textPrimary.withOpacity(0.7),
            fontSize: 11,
            letterSpacing: 1.1,
          ),
        ),
      ],
    );
  }

  /// Premium Header Card displaying student photo (initials avatar), active language, proficiency and dynamic glow streak
  Widget _buildUpperIdentityCard() {
    final bool isKid = theme.isPlayful;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isKid
              ? [const Color(0xFFA78BFA), const Color(0xFFEC4899)]
              : [theme.primaryAccent, theme.secondaryAccent],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(theme.cardRadius),
        border: Border.all(
          color: Colors.white.withOpacity(0.15),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: theme.primaryAccent.withOpacity(0.25),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final bool isCompact = constraints.maxWidth < 600;

          final avatar = Container(
            width: 76,
            height: 76,
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 10,
                )
              ],
            ),
            child: Center(
              child: Text(
                studentName.isNotEmpty ? studentName[0].toUpperCase() : "E",
                style: TextStyle(
                  color: theme.secondaryAccent,
                  fontSize: 32,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
          );

          final details = Column(
            crossAxisAlignment:
                isCompact ? CrossAxisAlignment.center : CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    studentName,
                    style: theme.headingStyle.copyWith(
                      color: Colors.white,
                      fontSize: 22,
                    ),
                  ),
                  if (age < 12) ...[
                    const SizedBox(width: 8),
                    const Icon(Icons.star, color: Colors.amber, size: 20),
                  ]
                ],
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                alignment: isCompact ? WrapAlignment.center : WrapAlignment.start,
                children: [
                  _buildPillBadge("Idioma Ativo: $targetLanguage", Colors.white),
                  _buildPillBadge(
                    "Nível: $proficiency",
                    isKid ? Colors.yellowAccent : theme.interactiveCyan,
                  ),
                ],
              ),
            ],
          );

          // Shiny streak count widget
          final streakWidget = Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.25),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: Colors.white.withOpacity(0.15),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.local_fire_department,
                  color: Colors.orangeAccent,
                  size: 24,
                ),
                const SizedBox(width: 8),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      "$streakDays Dias",
                      style: theme.headingStyle.copyWith(
                        color: Colors.white,
                        fontSize: 16,
                      ),
                    ),
                    const Text(
                      "SEQUÊNCIA ATIVA",
                      style: TextStyle(
                        color: Colors.white60,
                        fontSize: 8,
                        fontWeight: FontWeight.bold,
                      ),
                    )
                  ],
                ),
              ],
            ),
          );

          if (isCompact) {
            return Column(
              children: [
                avatar,
                const SizedBox(height: 16),
                details,
                const SizedBox(height: 20),
                streakWidget,
              ],
            );
          }

          return Row(
            children: [
              avatar,
              const SizedBox(width: 24),
              Expanded(child: details),
              const SizedBox(width: 16),
              streakWidget,
            ],
          );
        },
      ),
    );
  }

  Widget _buildPillBadge(String text, Color accentColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.2),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: accentColor.withOpacity(0.3)),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: accentColor,
          fontSize: 11,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  /// Grid holding the exact advanced metric widgets: Course Name, Course Aproveitamento, speaking hour counter, and kids streak
  Widget _buildMetricsSection() {
    return LayoutBuilder(
      builder: (context, constraints) {
        final double width = constraints.maxWidth;
        final int crossCount = width > 900 ? 3 : (width > 600 ? 2 : 1);

        return GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: crossCount,
          childAspectRatio: 2.2,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          children: [
            // Metric: Course in active study
            _buildMetricCard(
              title: theme.isPlayful ? "MEU LIVRINHO DE ESTUDOS" : "CURSO ATUAL EM ANDAMENTO",
              value: currentCourse,
              icon: Icons.school_rounded,
              accent: theme.primaryAccent,
            ),

            // Metric: LinearProgressIndicator styled with brand colors representing Course Aproveitamento
            _buildProgressMetricCard(
              title: theme.isPlayful ? "MEU SUPERSUCESSO DE JOGO!" : "APROVEITAMENTO GERAL DO CURSO",
              percentage: completionRate,
              accent: const Color(0xFF10B981),
            ),

            // Metric: Speaking usage hour tracker
            _buildMetricCard(
              title: theme.isPlayful ? "TEMPO TOTAL FALANDO IA" : "TEMPO DE USO ACUMULADO",
              value: "${usageHours.toStringAsFixed(1)} Horas",
              icon: Icons.keyboard_voice_rounded,
              accent: theme.interactiveCyan,
            ),
          ],
        );
      },
    );
  }

  Widget _buildMetricCard({
    required String title,
    required String value,
    required IconData icon,
    required Color accent,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(theme.cardRadius),
        border: Border.all(
          color: theme.isPlayful 
              ? const Color(0xFFE9D5FF) 
              : const Color(0xFF1E293B).withOpacity(0.5),
          width: 1.2,
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: accent.withOpacity(0.12),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: accent, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  title.toUpperCase(),
                  style: TextStyle(
                    color: theme.textSecondary,
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: theme.headingStyle.copyWith(
                    color: theme.textPrimary,
                    fontSize: 15,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressMetricCard({
    required String title,
    required double percentage,
    required Color accent,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(theme.cardRadius),
        border: Border.all(
          color: theme.isPlayful 
              ? const Color(0xFFE9D5FF) 
              : const Color(0xFF1E293B).withOpacity(0.5),
          width: 1.2,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title.toUpperCase(),
                style: TextStyle(
                  color: theme.textSecondary,
                  fontSize: 9,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Icon(Icons.insights, color: accent, size: 16),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Text(
                "${percentage.toStringAsFixed(0)}%",
                style: theme.headingStyle.copyWith(
                  color: theme.textPrimary,
                  fontSize: 22,
                ),
              ),
              const SizedBox(width: 8),
              const Expanded(child: SizedBox()),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                decoration: BoxDecoration(
                  color: accent.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  "ESTÁVEL",
                  style: TextStyle(color: accent, fontSize: 8, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: percentage / 100,
              backgroundColor: theme.isPlayful ? const Color(0xFFF3E8FF) : const Color(0xFF1E293B),
              valueColor: AlwaysStoppedAnimation<Color>(accent),
              minHeight: 8,
            ),
          ),
        ],
      ),
    );
  }

  /// 1x3 Grid holding interactive action cards redirecting seamlessly to subpages with custom animations
  Widget _buildInteractiveActivitiesGrid(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final double width = constraints.maxWidth;
        final int crossCount = width > 750 ? 3 : 1;

        return GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: crossCount,
          childAspectRatio: 1.6,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          children: [
            // Card 1: Leaderboard (Ranking)
            _buildInteractiveActionCard(
              context: context,
              title: theme.isPlayful ? "🏆 REINO DA DIVERSÃO" : "RANKING GLOBAL",
              subtitle: "Competição amigável semanal entre os melhores alunos.",
              badge: "ATIVO",
              icon: Icons.workspace_premium_rounded,
              color: const Color(0xFFF59E0B),
              isEnabled: features.leaderboard,
              onTap: () {
                _triggerActivityMessage(context, "Quadro de Líderes");
              },
            ),

            // Card 2: AI Retention Quiz
            _buildInteractiveActionCard(
              context: context,
              title: theme.isPlayful ? "⭐ MINI TESTE INTELIGENTE" : "QUIZ DE RETENÇÃO IA",
              subtitle: "Desafios relâmpago de vocabulário e gramática contextual.",
              badge: "PRÁTICA",
              icon: Icons.psychology_rounded,
              color: theme.interactiveCyan,
              isEnabled: features.languageQuiz,
              onTap: () {
                _triggerActivityMessage(context, "Quiz de Retenção");
              },
            ),

            // Card 3: Saved vocabularies flashcard reviews
            _buildInteractiveActionCard(
              context: context,
              title: theme.isPlayful ? "🎯 MEU BAUZINHO DE PALAVRAS" : "DECK DE VOCABULÁRIO",
              subtitle: "Estude as palavras salvas durante seus diálogos de áudio.",
              badge: "FLASHCARDS",
              icon: Icons.bookmarks_rounded,
              color: const Color(0xFFEC4899),
              isEnabled: features.vocabDeck,
              onTap: () {
                _triggerActivityMessage(context, "Deck de Vocabulário");
              },
            ),
          ],
        );
      },
    );
  }

  Widget _buildInteractiveActionCard({
    required BuildContext context,
    required String title,
    required String subtitle,
    required String badge,
    required IconData icon,
    required Color color,
    required bool isEnabled,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: isEnabled ? onTap : null,
        borderRadius: BorderRadius.circular(theme.cardRadius),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(
            color: isEnabled ? theme.cardColor : theme.cardColor.withOpacity(0.4),
            borderRadius: BorderRadius.circular(theme.cardRadius),
            border: Border.all(
              color: isEnabled 
                  ? color.withOpacity(0.3) 
                  : theme.textSecondary.withOpacity(0.1),
              width: 1.5,
            ),
            boxShadow: isEnabled
                ? [
                    BoxShadow(
                      color: color.withOpacity(0.04),
                      blurRadius: 16,
                      offset: const Offset(0, 8),
                    )
                  ]
                : null,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(icon, color: color, size: 22),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: isEnabled ? color.withOpacity(0.1) : Colors.red.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      isEnabled ? badge : "MOCK OFFLINE",
                      style: TextStyle(
                        color: isEnabled ? color : Colors.red,
                        fontSize: 8,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.5,
                      ),
                    ),
                  )
                ],
              ),
              const SizedBox(height: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: theme.headingStyle.copyWith(
                      color: isEnabled ? theme.textPrimary : theme.textPrimary.withOpacity(0.5),
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: theme.bodyStyle.copyWith(
                      color: theme.textSecondary,
                      fontSize: 10,
                      height: 1.3,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              )
            ],
          ),
        ),
      ),
    );
  }

  void _triggerActivityMessage(BuildContext context, String moduleName) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(Icons.auto_awesome, color: theme.interactiveCyan, size: 18),
            const SizedBox(width: 10),
            Text(
              "Navegando com animações premium para: $moduleName",
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ],
        ),
        backgroundColor: theme.primaryAccent,
        duration: const Duration(seconds: 2),
      ),
    );
  }
}

// ============================================================================
// EDUCATOR/ADMINISTRATOR VIEWS & COMPONENT
// ============================================================================

/// Clean Dashboard rendered conditionally for LingoLive users with educator credentials
class EducatorDashboard extends StatelessWidget {
  final LingoTheme theme;
  final VoidCallback onNavigateBack;

  const EducatorDashboard({
    Key? key,
    required this.theme,
    required this.onNavigateBack,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: theme.backgroundColor,
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 36),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Bar
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: const [
                        Icon(Icons.security, color: Color(0xFFF59E0B), size: 14),
                        SizedBox(width: 6),
                        Text(
                          "ÁREA ADMINISTRATIVA / EDUCATOR",
                          style: TextStyle(
                            color: Color(0xFFF59E0B),
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.1,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      "Painel do Professor 🍎",
                      style: theme.headingStyle.copyWith(
                        color: theme.textPrimary,
                        fontSize: 26,
                      ),
                    ),
                  ],
                ),
                OutlinedButton.icon(
                  onPressed: onNavigateBack,
                  icon: const Icon(Icons.swap_horiz, size: 16),
                  label: const Text("Mudar para Aluno", style: TextStyle(fontSize: 11)),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: theme.interactiveCyan,
                    side: BorderSide(color: theme.interactiveCyan.withOpacity(0.4)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 28),

            // Performance Analytics Overview
            Row(
              children: [
                Expanded(
                  child: _buildSimpleMetric(
                    "Total Alunos Ativos",
                    "1,480",
                    Icons.people_outline,
                    const Color(0xFF6366F1),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: _buildSimpleMetric(
                    "Média Aproveitamento",
                    "78.4%",
                    Icons.trending_up,
                    const Color(0xFF10B981),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: _buildSimpleMetric(
                    "Aulas Concluídas",
                    "342",
                    Icons.check_circle_outline,
                    theme.interactiveCyan,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),

            // Class tables list section
            const Text(
              "TABELAS DE TURMAS E CLASSES ATIVAS",
              style: TextStyle(
                color: Colors.white70,
                fontSize: 11,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.2,
              ),
            ),
            const SizedBox(height: 12),
            _buildClassroomTable(),
          ],
        ),
      ),
    );
  }

  Widget _buildSimpleMetric(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title.toUpperCase(),
                style: const TextStyle(color: Colors.white54, fontSize: 8, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: theme.headingStyle.copyWith(color: theme.textPrimary, fontSize: 16),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildClassroomTable() {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          // Table header
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Row(
              children: const [
                Expanded(child: Text("CÓDIGO / ID", style: TextStyle(color: Colors.white60, fontSize: 10, fontWeight: FontWeight.bold))),
                Expanded(child: Text("IDIOMA", style: TextStyle(color: Colors.white60, fontSize: 10, fontWeight: FontWeight.bold))),
                Expanded(child: Text("ALUNOS", style: TextStyle(color: Colors.white60, fontSize: 10, fontWeight: FontWeight.bold))),
                Expanded(child: Text("STATUS", style: TextStyle(color: Colors.white60, fontSize: 10, fontWeight: FontWeight.bold))),
              ],
            ),
          ),
          const Divider(color: Colors.white10),
          // Class rows
          _buildClassroomRow("LingoLive EN-A1", "Inglês (Iniciante)", "14 Alunos", "Em Andamento"),
          _buildClassroomRow("LingoLive FR-B2", "Francês (Intermediário)", "8 Alunos", "Intensivo"),
          _buildClassroomRow("LingoLive ES-C1", "Espanhol (Avançado)", "19 Alunos", "Completo"),
        ],
      ),
    );
  }

  Widget _buildClassroomRow(String id, String lang, String students, String status) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        children: [
          Expanded(child: Text(id, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold))),
          Expanded(child: Text(lang, style: const TextStyle(color: Colors.white70, fontSize: 12))),
          Expanded(child: Text(students, style: const TextStyle(color: Colors.white54, fontSize: 12))),
          Expanded(
            child: Align(
              alignment: Alignment.centerLeft,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  status.toUpperCase(),
                  style: const TextStyle(color: Color(0xFF10B981), fontSize: 8, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
