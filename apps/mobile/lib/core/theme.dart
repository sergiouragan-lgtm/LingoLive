import 'package:flutter/material.dart';

/// Tokens visuais alinhados com o design system web (slate + roxo + ciano).
class LingoColors {
  const LingoColors._();

  static const Color background = Color(0xFF0F172A);
  static const Color surface = Color(0xFF1E293B);
  static const Color primary = Color(0xFF7C3AED);
  static const Color accent = Color(0xFF22D3EE);
  static const Color success = Color(0xFF34D399);
  static const Color danger = Color(0xFFF87171);
  static const Color textPrimary = Color(0xFFF8FAFC);
  static const Color textSecondary = Color(0xFF94A3B8);
}

ThemeData buildLingoTheme() {
  final base = ThemeData.dark(useMaterial3: true);
  return base.copyWith(
    scaffoldBackgroundColor: LingoColors.background,
    colorScheme: base.colorScheme.copyWith(
      primary: LingoColors.primary,
      secondary: LingoColors.accent,
      surface: LingoColors.surface,
      error: LingoColors.danger,
    ),
    cardTheme: const CardThemeData(
      color: LingoColors.surface,
      elevation: 0,
      margin: EdgeInsets.symmetric(vertical: 6),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(16)),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: LingoColors.primary,
        foregroundColor: LingoColors.textPrimary,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(12)),
        ),
      ),
    ),
  );
}
