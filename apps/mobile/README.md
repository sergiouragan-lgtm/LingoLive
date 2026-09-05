# LingoLIVE — Aplicação Móvel (Flutter)

Aplicação nativa Android/iOS com as atividades de aprendizagem (quiz, pronúncia
e flashcards), o dashboard de progresso e o fluxo de subscrição.

## Princípio de arquitetura

**O dispositivo não decide nada que valha pontos.** Correção de quiz, avaliação
de pronúncia, agendamento SRS, atribuição de XP e ativação de subscrição são
todos calculados no backend Express. A app transporta respostas e apresenta
veredictos — o que a torna impossível de manipular a partir de um cliente
modificado, e mantém web e mobile em concordância exata.

| Camada | Ficheiros | Responsabilidade |
| --- | --- | --- |
| Transporte | `lib/core/api_client.dart` | ID token do Firebase em cada pedido, renovação em 401, erros com código canónico |
| Contratos | `lib/models/learning_models.dart` | Espelho tipado de `/api/mobile/*`, incluindo os nomes de eventos canónicos |
| Dados | `lib/data/*.dart` | Repositórios de aprendizagem e faturação |
| Ecrãs | `lib/features/*` | Dashboard, quiz, pronúncia, flashcards, checkout |
| Plataforma | `lib/core/{push_messaging,crash_reporter,deep_links}.dart` | FCM, Crashlytics, retorno de pagamento |

## Endpoints consumidos

| Ecrã | Endpoint |
| --- | --- |
| Dashboard | `GET /api/mobile/dashboard` |
| Catálogo | `GET /api/mobile/activities` |
| Quiz | `GET /api/mobile/quiz/:id` · `POST /api/mobile/quiz/submit` |
| Pronúncia | `POST /api/pronunciation/evaluate` · `POST /api/mobile/pronunciation/record` |
| Flashcards | `GET /api/mobile/flashcards/due` · `POST /api/mobile/flashcards/review` |
| Autorização | `GET /api/school/claims/me` |
| Subscrição | `POST /api/mobile/billing/checkout-session` · `GET /api/mobile/billing/verify/:id` · `GET /api/mobile/billing/entitlement` |
| Push | `POST /api/mobile/devices` · `DELETE /api/mobile/devices/:token` |

## Executar localmente

```bash
cd apps/mobile
flutter pub get
flutter run \
  --dart-define=LINGOLIVE_API_BASE_URL=http://10.0.2.2:3000 \
  --dart-define=APP_FLAVOR=internal
```

`10.0.2.2` é o host da máquina visto de dentro do emulador Android. Num
dispositivo físico use o IP da máquina na mesma rede, ou a URL de staging.

## Ficheiros de configuração Firebase

Não estão versionados. Antes de compilar, coloque:

- `android/app/google-services.json`
- `ios/Runner/GoogleService-Info.plist`

Ambos são descarregados da consola Firebase do projeto LingoLIVE.

## Testes

```bash
flutter test
flutter analyze
```

Os testes cobrem o parsing do contrato da API e a interpretação dos deep links
de retorno de pagamento. A lógica de negócio propriamente dita é testada do lado
do servidor (`npx vitest run server/`), que é onde ela vive.
