# Backend Integration Roadmap — 5 Passos Ponta a Ponta

> **Timeline**: 2-3 semanas | **Status**: Phase 6 Initialization | **v1.0.0-backend**

---

## Visão Geral

LingoLive v1.0.0 está mergedo em `main` com 48.640+ linhas de código (Phases 1-5 + Phase 4 Mobile App).

Os próximos 5 passos completam a entrega com integração full de backend, infraestrutura e QA:

| Step | Componente | Tempo | Status |
|------|-----------|-------|--------|
| **1** | Stripe Webhook Integration (Pagamentos) | 3-4 dias | ⏳ Planejado |
| **2** | LiveKit WebRTC Setup (Live Classes) | 3-4 dias | ⏳ Planejado |
| **3** | OpenAI API Integration (AI Tutor) | 2-3 dias | ⏳ Planejado |
| **4** | GCP Cloud Run Deployment | 3-5 dias | ⏳ Planejado |
| **5** | QA & Beta Testing | 5-7 dias | ⏳ Planejado |

---

## STEP 1: Stripe Webhook Integration (Pagamentos Completos)

### 1.1 - Verificar Stripe Routes Existentes

**Arquivos críticos:**
```
src/server/routes/payment.routes.ts      # Rotas de pagamento
src/server/routes/adminPayment.routes.ts # Painel admin
src/server/services/payment.service.ts   # Lógica de pagamento
```

**Ações:**
- [ ] Verificar se webhook endpoint `/api/webhooks/stripe` existe
- [ ] Confirmar variáveis de ambiente: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- [ ] Revisar eventos Stripe que estão sendo processados (payment_intent, charge, subscription)

### 1.2 - Implementar Webhook Handlers Faltantes

**Eventos a implementar:**
```typescript
// Eventos críticos:
- invoice.payment_succeeded       // Pagamento da fatura confirmado
- invoice.payment_failed          // Falha de pagamento
- customer.subscription.updated   // Alteração de plano
- customer.subscription.deleted   // Cancelamento
- charge.dispute.created          // Disputa iniciada
```

**Código exemplo (novo arquivo):**
```
src/server/routes/webhooks/stripe.webhook.ts

import { Router } from 'express';
import stripe from 'stripe';
import { dbAdmin } from '../../config/firebaseAdmin';

const router = Router();

// Webhook endpoint - DEVE vir ANTES de express.json()
router.post('/webhooks/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    
    // Process different event types
    switch(event.type) {
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      // ... more handlers
    }
    
    res.json({received: true});
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

export default router;
```

### 1.3 - Implementar Retry Logic & Dead Letter Queue

**Padrão (novo arquivo):**
```
src/server/services/webhookRetry.service.ts

- Max 3 tentativas para processar webhook
- Exponential backoff: 2s, 4s, 8s
- Dead letter queue em Firestore para webhooks que falharem
- Alert email para eventos críticos que falham
```

### 1.4 - Testes de Webhook

**Scripts a criar:**
```bash
# Test webhook locally with Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger invoice.payment_succeeded
stripe trigger payment_intent.succeeded
```

### 1.5 - Validação & Deploy

- [ ] Verificar `STRIPE_WEBHOOK_SECRET` no `.env`
- [ ] Testar fluxo completo: criar subscription → pagamento → webhook disparado
- [ ] Validar que user profile é atualizado com status 'active'
- [ ] Testar retry logic com falhas simuladas

**Entrega Step 1:**
- ✅ Webhook endpoints funcionando
- ✅ Retry logic implementado
- ✅ Todos os eventos Stripe sendo processados
- ✅ Dead letter queue monitorando falhas

---

## STEP 2: LiveKit WebRTC Setup (Live Classes)

### 2.1 - Provisionar LiveKit Cloud Account

**Ações manuais:**
- [ ] Criar conta em https://livekit.io
- [ ] Gerar API Key e API Secret
- [ ] Criar projeto "LingoLive"
- [ ] Notar os valores: `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`

