# LingoLIVE Mobile

Projeto Flutter autenticado ligado ao Firebase `lingolive-ia-f5778` e à base Firestore nomeada `ai-studio-lingoliveai-669e2e6d-3566-4aa0-ba62-227975dc5edd`.

## Preparação local

1. Instalar Flutter Stable.
2. Executar `flutter create --platforms=android,ios --org com.lingolive --project-name lingolive_mobile .` nesta pasta para materializar/atualizar os shells nativos, se ainda não existirem. O CI executa este passo automaticamente.
3. Confirmar que `android/app/google-services.json` e `ios/Runner/GoogleService-Info.plist` permanecem presentes.
4. Executar `flutter pub get`, `flutter analyze` e `flutter test`.

O cliente grava apenas perfil e preferências permitidos pelas regras. Eventos de aprendizagem, XP e memória canónica devem continuar a passar pelo backend autenticado.
