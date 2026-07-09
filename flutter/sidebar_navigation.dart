import 'package:flutter/material.dart';

/// Single Left Sidebar component containing the precise navigation options
/// required for LingoLive AI.
///
/// Features exact Portuguese labels:
/// 1. "Meu Perfil"
/// 2. "Conversação IA"
/// 3. "Cursos"
/// 4. "Planos & Faturamento"
/// 5. "Configurações"
/// 6. "Sair"
class SidebarNavigation extends StatelessWidget {
  final String activeRoute;
  final Function(String) onNavigate;
  final VoidCallback onLogout;

  const SidebarNavigation({
    Key? key,
    required this.activeRoute,
    required this.onNavigate,
    required this.onLogout,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 260,
      height: double.infinity,
      decoration: const BoxDecoration(
        color: Color(0xFF0F172A), // Deep slate blue
        border: Border(
          right: BorderSide(color: Color(0xFF1E293B), width: 1.5),
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Platform Branding / Logo
          _buildLogoHeader(),
          const SizedBox(height: 36),

          // Main Navigation Items
          Expanded(
            child: ListView(
              physics: const NeverScrollableScrollPhysics(),
              children: [
                _buildSidebarItem(
                  label: "Meu Perfil",
                  icon: Icons.person_outline,
                  activeIcon: Icons.person,
                  route: "/profile",
                ),
                _buildSidebarItem(
                  label: "Conversação IA",
                  icon: Icons.mic_none_outlined,
                  activeIcon: Icons.mic,
                  route: "/conversation",
                ),
                _buildSidebarItem(
                  label: "Cursos",
                  icon: Icons.school_outlined,
                  activeIcon: Icons.school,
                  route: "/courses",
                ),
                _buildSidebarItem(
                  label: "Planos & Faturamento",
                  icon: Icons.credit_card_outlined,
                  activeIcon: Icons.credit_card,
                  route: "/billing",
                ),
                _buildSidebarItem(
                  label: "Configurações",
                  icon: Icons.settings_outlined,
                  activeIcon: Icons.settings,
                  route: "/settings",
                ),
              ],
            ),
          ),

          // Footer element: Log-out trigger
          _buildLogoutItem(),
        ],
      ),
    );
  }

  /// Logo and Branding header widget
  Widget _buildLogoHeader() {
    return Row(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF6366F1), Color(0xFF4F46E5)],
            ),
            borderRadius: BorderRadius.circular(10),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF6366F1).withOpacity(0.4),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: const Icon(
            Icons.record_voice_over,
            color: Color(0xFF22D3EE), // Bright cyan
            size: 20,
          ),
        ),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text(
              "LingoLive AI",
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.black,
                letterSpacing: -0.2,
              ),
            ),
            Text(
              "Smart Speaking Platform",
              style: TextStyle(
                color: Color(0xFF64748B),
                fontSize: 9,
                fontWeight: FontWeight.bold,
              ),
            )
          ],
        )
      ],
    );
  }

  /// Single navigation item controller
  Widget _buildSidebarItem({
    required String label,
    required IconData icon,
    required IconData activeIcon,
    required String route,
  }) {
    final bool isSelected = activeRoute == route;

    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      child: InkWell(
        onTap: () => onNavigate(route),
        borderRadius: BorderRadius.circular(12),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            gradient: isSelected
                ? const LinearGradient(
                    colors: [Color(0xFF4F46E5), Color(0xFF312E81)],
                    begin: Alignment.centerLeft,
                    end: Alignment.centerRight,
                  )
                : null,
            borderRadius: BorderRadius.circular(12),
            border: isSelected
                ? Border.all(color: const Color(0xFF6366F1).withOpacity(0.3))
                : null,
          ),
          child: Row(
            children: [
              Icon(
                isSelected ? activeIcon : icon,
                color: isSelected ? const Color(0xFF22D3EE) : const Color(0xFF64748B),
                size: 18,
              ),
              const SizedBox(width: 14),
              Text(
                label,
                style: TextStyle(
                  color: isSelected ? Colors.white : const Color(0xFF94A3B8),
                  fontSize: 12.5,
                  fontWeight: isSelected ? FontWeight.black : FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Left Sidebar footer trigger: logout option
  Widget _buildLogoutItem() {
    return Container(
      decoration: BoxDecoration(
        border: const Border(
          top: BorderSide(color: Color(0xFF1E293B), width: 1.2),
        ),
        color: Colors.transparent,
      ),
      padding: const EdgeInsets.only(top: 16),
      child: InkWell(
        onTap: onLogout,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            children: const [
              Icon(
                Icons.logout_outlined,
                color: Color(0xFFEF4444), // Crimson Red
                size: 18,
              ),
              SizedBox(width: 14),
              Text(
                "Sair",
                style: TextStyle(
                  color: Color(0xFFEF4444),
                  fontSize: 12.5,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
