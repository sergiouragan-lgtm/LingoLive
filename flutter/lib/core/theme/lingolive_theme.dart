import 'package:flutter/material.dart';

abstract final class LingoLiveTheme {
  static ThemeData get light => ThemeData(
    colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF7C3AED)),
    scaffoldBackgroundColor: const Color(0xFFF7F8FC),
    useMaterial3: true,
    cardTheme: const CardThemeData(elevation: 0, margin: EdgeInsets.zero),
    inputDecorationTheme: const InputDecorationTheme(
      border: OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(14)),
      ),
    ),
  );
}