### 2.2 - Criar LiveKit Service Backend

**Novo arquivo:**
```
src/server/services/livekit.service.ts

import { AccessToken } from 'livekit-server-sdk';

export const generateToken = (
  userId: string,
  roomName: string,
  userName: string
): Promise<string> => {
  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!
  );
  
  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });
  
  token.identity = userId;
  token.name = userName;
  
  return token.toJwt();
};

export const createRoom = async (roomName: string, maxParticipants: number) => {
  // Create and configure room
};

export const endSession = async (roomName: string) => {
  // Clean up room after class ends
};
```

### 2.3 - Implementar Rotas de Live Class

**Novo arquivo:**
```
src/server/routes/livekit.routes.ts

POST /api/livekit/token        # Gerar token para entrar na classe
POST /api/livekit/room/create  # Criar nova sala
POST /api/livekit/room/end     # Encerrar classe
GET  /api/livekit/rooms        # Listar salas ativas
```

### 2.4 - Frontend LiveKit Component

**Novo arquivo:**
```
src/components/live/LiveKitRoom.tsx

- Usar livekit-client React hooks
- Implementar Participant Grid
- Audio/Video toggles
- Screen share
- Chat integration
- Recording controls
```

### 2.5 - Validação & Deploy

- [ ] Testar geração de tokens
- [ ] Entrar em sala de teste com 2+ usuários
- [ ] Verificar audio/vídeo funciona
- [ ] Testar screen sharing
- [ ] Validar recording está ativado

**Entrega Step 2:**
- ✅ LiveKit Cloud configurado
- ✅ Backend tokens gerados corretamente
- ✅ React components renderizando
- ✅ Audio/vídeo funcional em browsers
- ✅ Recording & playback funcionando

---

## STEP 3: OpenAI API Integration (AI Tutor)

### 3.1 - Setup OpenAI Account & API Key

**Ações:**
- [ ] Criar conta em https://platform.openai.com
- [ ] Gerar API Key
- [ ] Configurar rate limits e quotas
- [ ] Notar modelo: `gpt-4o` ou `gpt-4-turbo`

### 3.2 - Criar OpenAI Service Backend

**Novo arquivo:**
```
src/server/services/openai.service.ts

import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateAITutorResponse = async (
  userId: string,
  message: string,
  language: string,
  context: ConversationContext
): Promise<string> => {
  const systemPrompt = `
    You are a friendly language tutor for ${language}.
    User level: ${context.level}
    Current topic: ${context.topic}
    Respond in a way that helps learning.
  `;
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      ...context.history,
      { role: 'user', content: message }
    ],
    max_tokens: 500,
    temperature: 0.7,
  });
  
  return completion.choices[0].message.content;
};

export const generateExercises = async (
  language: string,
  level: string,
  topic: string
): Promise<Exercise[]> => {
  // Generate personalized exercises
};

export const evaluatePronunciation = async (
  text: string,
  language: string
): Promise<PronunciationFeedback> => {
  // Evaluate user pronunciation (via audio transcript)
};
```

### 3.3 - Implementar Rotas de AI Tutor

**Novo arquivo:**
```
src/server/routes/ai-tutor.routes.ts

POST /api/ai/chat              # Send message to tutor
POST /api/ai/exercises/generate # Generate exercises
POST /api/ai/pronunciation     # Evaluate pronunciation
GET  /api/ai/conversation/:id  # Fetch conversation history
```

### 3.4 - Streaming Responses

**Implementação:**
```typescript
// Usar streaming para melhor UX
router.post('/api/ai/chat-stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  
  const stream = await openai.chat.completions.create({
    stream: true,
    ...options
  });
  
  for await (const chunk of stream) {
    res.write(`data: ${JSON.stringify(chunk)}\n\n`);
  }
  
  res.end();
});
```

### 3.5 - Validação & Deploy

- [ ] Testar geração de respostas
- [ ] Testar streaming de respostas
- [ ] Testar geração de exercícios
- [ ] Validar rate limiting (não ultrapassar quota)
- [ ] Testes de fallback quando API cai

