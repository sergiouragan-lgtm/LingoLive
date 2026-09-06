# Ledger de LingoCoins — Desenho Técnico Completo

Status: proposta para implementação
Contexto: LingoLive usa Firebase (Firestore + Cloud Functions). Este desenho assume Firestore como base de dados do ledger, com Cloud Functions a garantir atomicidade e o Paddle/Stripe Connect como fronteiras fiat.

---

## 1. Princípios do ledger

1. **Double-entry, sempre.** Nenhuma escrita altera um "saldo" diretamente. Toda operação gera duas (ou mais) entradas (`ledger_entries`) que se anulam em soma: um débito e um crédito de igual valor. Isto torna o sistema auditável e à prova de bugs de saldo negativo/duplicado.
2. **Imutabilidade.** Documentos em `ledger_entries` nunca são editados nem apagados. Correções fazem-se com uma entrada de estorno (reversal), nunca com update.
3. **Saldo é derivado, não é fonte de verdade.** O saldo "atual" de uma carteira é um valor cacheado (`wallets/{walletId}.balance`) recalculável a partir da soma de `ledger_entries`. O cache existe só por performance de leitura.
4. **Cada operação de negócio é uma transação Firestore atómica** (`runTransaction`), nunca uma sequência de writes soltos — evita saldo inconsistente sob concorrência (ex. dois pedidos de gasto em simultâneo).
5. **Idempotência obrigatória** em qualquer entrada que resulte de um webhook externo (Paddle, Stripe) — usar o `externalEventId` como chave de deduplicação.
6. **Moeda interna é unidirecional para o aluno**: fiat → LC sim; LC → fiat, não, para contas de aluno. Só contas de tutor (após KYC via Stripe Connect) podem converter para fiat. Isto é uma decisão de compliance, não só de produto (ver secção 6 do plano de monetização e os T&Cs).

---

## 2. Modelo de dados (Firestore)

### 2.1 `wallets/{walletId}`

```ts
interface Wallet {
  id: string;                 // = userId (1 carteira por utilizador)
  ownerId: string;
  ownerType: 'STUDENT' | 'TUTOR' | 'PLATFORM';
  balance: number;             // em "unidades" de LC, inteiro (ver 2.6 sobre precisão)
  pendingHold: number;         // LC reservados em holds ativos, não gastáveis nem levantáveis
  currency: 'LC';
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED';
  kycStatus?: 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED'; // só relevante p/ TUTOR
  stripeConnectAccountId?: string;                          // só TUTOR, após onboarding
  createdAt: Timestamp;
  updatedAt: Timestamp;
  version: number;             // optimistic concurrency / auditoria
}
```

Carteiras especiais fixas (`ownerType: 'PLATFORM'`), criadas no bootstrap:
- `wallet_platform_revenue` — onde cai a comissão retida por transação.
- `wallet_platform_liability` — carteira espelho que representa "dinheiro fiat recebido mas ainda não gasto pelos alunos" (passivo da empresa). Toda emissão de LC para um aluno tem uma entrada de débito espelhada aqui, para que a soma de todas as carteiras de alunos + holds seja sempre igual ao passivo registado. Isto é o que permite provar a um auditor que "LC em circulação = dinheiro real recebido e ainda não reconhecido como receita".
- `wallet_platform_expired` — recebe LC que caducaram (ver T&Cs, secção de validade).

### 2.2 `ledger_entries/{entryId}`

Cada linha é **um só lado** de um lançamento (estilo livro-razão clássico), agrupada por `transactionId`.

