# LingoLIVE IA - Referência de APIs, Integração B2B e Governação de IA (Compliance)

## 1. Mapa de Domínio Empresarial (Enterprise Domain Map)

A arquitetura corporativa da **LingoLIVE IA** foi concebida sob uma abordagem altamente modular, desenhada para escalabilidade massiva, conformidade de governança educacional e segurança militar. O mapa de domínios corporativos estabelece as fronteiras estruturais do ecossistema de micro-sistemas:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               ENTERPRISE DOMAIN LEVEL                                  │
├─────────────────────────┬─────────────────────────┬────────────────────────────────────┤
│ 👤 IDENTITY & SECURITY  │ 🎓 EDUCATION CORE       │ 🤖 AI COGNITIVE LOGIC              │
│ - Auth (Firebase/B2B)   │ - Learning Path         │ - Gemini 3.5-flash LLM             │
│ - RBAC Access Control   │ - B2B Schools Management │ - Whisper Speech-to-Text           │
│ - Audit Trails Logs     │ - CEFR Certification    │ - Pronunciation Assessment Engine  │
├─────────────────────────┼─────────────────────────┼────────────────────────────────────┤
│ 💳 PAYMENTS & BILLING   │ 🛒 MARKETPLACE          │ 📊 ANALYTICS & MESSAGING           │
│ - Stripe, PayPal, M-Pesa│ - Course Catalog        │ - Realtime WebSocket Gateway       │
│ - MultiCaixa (Angola)   │ - Educator Resources    │ - Study Progress Reports           │
│ - Corporate Invoicing   │ - B2B Licenses          │ - FCM Push Notification            │
└─────────────────────────┴─────────────────────────┴────────────────────────────────────┘
```

### Domínios Principais (Core Domains):
1. **Identity & Security:** Federação de identidades, controle de acesso baseado em funções (RBAC), barreira de proteção de dados e barramento de chaves.
2. **Education Core:** Gestão de turmas de escolas (B2B), matrículas de estudantes de redes educacionais, acompanhamento de tutores físicos e emissão de certificados CEFR.
3. **AI Cognitive Logic:** Motor neural de processamento de fala e texto composto por orquestração generativa em tempo real com Gemini e transcrição Whisper.
4. **Payments & Billing:** Plataforma global de checkout com assinaturas de recorrência e pagamentos locais em Angola e PALOP (Multicaixa, M-Pesa).
5. **Marketplace:** Licenciamento e compra de planos corporativos por parte de estabelecimentos escolares B2B.
6. **Analytics & Messaging:** Telemetria pedagógica de proficiência e serviço de chat síncrono e assíncrono via WebSockets.

---

## 2. Mapa de Contextos Delimitados (Bounded Context Map - DDD)

O LingoLIVE IA aplica os princípios de **Domain-Driven Design (DDD)** para segmentar as fronteiras de dados e garantir a independência operacional dos serviços. O mapa abaixo descreve os relacionamentos (U: Upstream, D: Downstream, Shared Kernel, Customer-Supplier):

```
                       ┌─────────────────────────┐
                       │   Identity Context      │
                       └────────────┬────────────┘
                                    │ (U)
                                    │
                                    │ (D) [Customer-Supplier]
                       ┌────────────▼────────────┐
                       │     School Context      │
                       └────────────┬────────────┘
                                    │ (U)
                                    │
                 ┌──────────────────┼──────────────────┐
                 │ (D)              │ (D)              │ (D)
        ┌────────▼────────┐┌────────▼────────┐┌────────▼────────┐
        │ Student Context ││ Teacher Context ││ Finance Context │
        └────────┬────────┘└────────┬────────┘└─────────────────┘
                 │ (U)              │ (U)
                 │                  │
                 │   [Shared Kernel]│
        ┌────────▼──────────────────▼────────┐
        │             AI Context             │
        └─────────────────┬──────────────────┘
                          │ (U)
                          │ [Customer-Supplier]
                          │ (D)
        ┌─────────────────▼──────────────────┐
        │        Assessment Context          │
        └────────────────────────────────────┘
