# STEP 1: Stripe Webhook Integration — Status Report

**Data**: 2026-09-20  
**Status**: ✅ ~70% Completo — Faltam refinamentos finais

---

## 1.1 - Verificação de Stripe Routes Existentes

### ✅ Implementado

**Arquivo**: `server/routes/payment.routes.ts`

```typescript
// ✅ Webhook endpoint já existe
router.post("/stripe-webhook", express.raw({ type: "*/*" }), async (req: any, res: any) => {
  // Valida signature
  // Processa evento via StripeService.handleWebhookEvent()
})

// ✅ Checkout session
router.post("/create-checkout-session", ...)

// ✅ Bank transfer fallback
router.post("/create-bank-transfer-reference", ...)
```

**Arquivo**: `server/services/stripe.service.ts`

Eventos já implementados:
- ✅ `checkout.session.completed` — Pagamento inicial confirmado
- ✅ `checkout.session.async_payment_failed` — Falha de pagamento
- ✅ `invoice.paid` — Renovação de subscription

---

## 1.2 - Webhook Handlers Faltantes

### ⏳ Necessário Implementar

Os seguintes eventos **devem** ser adicionados para **robustez produção**:

| Evento | Status | Ação |
|--------|--------|------|
| `invoice.payment_failed` | ❌ Falta | Alertar user de falha de renovação |
| `customer.subscription.updated` | ❌ Falta | Atualizar plano/features |
| `customer.subscription.deleted` | ❌ Falta | Revogar acesso quando cancelled |
| `charge.dispute.created` | ❌ Falta | Flagar como chargeback, revogar acesso |
| `charge.refunded` | ❌ Falta | Processar reembolso |
| `payment_intent.payment_failed` | ⚠️ Parcial | Melhorar retry notifications |

---

## 1.3 - Retry Logic & Dead Letter Queue

### ⚠️ Status Atual

**Arquivo**: `server/services/paymentEngine.service.ts`

Existe implementação de:
- ✅ Event lock (idempotency via `acquireEventLock`)
- ✅ Event processing tracking via `markEventProcessed`
- ⏳ Retry logic: **Não está explícito** — precisar revisar

**Necessário**:
```typescript
// Implementar retry service
server/services/webhookRetry.service.ts

- Max 3 tentativas com backoff exponencial
- Dead letter queue: se falha 3x, pedir manual review
- Email alerts para eventos críticos que falham
```

---

## 1.4 - Testes de Webhook

### ⏳ Necessário Implementar

**Stripe CLI Testing**:
```bash
# Ainda NÃO testado com ambiente local

# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# Escutar webhooks
stripe listen --forward-to http://localhost:3000/api/stripe-webhook

# Simular eventos
stripe trigger invoice.payment_succeeded
stripe trigger customer.subscription.deleted
stripe trigger charge.dispute.created
```

**Testes Automatizados**:
- ⏳ Testes vitest para cada evento Stripe
- ⏳ Testes de idempotency (duplicar webhook 3x, apenas 1x processado)
- ⏳ Testes de fallback quando Firebase falha

---

## 1.5 - Configuração Produção

### 📋 Checklist

**Variáveis de Ambiente** (`.env.production`):
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...
STRIPE_WEBHOOK_ENDPOINT_ID=we_...
```

**Configurar Webhook no Stripe Dashboard**:
- [ ] Ir a https://dashboard.stripe.com/webhooks
- [ ] Endpoint: `https://api.lingolive.com/api/stripe-webhook`
- [ ] Eventos: `invoice.*`, `charge.*`, `customer.subscription.*`, `payment_intent.*`
- [ ] Versão API: 2024-11 (latest)
- [ ] Copiar Webhook Secret para `.env.production`

**Testing & Validation**:
- [ ] Criar subscription teste → verificar webhook processado
- [ ] Simular pagamento falho → verificar retry
- [ ] Verificar dead letter queue vazio (nenhuma falha)
- [ ] Load test: 100 req/s de webhooks → nenhum duplicado

---

## Roadmap — Próximos Passos

### **Próximo**: STEP 1.3 - Implementar Retry Logic

**Arquivo a criar**: `server/services/webhookRetry.service.ts`

```typescript
export class WebhookRetryService {
  // Max 3 tentativas
  // Backoff: 2s, 4s, 8s
  // Dead letter: Firestore collection "webhook_dead_letters"
  // Alert: Email para ops@ quando falha
  
  static async processWithRetry(
    eventId: string,
    eventType: string,
    handler: () => Promise<void>
  ): Promise<void> {
    // implementation
  }
}
```

**Estimativa**: 2-3 horas

### **Depois**: STEP 1.4 - Testes Automatizados

Criar `server/routes/__tests__/payment.webhook.test.ts` com:
- Test cada evento Stripe
- Test idempotency
- Test error handling

**Estimativa**: 1-2 horas

### **Final**: STEP 1.5 - Deploy & Validação

- Configurar Stripe Dashboard
- Deploy para staging
- Testes E2E com Stripe CLI
- Deploy para production

**Estimativa**: 2-3 horas

---

## Próximas Ações Imediatas

**Hoje (Próximas 30 min)**:
1. [ ] Revisar `paymentEngine.service.ts` para entender retry logic atual
2. [ ] Verificar se `webhook_dead_letters` collection existe
3. [ ] Confirmar variáveis de ambiente no `.env`

**Amanhã (STEP 1.3)**:
1. [ ] Implementar `webhookRetry.service.ts`
2. [ ] Integrar com `stripe.service.ts`
3. [ ] Testar com Stripe CLI

**Próximos 2 dias (STEP 1.4-1.5)**:
1. [ ] Testes automatizados
2. [ ] Deploy staging
3. [ ] Validação produção

---

## Links Úteis

- Stripe Webhooks API: https://stripe.com/docs/webhooks
- Stripe CLI: https://stripe.com/docs/stripe-cli
- Event Types: https://stripe.com/docs/api/events/types
- Webhook Security: https://stripe.com/docs/webhooks/signatures

---

**Responsável**: Claude Haiku 4.5  
**Branch**: `phase-6-backend-integration`  
**PR**: #46 (será criada)