```ts
interface LedgerEntry {
  id: string;                  // autogerado
  transactionId: string;       // agrupa todas as entries do mesmo evento de negócio
  walletId: string;
  direction: 'DEBIT' | 'CREDIT';
  amount: number;              // sempre positivo; o direction indica o sinal
  balanceAfter: number;        // saldo da wallet imediatamente após esta entry (auditoria rápida)
  reason: LedgerReason;        // enum, ver 2.3
  refType?: 'BOOKING' | 'TOPUP' | 'PAYOUT' | 'REFUND' | 'ADJUSTMENT' | 'EXPIRY';
  refId?: string;              // id da aula, do pagamento Paddle, do payout Stripe, etc.
  externalEventId?: string;    // id do webhook Paddle/Stripe, para idempotência
  createdAt: Timestamp;
  createdBy: string;           // uid do actor ou 'system'
  metadata?: Record<string, unknown>;
}
```

### 2.3 `LedgerReason` (enum fechado, nunca free-text)

```
TOPUP_PADDLE          // aluno comprou LC via Paddle
BOOKING_HOLD          // LC reservados ao marcar aula (ainda não gasto)
BOOKING_RELEASE       // hold libertado sem consumo (aula cancelada antes de confirmar)
BOOKING_SETTLE        // aula confirmada: débito aluno, crédito tutor, crédito comissão plataforma
REFUND_TO_STUDENT     // reembolso em LC (nunca em fiat, salvo exceção legal)
TUTOR_PAYOUT_HOLD     // tutor pediu payout: LC saem da wallet do tutor
TUTOR_PAYOUT_SETTLE   // Stripe Connect confirmou transferência fiat: fecha o payout
TUTOR_PAYOUT_FAILED   // Stripe falhou: reverte o hold para a wallet do tutor
BONUS_GRANT           // bónus promocional/fidelização, não correspondente a fiat real
COIN_EXPIRY           // caducidade de LC não usados (ver T&Cs)
ADMIN_ADJUSTMENT      // correção manual, sempre com approvedBy + motivo obrigatório
```

### 2.4 `transactions/{transactionId}` (cabeçalho, opcional mas recomendado)

```ts
interface LedgerTransaction {
  id: string;
  type: LedgerReason;
  status: 'PENDING' | 'COMPLETED' | 'REVERSED';
  entryIds: string[];
  totalAmount: number;
  createdAt: Timestamp;
  reversedBy?: string;         // id da transação de estorno, se aplicável
}
```

Serve para consultas rápidas ("mostra-me tudo sobre esta aula") sem ter de fazer join manual sobre `ledger_entries`.

### 2.5 `holds/{holdId}` — reservas temporárias

```ts
interface Hold {
  id: string;
  walletId: string;            // wallet do aluno
  amount: number;
  bookingId: string;
  status: 'ACTIVE' | 'RELEASED' | 'SETTLED' | 'EXPIRED';
  expiresAt: Timestamp;        // hold auto-expira (ex. 48h) se a aula não avança
  createdAt: Timestamp;
}
```

### 2.6 Precisão numérica

Nunca usar `float` para saldo. LC são representados como **inteiros** (ex.: 1 LC = 1 unidade mínima, sem casas decimais internas — decide-se a taxa de câmbio no momento do top-up, ex. 1€ = 100 LC, e todos os preços de aulas são inteiros em LC). Isto elimina toda a classe de bugs de arredondamento.

---

## 3. Fluxos de negócio (transações atómicas)

### 3.1 Top-up (Paddle → LC)

1. Webhook Paddle `transaction.completed` chega a uma Cloud Function HTTPS.
2. Verifica assinatura do webhook (Paddle signing secret).
3. Verifica idempotência: `ledger_entries` onde `externalEventId == paddleEventId` — se já existe, responde 200 sem duplicar.
4. `runTransaction`:
   - Cria `transactions/{id}` tipo `TOPUP_PADDLE`, status `PENDING`.
   - Cria `ledger_entries`: CREDIT na wallet do aluno (+N LC), DEBIT em `wallet_platform_liability` (regista o passivo).
   - Atualiza `wallets/{studentWallet}.balance += N`.
   - Marca transação `COMPLETED`.
5. Responde 200 ao Paddle. Se a function falhar antes do 200, o Paddle reenvia — idempotência no passo 3 protege.