```

1. **Student Context (Downstream de Identity, Upstream de AI):**
   - Agrega dados do estudante, progressão académica (XP, streaks) e histórico de lições.
   - Comunica com o contexto de IA via *Shared Kernel* para alimentar recomendações pedagógicas.
2. **Teacher Context (Downstream de School, Upstream de AI):**
   - Gerencia alocações de turmas, materiais didáticos, relatórios de notas e avaliações de fonética dos alunos.
3. **School Context (Upstream de Student, Teacher e Finance):**
   - Modela os limites operacionais B2B das escolas parceiras, assinaturas de licenças corporativas e faturamento multi-inquilino.
4. **AI Context (Downstream de Student e Teacher, Upstream de Assessment):**
   - Transcrição e análise de áudio de voz, geração de conversações de roleplay adaptativo em tempo real.
5. **Assessment Context (Downstream de AI):**
   - Motor de exames formais alinhado aos padrões internacionais CEFR (A1-C2) com geração automatizada de relatórios de proficiência auditados por IA.
6. **Finance Context (Downstream de School):**
   - Processamento de faturas B2B, rastreamento de transações em kwanzas angolanos e reconciliação financeira bancária.

---

## 3. Mapa de Capacidades (Capability Map)

O LingoLIVE IA possui um ecossistema abrangente de recursos integrados que apoiam tanto utilizadores individuais como redes corporativas:

* **Enrollment & Onboarding:** Autenticação federada, avaliação de nivelamento cognitivo instantâneo e fluxos dedicados para Pais/Encarregados de Educação.
* **Scheduling & Class Management:** Gestão de turmas síncronas com professores, alocação de salas e calendários automatizados.
* **Teaching & Instruction:** Lições dinâmicas estruturadas, suporte a múltiplos idiomas e variação de sotaques regionais configurados em tempo real.
* **Assessment & Evaluation:** Sistema de testes CEFR dinâmico, avaliação fonética detalhada palavra-a-palavra, sotaque e fluência.
* **Certificates & Compliance:** Emissão de certificados digitais verificáveis, criptografados com hashes no Firestore para auditoria educacional.
* **Payments & Billing:** Processamento automático por cartão (Stripe), PayPal, M-Pesa, referências em caixas eletrónicos MultiCaixa e carregamento de licenças em lote.
* **AI Tutoring & Virtual Companions:** Robôs de conversação contextual baseados em cenários de negócios reais (Kamba IA) com telemetria pedagógica contínua.
* **Administration & Analytics:** Painéis consolidados para donos de escolas B2B, professores e relatórios corporativos.

---

## 4. Referência de APIs Internas (Internal REST APIs)

As rotas internas servem o ecossistema principal do LingoLIVE. O endereço de ingresso de todas as chamadas de produção inicia no prefixo `/api`.

### 4.1 Pronúncia (Avaliador Baseado em Whisper e Gemini)
* **Endpoint:** `POST /api/pronunciation/evaluate`
* **Autenticação:** Obrigatória (`Bearer ID_TOKEN`)
* **Headers:** `Content-Type: application/json`
* **Corpo da Requisição (JSON):**
```json
{
  "targetText": "The quick brown fox jumps over the lazy dog",
  "audioBase64": "data:audio/webm;base64,GkXfo69ChoEBQveBAULygQ...",
  "language": "Inglês",
  "mimeType": "audio/webm"
}
```
* **Resposta de Sucesso (200 OK):**
```json
{
  "id": "eval_1719283921_abcde",
  "userId": "user_9923847293",
  "targetText": "The quick brown fox jumps over the lazy dog",
  "transcription": "The quick brown fox jumps over the lazy dog",
  "overallScore": 92,
  "accuracyScore": 94,
  "fluencyScore": 90,
  "completenessScore": 100,
  "speechSpeedWpm": 125,
  "pauseCount": 1,
  "accentDetected": "Sotaque de influência de Português Angolano",
  "accentConfidence": 85,
  "generalFeedback": "Excelente clareza fonética. Demonstra ritmo de fala estável, apenas com uma ligeira nasalização na consoante 'n'.",
  "phonemeAnalysis": [
    {
      "phoneme": "Voiced TH",
      "ipaSymbol": "ð",
      "accuracy": 88,
      "feedback": "Posicione ligeiramente a língua entre os dentes incisivos para evitar som de D."
    }
  ],
  "improvementTips": [
    "Aumente ligeiramente a velocidade de transição entre as palavras fox e jumps.",
    "Evite esticar a vogal curta em 'dog'."
  ],
  "timestamp": "2026-07-15T15:20:00Z"
}
```

### 4.2 Motor de Idiomas (Language Engine)
O Motor de Idiomas controla dinamicamente as 22 capacidades regulamentares do sistema para cada idioma suportado.

#### Listar Todos os Idiomas
* **Endpoint:** `GET /api/languages`
* **Autenticação:** Não obrigatória (Leitura pública do catálogo)
* **Resposta de Sucesso (200 OK):**
```json
[
  {
    "id": "en",
    "name": "Inglês",
    "nativeName": "English",
    "flag": "🇺🇸",
    "code": "en",
    "difficulty": "Médio",
    "writingSystem": "Latino",
    "rtl": false,
    "availableLevels": ["A1", "A2", "B1", "B2", "C1", "C2"],
    "lessons": 150,
    "units": 15,
    "grammar": true,
    "vocabulary": true,
    "pronunciation": true,
    "speechRecognition": true,
    "speechSynthesis": true,
    "aiTutor": true,
    "cultureModule": true,
    "quizEngine": true,
    "gameEngine": true,
    "achievements": true,
    "certification": true
  }
]
```

#### Compilar Novo Idioma (Inserção no Motor)
* **Endpoint:** `POST /api/languages`
* **Autenticação:** Obrigatória (Apenas Administradores do Sistema)
* **Corpo da Requisição (JSON):**
```json
{
  "id": "ja",
  "name": "Japonês",
  "nativeName": "日本語",
  "flag": "🇯🇵",
  "code": "ja",
  "difficulty": "Difícil",
  "writingSystem": "Hiragana/Katakana/Kanji",
  "rtl": false,
  "availableLevels": ["A1", "A2", "B1"],
  "lessons": 50,
  "units": 5,
  "grammar": true,
  "vocabulary": true,
  "pronunciation": true,
  "speechRecognition": true,
  "speechSynthesis": true,
  "aiTutor": true,
  "cultureModule": true,
  "quizEngine": true,
  "gameEngine": true,
  "achievements": true,
  "certification": false
}
```
* **Resposta de Sucesso (201 Created):** Retorna o objeto de idioma idêntico com validações de campo inserido.

---

## 5. Webhooks de Integração (Enterprise Webhooks)

Webhooks permitem que parceiros educacionais (LMS de universidades ou escolas privadas) e processadores de pagamento notifiquem o LingoLIVE de eventos externos de forma assíncrona.

### 5.1 Webhook de Reconciliação MultiCaixa / Referência
Enviado pela entidade financeira de intermediação local (ex: EMIS / SimpliPay / Pagos de Angola) quando uma referência MultiCaixa gerada pelo LingoLIVE é paga numa caixa eletrónica ou app bancária.
* **URL do Endpoint Configurada no Cliente:** `POST https://lingolive.ai/api/webhooks/multicaixa`
* **Headers:**
  - `X-Lingo-Signature`: Assinatura HMAC-SHA256 para verificar a autenticidade do remetente
  - `Content-Type`: `application/json`
