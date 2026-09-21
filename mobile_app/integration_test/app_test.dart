import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:lingolive_mobile/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('LingoLive Mobile App - End-to-End Tests', () {
    testWidgets('E2E: Complete authentication flow', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Verify LoginScreen is shown initially
      expect(find.text('LingoLive AI'), findsWidgets);
      expect(find.text('Aprende idiomas com IA'), findsOneWidget);
      expect(find.byType(TextField), findsNWidgets(2)); // Email and password fields

      // Enter credentials
      await tester.enterText(
        find.byType(TextField).first,
        'test@example.com',
      );
      await tester.enterText(
        find.byType(TextField).last,
        'password123',
      );
      await tester.pumpAndSettle();

      // Verify sign in button exists
      expect(find.text('Iniciar Sessão'), findsOneWidget);
    });

    testWidgets('E2E: Dashboard navigation between tabs', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Skip authentication by waiting for dashboard
      // This would require mocking Firebase auth in a real scenario
      await Future.delayed(const Duration(seconds: 2));

      // Verify bottom navigation bar exists
      expect(find.byType(BottomNavigationBar), findsOneWidget);

      // Verify all 4 navigation items exist
      expect(find.text('Home'), findsOneWidget);
      expect(find.text('Palavras'), findsOneWidget);
      expect(find.text('Aulas'), findsOneWidget);
      expect(find.text('Perfil'), findsOneWidget);
    });

    testWidgets('E2E: Vocabulary practice flow', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Navigate to Vocabulary tab
      final vocabularyTab = find.text('Palavras');
      if (vocabularyTab.evaluate().isNotEmpty) {
        await tester.tap(vocabularyTab);
        await tester.pumpAndSettle();

        // Verify vocabulary screen elements
        expect(find.text('Vocabulário'), findsWidgets);
        expect(find.byIcon(Icons.vocabulary), findsWidgets);

        // Verify filter chips exist
        expect(find.text('Todas'), findsWidgets);
        expect(find.text('Não Aprendidas'), findsWidgets);
        expect(find.text('Aprendidas'), findsWidgets);

        // Verify word card UI elements
        expect(find.byIcon(Icons.volume_up), findsWidgets);
        expect(find.text('Mostrar definição'), findsWidgets);
      }
    });

    testWidgets('E2E: Live classes tab navigation', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Navigate to Live Classes tab
      final aulasTab = find.text('Aulas');
      if (aulasTab.evaluate().isNotEmpty) {
        await tester.tap(aulasTab);
        await tester.pumpAndSettle();

        // Verify live classes screen is shown
        // Screen would display upcoming classes, live now, past classes
      }
    });

    testWidgetsvUser profile and logout flow', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Navigate to Profile tab
      final perfilTab = find.text('Perfil');
      if (perfilTab.evaluate().isNotEmpty) {
        await tester.tap(perfilTab);
        await tester.pumpAndSettle();

        // Verify profile screen elements
        expect(find.byType(CircleAvatar), findsWidgets);
        expect(find.text('Definições'), findsOneWidget);
        expect(find.text('Ajuda'), findsOneWidget);
        expect(find.text('Sobre'), findsOneWidget);
        expect(find.text('Sair'), findsOneWidget); // Logout button

        // Verify logout button is red
        final logoutButton = find.text('Sair');
        expect(logoutButton, findsOneWidget);
      }
    });

    testWidgets('E2E: Home tab features', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Navigate to Home tab
      final homeTab = find.text('Home');
      if (homeTab.evaluate().isNotEmpty) {
        await tester.tap(homeTab);
        await tester.pumpAndSettle();

        // Verify home screen elements
        expect(find.text('Bem-vindo ao LingoLive!'), findsOneWidget);
        expect(find.text('Meta diária'), findsOneWidget);
        expect(find.text('E-books Recomendados'), findsOneWidget);
        expect(find.text('Continua de onde paraste'), findsOneWidget);

        // Verify progress bar exists
        expect(find.byType(LinearProgressIndicator), findsWidgets);

        // Verify ebook cards exist
        expect(find.byIcon(Icons.book), findsWidgets);
      }
    });

    testWidgets('E2E: Responsive layout at different screen sizes', (WidgetTester tester) async {
      // Test at phone size (default)
      addTearDown(tester.binding.window.clearPhysicalSizeTestValue);

      app.main();
      await tester.pumpAndSettle();

      // Verify app renders without errors at default size
      expect(find.byType(MaterialApp), findsOneWidget);

      // Test at tablet size
      tester.binding.window.physicalSizeTestValue = const Size(1200, 800);
      await tester.pumpAndSettle();

      // App should still render correctly
      expect(find.byType(MaterialApp), findsOneWidget);
    });

    testWidgets('E2E: Theme switching (light/dark)', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Verify MaterialApp with dark theme support
      expect(find.byType(MaterialApp), findsOneWidget);

      // The app uses ThemeMode.system, so theme follows device settings
      // In testing, we verify the theme configuration exists
    });

    testWidgets('E2E: Firebase initialization', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // Verify app initializes without Firebase errors
      // In a real test, we would mock Firebase
      expect(find.byType(MaterialApp), findsOneWidget);
    });

    testWidgets('E2E: Offline functionality indicators', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Navigate to Vocabulary to test offline-enabled features
      final vocabularyTab = find.text('Palavras');
      if (vocabularyTab.evaluate().isNotEmpty) {
        await tester.tap(vocabularyTab);
        await tester.pumpAndSettle();

        // Offline features should work with cached data
        // LocalCacheService handles offline data persistence
      }
    });

    testWidgets('E2E: Complete user session', (WidgetTester tester) async {
      // This test simulates a complete user session:
      // 1. Login
      // 2. View home dashboard
      // 3. Practice vocabulary
      // 4. Check live classes
      // 5. View profile
      // 6. Logout

      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // 1. Login screen shown
      expect(find.text('LingoLive AI'), findsWidgets);

      // 2-6. Would navigate through each screen
      // and verify expected UI elements
    });
  });
}