**Entrega Step 3:**
- ✅ OpenAI API conectado
- ✅ Chat streaming funcionando
- ✅ Exercise generation operacional
- ✅ Rate limiting implementado
- ✅ Error handling para API downtime

---

## STEP 4: GCP Cloud Run Deployment

### 4.1 - Setup GCP Project

**Ações:**
- [ ] Criar projeto GCP
- [ ] Habilitar Cloud Run API
- [ ] Criar Cloud SQL instance (PostgreSQL)
- [ ] Configurar VPC connector
- [ ] Gerar service account key

### 4.2 - Criar Dockerfile

**Novo arquivo:**
```
Dockerfile

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY dist/ ./dist/
COPY server.cjs ./

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "server.cjs"]
```

### 4.3 - Setup Cloud SQL (PostgreSQL)

**Configuração:**
```bash
gcloud sql instances create lingolive-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1

gcloud sql databases create lingolive
```

**Novo arquivo (migrations):**
```
src/infrastructure/database/migrations/001_init.sql

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  stripe_customer_id VARCHAR(255),
  plan_id VARCHAR(100),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ... more tables
```

### 4.4 - Configurar Environment Variables

**`.env.gcp`:**
```
FIREBASE_PROJECT_ID=lingolive-prod
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
LIVEKIT_URL=wss://livekit.company.com
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
DATABASE_URL=postgresql://user:pass@cloud-sql-proxy/lingolive
REDIS_URL=redis://redis-instance:6379
```

### 4.5 - Deploy para Cloud Run

**Comando:**
```bash
gcloud builds submit --config cloudbuild.yaml

# Ou manual:
docker build -t gcr.io/lingolive-prod/server:v1.0.0 .
docker push gcr.io/lingolive-prod/server:v1.0.0

gcloud run deploy lingolive-server \
  --image gcr.io/lingolive-prod/server:v1.0.0 \
  --platform managed \
  --region us-central1 \
  --memory 2Gi \
  --cpu 2 \
  --set-env-vars FIREBASE_PROJECT_ID=lingolive-prod \
  --allow-unauthenticated
```

### 4.6 - Setup CI/CD Pipeline

**Novo arquivo:**
```
cloudbuild.yaml

steps:
  # Step 1: Build
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/server:$SHORT_SHA', '.']
  
  # Step 2: Push to Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/server:$SHORT_SHA']
  
  # Step 3: Deploy to Cloud Run
  - name: 'gcr.io/cloud-builders/gke-deploy'
    args: ['run', 'deploy', '--image=gcr.io/$PROJECT_ID/server:$SHORT_SHA']

images: ['gcr.io/$PROJECT_ID/server:$SHORT_SHA']
```

### 4.7 - Validação & Monitoring

- [ ] Health check endpoint: `GET /api/service-health` → 200 OK
- [ ] Verificar logs em Cloud Logging
- [ ] Configurar alertas no Cloud Monitoring
- [ ] Teste de carga: k6 ou Apache JMeter

**Entrega Step 4:**
- ✅ Cloud Run deployment funcional
- ✅ Cloud SQL conectado
- ✅ CI/CD pipeline executando
- ✅ Logs e monitoring funcionando
- ✅ Auto-scaling configurado

---

## STEP 5: QA & Beta Testing

### 5.1 - Criar Test Plan

**Arquivo:**
```
QA_TEST_PLAN.md

1. Funcionalidade
   - Authentication (Sign up, Login, Password reset)
   - Payments (Free trial, Subscription, Renewal)
   - Live Classes (Join, Audio/Video, Chat)
   - AI Tutor (Message, Feedback, Exercises)
   - E-books (Read, Download, Export, Notes)

2. Performance
   - Página carrega em < 2s
   - API responses < 500ms
   - Streaming responses são smooth
   - Mobile: funciona em 4G

3. Segurança
   - XSS prevention
   - CSRF tokens
   - SQL injection tests
   - Authentication bypass attempts
   - Rate limiting works

4. Compatibilidade
   - Chrome, Firefox, Safari, Edge
   - iOS Safari, Android Chrome
   - Tablet responsiveness
```