* **Corpo da Notificação (JSON):**
```json
{
  "id": "evt_mc_827391823",
  "type": "payment.multicaixa.paid",
  "created": 1781523920,
  "data": {
    "reference": "912384729",
    "entity": "12144",
    "amount": 15000.00,
    "currency": "AOA",
    "transactionId": "TX_MC_98127392",
    "terminalId": "ATM_LUANDA_04",
    "paidAt": "2026-07-15T14:15:22Z"
  }
}
```

### 5.2 Webhook de Eventos de Assinatura Stripe
O processador de pagamentos Stripe dispara notificações de faturação global para sincronização de planos Premium individuais.
* **Endpoint:** `POST /api/webhooks/stripe`
* **Corpo do Evento:**
```json
{
  "id": "evt_1PbcdeFghIjklMnOp",
  "object": "event",
  "type": "customer.subscription.updated",
  "data": {
    "object": {
      "id": "sub_1PbcdeFghI",
      "customer": "cus_9283749",
      "status": "active",
      "plan": {
        "id": "price_lingolive_premium_monthly",
        "amount": 1990
      }
    }
  }
}
```

---

## 6. Arquitetura Orientada a Eventos (Event-Driven Architecture)

O LingoLIVE utiliza um barramento de eventos interno alimentado pelo Firestore Realtime Triggers e barramento de eventos em memória para garantir acoplamento zero.

