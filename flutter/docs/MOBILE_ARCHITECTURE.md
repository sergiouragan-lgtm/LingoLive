# LingoLive Mobile

Aplicação Flutter feature-first. Firestore continua a fonte oficial: `intelligentProfiles/{uid}` alimenta o dashboard, `adaptive_generated_materials` alimenta o leitor e `ebook_audio_assets` fornece o contrato de karaoke. Tentativas offline usam chaves de idempotência e uma fila local antes da sincronização.

O projeto não inclui credenciais Firebase. Cada ambiente deve fornecer `android/app/google-services.json` e `ios/Runner/GoogleService-Info.plist` através do cofre de segredos do pipeline.
