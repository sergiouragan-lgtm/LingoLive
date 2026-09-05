# LingoLIVE Mobile — Entrega ponta a ponta

Este documento descreve o que foi implementado para a aplicação móvel e como
validar cada parte num dispositivo real.

---

## 1. Atividades de aprendizagem

Três atividades, todas com decisão no servidor.

### Quiz

`server/services/learning/mobileQuiz.service.ts`

- `loadMobileQuiz` devolve apenas questões auto-corrigíveis
  (`multiple-choice`, `true-false`, `fill-blank`) e **remove o gabarito**.
  Questões de ensaio ficam de fora: exigem correção por IA e pertencem ao fluxo
  web `/api/assessment/submit`, já existente.
- `gradeMobileQuiz` compara contra `assessment_exams` normalizando maiúsculas e
  espaços, pondera por pontos (não por contagem de acertos) e classifica cada
  termo como dominado ou a reforçar.
- Uma questão sem `correctAnswer` definido nunca é dada como correta.

### Pronúncia

Reutiliza `/api/pronunciation/evaluate` (Whisper com recurso a Gemini), que já
persiste em `pronunciation_results`. A app chama depois
`POST /api/mobile/pronunciation/record`, que **relê a pontuação do documento
persistido** — o cliente nunca a envia — e valida que a avaliação pertence ao
utilizador autenticado.

Quando os avaliadores reais estão indisponíveis o servidor devolve
`PRONUNCIATION_EVALUATION_UNAVAILABLE` (503) e a app mostra o erro. Não existe
pontuação estimada localmente.

### Flashcards

`server/services/learning/flashcardSrs.service.ts` implementa SM-2 no servidor:

| Repetição | Intervalo |
| --- | --- |
| 1.ª correta | 1 dia |
| 2.ª correta | 6 dias |
| 3.ª+ correta | intervalo anterior × fator de facilidade |
| Falha (qualidade < 3) | reinicia o ciclo, revisão amanhã |

O fator de facilidade nunca desce abaixo de 1,3. O cliente envia apenas a
autoavaliação (0..5); intervalos e datas são calculados aqui.

---

## 2. Eventos canónicos, XP, memória e progresso

`server/services/learning/learningEvents.service.ts`

### Catálogo canónico

| Evento | Fonte de XP | XP |
| --- | --- | --- |
| `learning.quiz.completed` | `quiz_attempt` | 100 |
| `learning.pronunciation.evaluated` | `speaking_practice` | 40 |
| `learning.flashcard.reviewed` | `activity_completion` | 30 |

Os valores vêm da mesma matriz de recompensas de `/api/gamification/award-xp`,
para que a mesma atividade valha o mesmo em web e mobile.

### Idempotência

A chave de um evento é `sha256(tipo | tenant | utilizador | atividade)`. O
`activityId` inclui o `attemptId`/`sessionId` gerado pelo cliente, portanto:

- reenviar a mesma submissão após uma falha de rede → o mesmo evento, **sem XP
  duplicado** (`duplicated: true` na resposta);
- uma tentativa genuinamente nova → um evento novo.

O mesmo `sha256` protege a escrita de XP em `xp_audit_logs`.

### Pipeline

```
POST /api/mobile/{quiz|pronunciation|flashcards}
  → publishLearningEvent      → learning_events (idempotente)
  → awardXpForLearningEvent   → user_gamification + leaderboard_entries + xp_audit_logs (transação)
  → projectEventIntoMemory    → user_memory (vocabulário dominado / a reforçar)
  → projectEventIntoProgress  → adaptive_profiles (médias por competência)
```

Um termo classificado como fraqueza passa a dominado assim que é acertado, e sai
da lista de fraquezas — a memória converge em vez de acumular.

### Dashboard

`GET /api/mobile/dashboard` agrega XP/nível/moedas, médias por atividade,
memória de longo prazo e a linha temporal dos eventos. **Ausência de evidência
devolve `null`, não zero** — a app mostra `—`. Distinguir "ainda não praticou"
de "praticou e teve 0%" é o que impede o dashboard de mentir a um aluno novo.