### 6.1 Contratos de Eventos de Negócio (Event Contracts)

#### Evento: `StudentRegistered`
Disparado imediatamente quando uma conta de aluno é criada no LingoLIVE.
```json
{
  "eventId": "evt_reg_837283472",
  "eventName": "StudentRegistered",
  "timestamp": "2026-07-15T15:00:00.231Z",
  "version": "1.0",
  "data": {
    "userId": "user_2398472398",
    "email": "helder.sousa@gmail.com",
    "name": "Helder de Sousa",
    "role": "STUDENT",
    "schoolId": "school_default_luanda",
    "targetLanguage": "en",
    "acquisitionChannel": "B2B_SCHOOL_INVITATION"
  }
}
```

#### Evento: `PronunciationEvaluated`
Gerado sempre que o sistema fonético conclui a análise de áudio de voz.
```json
{
  "eventId": "evt_pron_982349182",
  "eventName": "PronunciationEvaluated",
  "timestamp": "2026-07-15T15:20:01.045Z",
  "version": "1.1",
  "data": {
    "evaluationId": "eval_1719283921_abcde",
    "userId": "user_9923847293",
    "targetText": "The quick brown fox jumps over the lazy dog",
    "overallScore": 92,
    "accuracyScore": 94,
    "fluencyScore": 90,
    "accentDetected": "Sotaque de influência de Português Angolano",
    "speechSpeedWpm": 125,
    "detectedMimeType": "audio/webm"
  }
}
```

#### Evento: `CertificateIssued`
Publicado quando um aluno atinge proficiência CEFR comprovada e o documento digital é compilado.
```json
{
  "eventId": "evt_cert_349817293",
  "eventName": "CertificateIssued",
  "timestamp": "2026-07-15T16:00:00.000Z",
  "version": "1.0",
  "data": {
    "certificateId": "cert_9812739",
    "userId": "user_9923847293",
    "studentName": "Aline Cassinda",
    "language": "Inglês",
    "cefrLevel": "B2",
    "overallScore": 89,
    "hashVerification": "sha256_9a1c3e5f7b8d0c2a...",
    "issuedAt": "2026-07-15T16:00:00Z"
  }
}
```

#### Outros Eventos Homologados:
- `LessonCompleted`: Transmite o progresso diário de XP e avanço de capítulos curriculares.
- `QuizPassed`: Emitido ao concluir testes sumativos com a pontuação global.
- `SubscriptionRenewed`: Despoletado na renovação de pacotes de licenças escolares ou utilizadores finais.
- `TeacherAssigned`: Liga uma turma escolar ou aluno individual a um professor tutor certificado.
- `AIConversationStarted`: Monitoriza o início de uma sessão imersiva de roleplay com Kamba IA.

---

## 7. Versionamento de APIs (API Versioning Guidelines)

Para garantir estabilidade contínua e mitigar interrupções em integrações escolares B2B sensíveis, o LingoLIVE IA estabelece diretrizes rigorosas de versionamento:

1. **Versionamento via URL:** Todas as rotas expostas para integrações públicas devem herdar o prefixo de versão na URL. Exemplo: `/api/v1/pronunciation/evaluate`.
2. **Versionamento Semântico (SemVer):** O software segue as regras de `MAJOR.MINOR.PATCH`.
   - Mudanças de `MAJOR` (ex: `/api/v1` para `/api/v2`) ocorrem apenas em reestruturações completas de assinaturas de payload e requerem um plano de migração de 6 meses.
   - Incrementos de `MINOR` (novos campos não obrigatórios adicionados na resposta) ou `PATCH` (correções de bugs) são integrados de forma transparente sem alteração de URL.