### 3.2 Reserva de aula (Booking hold)

1. Aluno confirma marcação de aula com custo `P` LC.
2. `runTransaction`:
   - Lê `wallets/{studentWallet}`. Se `balance - pendingHold < P` → aborta, erro "saldo insuficiente".
   - Cria `holds/{id}` com `amount: P`, `status: ACTIVE`, `expiresAt: now + 48h`.
   - `wallets/{studentWallet}.pendingHold += P` (saldo disponível passa a excluir P, mas balance nominal mantém-se — permite reconciliação clara).
   - Regista `ledger_entries` tipo `BOOKING_HOLD` (informativo; não move saldo real entre carteiras, só marca reserva).

### 3.3 Confirmação da aula (Settle)

Disparado quando a aula é marcada como `completed` (ex. por Cloud Function agendada X horas depois, ou por confirmação manual do aluno/tutor — a decidir no produto).

1. `runTransaction`:
   - Lê o `hold` correspondente; se não `ACTIVE`, aborta.
   - Calcula comissão: `platformFee = round(P * commissionRate)`; `tutorAmount = P - platformFee`.
   - Entries: DEBIT wallet aluno (P), CREDIT wallet tutor (tutorAmount), CREDIT `wallet_platform_revenue` (platformFee).
   - `wallets/{studentWallet}.balance -= P; pendingHold -= P`.
   - `wallets/{tutorWallet}.balance += tutorAmount`.
   - `holds/{id}.status = SETTLED`.
   - `transactions` tipo `BOOKING_SETTLE`.

### 3.4 Cancelamento antes da confirmação (Release)

- `runTransaction`: `hold.status = RELEASED`, `wallets/{studentWallet}.pendingHold -= P`. Nenhum saldo muda de mãos — o LC nunca saiu da conta do aluno, só estava reservado.

### 3.5 Hold expirado (Cloud Scheduler, cron diário/horário)

- Query `holds` com `status == ACTIVE AND expiresAt < now` → aplica o mesmo fluxo do Release automaticamente, com `reason: BOOKING_RELEASE` e `metadata.autoExpired: true`.

### 3.6 Payout do tutor (LC → fiat via Stripe Connect)

1. Tutor pede levantamento de `X` LC (deve ter `kycStatus == VERIFIED` e `stripeConnectAccountId` ativo).
2. `runTransaction`:
   - Valida `wallet.balance - pendingHold >= X`.
   - Cria `payout_requests/{id}` com status `PROCESSING`.
   - Entry `TUTOR_PAYOUT_HOLD`: DEBIT wallet tutor (X), CREDIT `wallet_platform_liability` (reabre o passivo, porque o dinheiro ainda não saiu fisicamente).
3. Cloud Function chama Stripe Connect `transfers.create` para o valor fiat equivalente (à taxa de câmbio de saída, definida em config, pode ser 1:1 com a taxa de entrada ou ter spread — ver secção 4).
4. **Callback de sucesso** (webhook Stripe `transfer.paid`): `runTransaction` marca `payout_requests.status = COMPLETED`, cria entry `TUTOR_PAYOUT_SETTLE`, DEBIT `wallet_platform_liability`, fecha o ciclo (o passivo desaparece porque o dinheiro saiu de verdade).
5. **Callback de falha**: reverte — CREDIT de volta na wallet do tutor (`TUTOR_PAYOUT_FAILED`), `payout_requests.status = FAILED`.

### 3.7 Reembolso ao aluno

- Regra geral: reembolso só em LC (crédito de volta na wallet do aluno), nunca reverte para fiat/Paddle, exceto por obrigação legal (ex. cancelamento em 14 dias em certas jurisdições — direito de retratação para consumidores da UE em compras à distância, ver secção legal dos T&Cs). Quando for legalmente exigido reembolso em fiat, é um processo manual/administrativo fora do fluxo automático, feito via Paddle refund API, com reversão espelhada no ledger (`ADMIN_ADJUSTMENT` + nota).