---

## 3. Autorização escolar por claims e tenant real

`server/services/schoolClaims.service.ts` · `server/middleware/requireSchoolClaims.ts`

### Precedência deliberada

1. **Custom claims do token** — assinadas pelo Firebase, não forjáveis.
2. `users/{uid}` — apenas enquanto o token não estiver sincronizado.
3. **Nunca o corpo do pedido.**

Sem tenant resolúvel o pedido é recusado (`SCHOOL_TENANT_UNRESOLVED`, 403). Falha
fechado: não existe tenant por omissão.

### Regras de escalada

- Só `SUPER_ADMIN`, `PLATFORM_ADMIN`, `ORG_ADMIN` e `SCHOOL_ADMIN` concedem claims.
- Um administrador só concede dentro do seu próprio tenant.
- Ninguém concede um papel de alcance global sem já o ter.
- Sem Firebase Admin Auth disponível, `POST /api/school/claims/assign` devolve
  503 — nunca finge ter concedido a autorização.

### Papéis legados

`LEARNER → STUDENT`, `PARENT → PARENT_GUARDIAN`, `PROFESSOR → TEACHER`, etc.
Um papel desconhecido devolve `null` e é rejeitado, em vez de degradar
silenciosamente para um papel por omissão.

### Endpoints

| Método | Rota | Efeito |
| --- | --- | --- |
| `GET` | `/api/school/claims/me` | Claims efetivas do próprio utilizador |
| `POST` | `/api/school/claims/assign` | `setCustomUserClaims` real + espelho em `users/` + `auditLogs` |
| `GET` | `/api/school/directory` | Professores e alunos do tenant; um professor vê só as suas turmas |
| `POST` | `/api/professores` | Escola e tenant derivados das claims, não do corpo |

---

## 4. Checkout e retorno do pagamento

### Porquê uma ponte HTTPS

O Stripe Checkout recusa esquemas personalizados (`lingolive://`) como
`success_url`, e as App Links do Android exigem um domínio verificado. O caminho
suportado é:

```
Stripe → https://<app>/api/mobile/billing/return?outcome=success&session_id=…
       → lingolive://billing/success?session_id=…
       → app nativa
```

### O deep link não desbloqueia nada

Ao regressar, a app chama `GET /api/mobile/billing/verify/:sessionId`, que:

1. Lê a sessão **junto do Stripe** (`checkout.sessions.retrieve`).
2. Confirma que a sessão pertence ao utilizador autenticado
   (`CHECKOUT_SESSION_FORBIDDEN` caso contrário).
3. Só com `payment_status === "paid"` reconcilia via
   `PaymentEngineService.handlePaymentSuccess`, que é idempotente pelo
   `transactionId` — verificar duas vezes não duplica a subscrição.

Um deep link forjado por outra aplicação não concede acesso: a verificação
falha e o entitlement permanece inativo.

### Rede de segurança no dispositivo

`CheckoutScreen` observa o ciclo de vida da app: se o utilizador fechar o
navegador sem seguir o link de retorno, a sessão pendente é verificada na mesma
quando a app volta ao primeiro plano. Há ainda um botão explícito
"Já paguei — verificar agora".

### Validação num dispositivo real

1. `flutter run --dart-define=LINGOLIVE_API_BASE_URL=https://<staging>` num
   telefone físico.
2. Subscrição → escolher plano → o Stripe abre no navegador do sistema.
3. Pagar com um cartão de teste (`4242 4242 4242 4242`).
4. Confirmar que o telefone regressa à app e mostra "Pagamento confirmado".
5. Confirmar em `/pagamentos/{paymentId}` que existe **um só** registo.
6. Repetir o passo 4 (voltar ao ecrã e verificar de novo) e confirmar que o
   registo continua único.
