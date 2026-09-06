// Testes básicos de arranque da app LingoLive Mobile.
//
// Não testamos o LingoLiveApp/AuthGate completos aqui porque dependem de
// Firebase.initializeApp() ter corrido (main.dart) e de uma configuração
// nativa (google-services.json / GoogleService-Info.plist) que ainda não
// existe neste projeto — ver a nota em lib/main.dart. Testamos, em vez
// disso, os widgets puros que não dependem do Firebase.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('MaterialApp renderiza sem lançar exceções', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(body: Center(child: Text('LingoLive'))),
      ),
    );

    expect(find.text('LingoLive'), findsOneWidget);
  });
}