### 3.8 Caducidade de LC (opcional, ver T&Cs sobre limites legais)

- Cron periódico identifica LC comprados há mais de N meses e não gastos (FIFO sobre `ledger_entries` de `TOPUP_PADDLE` daquele utilizador) → gera `COIN_EXPIRY`: DEBIT wallet aluno, CREDIT `wallet_platform_expired`.
- **Importante**: em muitas jurisdições (incl. vários estados dos EUA e regras de proteção do consumidor na UE), caducidade de créditos pagos é restrita ou proibida sem aviso prévio claro e um período mínimo generoso. Ver T&Cs secção 6 — recomendação: 24 meses de validade com aviso por email 30 dias antes.

---

## 4. Regras de negócio configuráveis (não hardcoded)

Guardar em `config/monetization` (documento único, editável por admin, com histórico de alterações):

```ts
interface MonetizationConfig {
  fiatToLcRate: number;        // ex. 100 (1€ = 100 LC) — taxa de entrada
  lcToFiatRate: number;        // taxa de saída para payout (pode ter spread vs entrada)
  commissionRate: number;      // ex. 0.18 (18%)
  holdExpiryHours: number;     // ex. 48
  coinValidityMonths: number;  // ex. 24
  minPayoutAmountLc: number;   // valor mínimo de levantamento
  payoutFeeFixedLc: number;    // taxa fixa por payout
  updatedAt: Timestamp;
  updatedBy: string;
}
```

Nunca hardcode taxas no código — todo cálculo lê deste documento (com cache local de curta duração na Cloud Function).

---

## 5. Segurança e regras Firestore

- `wallets/*` e `ledger_entries/*`: **zero escrita direta do cliente**. Toda escrita passa por Cloud Functions com Admin SDK. As Firestore Security Rules destas coleções devem ser `allow write: if false;` sempre — só leitura do próprio dono (`allow read: if isOwner(resource.data.ownerId)`).
- `holds/*` e `payout_requests/*`: leitura pelo dono; escrita só via Functions.
- Todas as Cloud Functions de dinheiro devem correr com **App Check** ativo e validar `request.auth.uid` contra o `walletId`/`ownerId` antes de qualquer operação.
- Rate limiting em pedidos de payout e top-up (evitar abuso/fraude).

---

## 6. Reconciliação e auditoria

- **Invariante fundamental a validar diariamente (Cloud Function agendada)**:
  `soma(balance de todas as wallets STUDENT) + soma(pendingHold ativo) + saldo(wallet_platform_liability negativo) == 0` (dentro da margem dos payouts em curso).
- Job diário compara `Σ ledger_entries CREDIT − Σ ledger_entries DEBIT` por wallet com o `wallets/{id}.balance` cacheado — alerta (Slack/email) se divergir mesmo 1 unidade.
- Exportação mensal para contabilidade: `TOPUP_PADDLE` = receita diferida (passivo) até ser gasto (`BOOKING_SETTLE`, momento em que `platformFee` é reconhecido como receita real). Isto é standard em marketplaces com wallet (é o mesmo tratamento contabilístico que gift cards).

---

## 7. Roadmap de implementação

1. **Semana 1-2**: schema Firestore + Cloud Functions para `TOPUP_PADDLE` e leitura de saldo. Testes de idempotência com emulador.
2. **Semana 3-4**: `BOOKING_HOLD` / `BOOKING_SETTLE` / `BOOKING_RELEASE` + cron de expiração.
3. **Semana 5-6**: Stripe Connect onboarding + `TUTOR_PAYOUT_*`.
4. **Semana 7**: job de reconciliação diária + dashboard admin (saldo agregado, alertas).
5. **Semana 8**: `COIN_EXPIRY` + revisão legal final dos T&Cs antes do lançamento público.