7. Teste negativo: abrir `lingolive://billing/success?session_id=cs_inventado`
   com `adb shell am start` e confirmar que o entitlement não muda.

---

## 5. Push, Crashlytics e distribuição interna

### Push

- `POST /api/mobile/devices` regista o token FCM com o UID **do token
  verificado**; tokens `simulated_*` são recusados com 422.
- `DELETE /api/mobile/devices/:token` desativa o token no logout — sem isto, um
  telefone partilhado continuaria a receber notificações do utilizador anterior.
- `server/services/pushDelivery.service.ts` entrega ao token web **e** aos
  tokens nativos, sem duplicados, e desativa automaticamente os tokens que o
  FCM recusa como não registados.
- O agendador de lembretes em `server.ts` passou a usar este serviço, pelo que
  os lembretes diários que já existiam chegam agora também ao telemóvel.

### Crashlytics

`apps/mobile/lib/core/crash_reporter.dart` cobre os três canais por onde um erro
pode escapar numa app Flutter: `FlutterError.onError`, `PlatformDispatcher.onError`
e os isolates em segundo plano. A recolha está desligada em debug para não
poluir a consola. A sessão é identificada por `userId`, `tenantId` e `role`, de
modo a correlacionar um crash com a escola afetada sem expor dados pessoais.

### Distribuição interna

`.github/workflows/mobile-internal-distribution.yml`

- **Fase 1** (PRs incluídos): `dart format --set-exit-if-changed`,
  `flutter analyze`, `flutter test`.
- **Fase 2** (main e manual): build de release assinado, upload dos símbolos
  nativos para o Crashlytics e distribuição ao grupo `internos-lingolive` via
  Firebase App Distribution. O APK fica também como artefacto do workflow.

Sem os segredos configurados o workflow **avisa e continua** — produz o build sem
distribuir, em vez de falhar de forma opaca.

#### Segredos necessários

| Segredo | Uso |
| --- | --- |
| `FIREBASE_SERVICE_ACCOUNT` | JSON da conta de serviço (App Distribution + Crashlytics) |
| `FIREBASE_ANDROID_APP_ID` | ID da app Android no Firebase (`1:…:android:…`) |
| `ANDROID_GOOGLE_SERVICES_JSON` | `google-services.json` |
| `ANDROID_KEYSTORE_BASE64` | Keystore de assinatura em base64 |
| `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` | Credenciais do keystore |
| `LINGOLIVE_API_BASE_URL` | Backend usado pelo build interno |

---

## 6. Variáveis de ambiente do servidor

| Variável | Omissão | Efeito |
| --- | --- | --- |
| `MOBILE_DEEP_LINK_SCHEME` | `lingolive` | Esquema de retorno; tem de coincidir com o `AndroidManifest.xml` e o `Info.plist` (verificado por teste) |
| `APP_BASE_URL` | URL de Cloud Run | Base das URLs de retorno do Stripe |

---

## 7. Cobertura de testes

```bash
npx vitest run server/services/learning server/services/schoolClaims.test.ts \
  server/services/pushDelivery.test.ts server/routes/mobileContract.test.ts
```

| Ficheiro | Cobre |
| --- | --- |
| `learningEvents.test.ts` | Catálogo canónico, idempotência, isolamento por tenant, projeções de XP/memória/progresso |
| `mobileQuiz.test.ts` | Não fuga do gabarito, ponderação por pontos, respostas em falta, exames por publicar |
| `flashcardSrs.test.ts` | Progressão SM-2, reinício em falha, limite do fator de facilidade |
| `schoolClaims.test.ts` | Precedência das claims, falha fechada, bloqueio de escalada e de tenant cruzado |
| `pushDelivery.test.ts` | Deduplicação de destinos, exclusão de tokens desativados e simulados |
| `mobileContract.test.ts` | Contrato das rotas, coerência do esquema de deep link entre servidor/Android/iOS, regras do Firestore |

Do lado Flutter: `cd apps/mobile && flutter test`.