3. **Cabeçalho de Descontinuação (Deprecation Policy):** Quando um endpoint for descontinuado, todas as respostas retornarão o cabeçalho HTTP `Sunset: Date` e `Warning: "Deprecated endpoint. Upgrade to V2 before <date>"`.

---

## 8. Governação e Ética em IA (AI Governance & Safety)

Este é um pilar crucial regulamentar que estabelece o uso ético dos LLMs e processamento de áudio dos estudantes no LingoLIVE IA:

```
                              ┌────────────────────────────────────────┐
                              │  Entrada de Áudio / Texto do Estudante │
                              └───────────────────┬────────────────────┘
                                                  │
                                                  ▼
                              ┌────────────────────────────────────────┐
                              │     Camada 1: Filtro de PII & RGPD     │
                              │     (Anonimização de dados pessoais)   │
                              └───────────────────┬────────────────────┘
                                                  │
                                                  ▼
                              ┌────────────────────────────────────────┐
                              │   Camada 2: Validação de Segurança     │
                              │     (Anti-Prompt Injection / Abuso)    │
                              └───────────────────┬────────────────────┘
                                                  │
                                                  ▼
                              ┌────────────────────────────────────────┐
                              │      Camada 3: Motor Cognitivo         │
                              │     (Processamento Whisper & Gemini)   │
                              └───────────────────┬────────────────────┘
                                                  │
                                                  ▼
                              ┌────────────────────────────────────────┐
                              │   Camada 4: Auditoria de Output        │
                              │     (Filtro de Toxicidade & Alucinação)│
                              └───────────────────┬────────────────────┘
                                                  │
                                                  ▼
                              ┌────────────────────────────────────────┐
                              │      Resposta Pedagógica de Sucesso    │
                              └────────────────────────────────────────┘
```

### Princípios da Governação IA no LingoLIVE:
1. **Mascaramento de PII (Personally Identifiable Information):** Quaisquer dados pessoais sensíveis transmitidos em sessões de conversação livre (nomes completos, moradas de residência, detalhes financeiros de utilizadores menores) são imediatamente filtrados e anonimizados por regexes dedicadas no servidor de middleware corporativo antes do envio às APIs públicas do LLM.
2. **Guarda-Róis de Moderação e Toxicidade (Guardrails):** O sistema monitoriza continuamente o tráfego de entrada e saída. Respostas que cruzem limiares de toxicidade de discurso de ódio, violência ou assédio disparam cancelamentos automáticos imediatos de resposta com erro amigável, registando o log na área do administrador escolar.
3. **Segurança de Prompt (Anti-Prompt Injection):** O LingoLIVE incorpora instruções de sistema blindadas no Gemini, garantindo que o agente recuse comandos externos maliciosos que visem reconfigurar a sua personalidade ou extrair segredos de estado do código corporativo.
4. **Alinhamento Pedagógico (Pedagogical Moderation):** A IA atua estritamente na persona de tutor amigável, construtivo e livre de preconceitos culturais, incentivando línguas nativas de comunidades minoritárias e valorizando pronúncias regionais com feedback positivo e pedagógico científico.
5. **Legislação Aplicável:** Plena conformidade com os regulamentos de proteção de dados aplicáveis (RGPD da União Europeia, Lei de Proteção de Dados de Angola - Lei n.º 22/11, e CCPA).

---

## 9. Proteção contra Abuso e DDoS (Rate Limiting & DDoS Prevention)

Para salvaguardar a disponibilidade contínua dos serviços corporativos do **LingoLIVE IA** e garantir conformidade com a norma **ISO/IEC 27001:2022 Controlo A.12.1.2** (Gestão de Capacidade) e **A.12.6.1** (Gestão de Vulnerabilidades Técnicas), a plataforma implementa uma camada rigorosa de controlo de frequência de acessos baseada no algoritmo de **Janela Deslizante (Sliding Window Log)**.