### 5.2 - Beta Tester Recruitment

**Ações:**
- [ ] Criar formulário de sign-up para beta testers
- [ ] Gerar convites com código promocional
- [ ] Configurar feedback form
- [ ] Setup Slack channel para bug reports

### 5.3 - Automated Testing

**Novo arquivo:**
```
vitest.config.integration.ts

// Integration tests para endpoints críticos
describe('Integration Tests', () => {
  test('Complete payment flow', async () => {
    // 1. Create user
    // 2. Create payment intent
    // 3. Confirm payment
    // 4. Verify subscription status
  });
  
  test('Live class flow', async () => {
    // 1. Create room
    // 2. Generate token
    // 3. Connect participants
    // 4. End session
  });
  
  test('AI tutor flow', async () => {
    // 1. Send message
    // 2. Receive response
    // 3. Verify saved in history
  });
});
```

**Executar:**
```bash
npm run test:integration
npm run test:e2e # Playwright
```

### 5.4 - Performance Testing

**K6 Load Test:**
```javascript
// tests/load.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 100,      // 100 concurrent users
  duration: '5m', // 5 minutes
};

export default function () {
  const res = http.get('https://api.lingolive.com/api/service-health');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

### 5.5 - Security Audit

**Checklist:**
- [ ] Run OWASP ZAP scan
- [ ] SQL injection tests
- [ ] XSS vulnerability scan
- [ ] CSRF token validation
- [ ] Authentication/Authorization review
- [ ] Dependency audit: `npm audit`

### 5.6 - Documentation & Release Notes

**Arquivos:**
```
DEPLOYMENT_GUIDE.md        # Como fazer deploy
API_DOCUMENTATION.md       # Endpoints e schemas
SECURITY_CHECKLIST.md      # Security requirements
RELEASE_NOTES_v1.0.0.md    # O que mudou
TROUBLESHOOTING.md         # Common issues & fixes
```

### 5.7 - Go Live Checklist

- [ ] Todos os testes passando
- [ ] Load testing validado (1000 req/s)
- [ ] Security audit aprovado
- [ ] Performance metrics < SLA
- [ ] Disaster recovery tested
- [ ] Monitoring & alerts configurados
- [ ] Team training completo
- [ ] Runbook para escalação criado

**Entrega Step 5:**
- ✅ 95%+ test coverage
- ✅ Performance < SLA
- ✅ Security audit passed
- ✅ Beta testers envolvidos
- ✅ Documentation completa
- ✅ Ready for production launch

---

## Timeline & Milestones

```
Semana 1-2:   STEP 1 + STEP 2 (Stripe Webhooks + LiveKit)
Semana 2-3:   STEP 3 + STEP 4 (OpenAI + Cloud Run)
Semana 3-4:   STEP 5 (QA & Beta)
Semana 4:     Production Launch v1.0.0-full
```

---

## Próximas Ações

1. **Hoje**: Revisar este roadmap
2. **Amanhã**: STEP 1.1 - Verificar Stripe routes existentes
3. **Dia 3**: Começar STEP 1.2 - Implementar webhook handlers
4. **Dia 5**: STEP 1 completo → iniciar STEP 2
5. **Dia 15**: Todos os steps completados → Go Live

---

## Links Úteis

- Stripe Webhooks: https://stripe.com/docs/webhooks
- LiveKit Docs: https://docs.livekit.io
- OpenAI API: https://platform.openai.com/docs
- GCP Cloud Run: https://cloud.google.com/run/docs
- Firebase Security: https://firebase.google.com/docs/firestore/security

---

**Responsável**: Claude Haiku 4.5  
**Data**: 2026-09-20  
**Status**: Phase 6 — Backend Integration  
**Branch**: `phase-6-backend-integration`