### 9.1 Algoritmo de Janela Deslizante (Sliding Window Log)

Diferente do algoritmo de janela fixa (que reinicia contadores abruptamente a cada bloco de tempo, permitindo "rajadas" de tráfego no limite da transição), o **Sliding Window Log** rastreia timestamps individuais de requisições de forma sub-segundo para cada cliente:

1. **Geração de Chave de Isolamento:** A chave de limitação combina o caminho do recurso (`req.path`), o endereço IP do cliente (`req.ip` ou cabeçalho `x-forwarded-for`) e o identificador do utilizador autenticado (`user.uid` ou `anonymous`), mitigando ataques distribuídos e abusos de contas individuais de forma isolada.
2. **Expurgo em Tempo Real:** No instante de cada requisição, timestamps antigos que caíram fora do limite da janela deslizante (`now - windowMs`) são expurgados do registo em memória.
3. **Avaliação Estrita:** Se a contagem de registos restantes exceder o teto máximo permitido (`max`), o pedido é imediatamente rejeitado com o código de estado HTTP **429 Too Many Requests**. Caso contrário, o novo timestamp é adicionado à lista e a execução do endpoint prossegue normalmente.
4. **Prevenção de Fugas de Memória:** Um serviço interno monitoriza continuamente a memória coletiva e executa tarefas de limpeza de chaves inativas em segundo plano a cada 5 minutos.

### 9.2 Limites por Endpoint (Policies)

Os limites de taxas são configurados e ajustados dinamicamente para cada tipo de transação com base na sua criticidade computacional e sensibilidade financeira:

| Tipo de Limite / Middleware | Janela de Tempo | Limite Máximo | Finalidade Pedagógica / Operacional | Código de Erro / Mensagem |
| :--- | :--- | :--- | :--- | :--- |
| **chatLimiter** | 60 segundos | 20 requisições | Limitação do Chat com Kamba IA para evitar sobrecarga no LLM Gemini. | `429 Too Many Requests` (Excedeu limite do chat) |
| **mamboLimiter** | 60 segundos | 20 requisições | Limitação das mensagens do chat corporativo Mambo. | `429 Too Many Requests` (Excedeu limite do Mambo Chat) |
| **feedbackLimiter**| 60 segundos | 10 requisições | Proteção de submissões de feedback pedagógico e relatórios de bugs. | `429 Too Many Requests` (Excedeu limite de feedback) |
| **explainPhraseLimiter**| 60 segundos | 30 requisições | Proteção de chamadas repetitivas de auxílio de tradução e análise fonética. | `429 Too Many Requests` (Excedeu limite de tradução) |
| **paymentsLimiter** | 60 segundos | 10 requisições | Prevenção de ataques de força bruta ou estouro de API contra portais de pagamento (Stripe, PayPal, MultiCaixa, M-Pesa). | `429 Too Many Requests` (Excedeu limite de checkout/pagamentos) |
| **checkWsRateLimit**| 60 segundos | 10 ligações | Limitação de conexões WebSocket concorrentes por IP/UID para mitigação de exaustão de descritores de ficheiros no gateway. | Rejeição silenciosa da conexão síncrona. |

### 9.3 Cabeçalhos HTTP de Controlo (Response Headers)

Para apoiar integradores de sistemas corporativos B2B a efetuarem "back-off" dinâmico no tráfego enviado, todas as respostas sujeitas a taxas incluem os seguintes cabeçalhos padrão:

```http
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 15
X-RateLimit-Reset-Ms: 42500
```

Se a requisição for rejeitada (`HTTP 429`), o cabeçalho de repetição padrão é enviado:

```http
Retry-After: 43
```

A resposta retornará um corpo JSON estruturado no seguinte formato de segurança:

```json
{
  "error": "Excedeu o limite de mensagens do chat (máximo 20 por minuto). Por favor, aguarde um momento.",
  "retryAfterSeconds": 43,
  "limit": 20,
  "windowMs": 60000
}
```

