# Inventário Técnico: LingoLive Pre-ChatGPT Live-1

**Data**: Setembro 2026  
**Objetivo**: Mapear o que já existe para integração do ChatGPT Live-1

---

## 1. Arquitetura Conversacional Existente

### 1.1 PracticeRoom (`src/components/ai-tutor/conversacao/PracticeRoom.tsx`)
- ✅ **Componente central de prática conversacional**
- Suporta: idioma, proficiência (CEFR), grupo de idade, cenários
- Integração com WhisperService (transcrição Whisper)
- Sistema de contexto de sessão (TutorSessionContext)
- Analytics integrado com hooks (`useAnalytics`, `useMonitoring`)
- Salvamento de palavras aprendidas (SavedWord)
- Suporte a múltiplos idiomas e sotaques

### 1.2 AIAssistant (`src/components/ai-tutor/AIAssistant.tsx`)
- ✅ **Tutor conversacional com múltiplas tarefas**
- Tasks suportadas: 
  - `chat` (conversa livre)
  - `translate` (tradução)
  - `explain` (explicação)
  - `correct` (correção)
  - `example` (exemplos)
  - `roleplay` (dramatização)
  - `lesson` (aula)
- Endpoint: `/api/learning-interaction`
- Contexto do usuário: nível, idioma alvo, idioma nativo, localização, objetivo
- Profile dinâmico armazenado em localStorage

### 1.3 LiveChatAluno (`src/components/ai-tutor/LiveChatAluno.tsx`)
- ✅ **Interface de chat ao vivo com aluno**
- Integração Firebase Realtime DB
- Transcrição automática via Whisper
- Feedback visual de pronúncia

---

## 2. Serviços de Audio & Voice

### 2.1 WhisperService (`src/services/audio/whisper.ts`)
- ✅ **Transcrição de áudio (OpenAI Whisper)**
- Método: `transcribe(audioBlob, language): Promise<string>`
- Suporta: múltiplas linguagens via idioma (string)
- Base64 encoding + API call
- Endpoint: `/api/pronunciation/transcribe`

### 2.2 PronunciationService (`src/services/pronunciation.service.ts`)
- ✅ **Avaliação de pronúncia**
- Método principal: `evaluatePronunciation(targetText, audioBase64, language, mimeType, explicitVariant)`
- Resultado: `PronunciationResult` (score, feedback, fonemas)
- Suporte a sotaques regionais via `resolvePronunciationLocale()`
- Offline queue para sincronização later
- Endpoint: `/api/pronunciation/evaluate`
- Cache local via IndexedDB (PronunciationRepository)

### 2.3 PronunciationModule (`src/components/learning/PronunciationModule.tsx`)
- ✅ **UI para prática de pronúncia**
- 3 cenários preset: A2, B2, C1
- Gravação de áudio em tempo real
- Modo custom (texto livre)
- Relatório visual (gráficos de tendência)
- Relatório do professor

### 2.4 AudioVisualizer (`src/components/ai-tutor/AudioVisualizer.tsx`)
- ✅ **Visualização de waveform durante gravação**
- Simulação de altura de ondas
- Feedback visual em tempo real

---

## 3. Provider Abstractions & Patterns

### 3.1 Service Pattern
```typescript
// PronunciationService
class PronunciationService {
  async evaluatePronunciation(...): Promise<PronunciationResult>
  async getResults(): Promise<PronunciationResult[]>
  async getReport(language): Promise<PronunciationReport>
  async syncOfflineQueue(): Promise<number>
  isOnline(): boolean
}

// WhisperService
class WhisperService {
  static async transcribe(audioBlob, language): Promise<string>
}
```

### 3.2 Offline-First Pattern
- OfflineAudioQueueItem em IndexedDB
- PronunciationRepository para cache local
- `isOnline()` check antes de API calls
- Fallback a cache quando offline

### 3.3 Firebase Auth Integration
- Bearer token via `auth.currentUser?.getIdToken()`
- Todas as requests autenticadas
- userId tracking para analytics

---

## 4. Data Types & Models

### 4.1 Core Types (`src/types/pronunciation.ts`)
```typescript
interface PronunciationResult {
  id: string
  userId: string
  targetText: string
  transcribedText: string
  score: number (0-100)
  accuracy: number
  fluency: number
  feedback: string
  commonErrorPhonemes: string[]
  timestamp: string
}

interface PronunciationReport {
  id: string
  userId: string
  language: string
  averageOverall: number
  averageAccuracy: number
  averageFluency: number
  totalAttempts: number
  commonErrorPhonemes: string[]
  timelineData: Array
  feedbackSummary: string
  generatedAt: string
}

interface OfflineAudioQueueItem {
  id: string
  userId: string
  timestamp: string
  targetText: string
  audioBlobBase64: string
}
```

### 4.2 Language Types
```typescript
interface Language {
  name: string
  code: string
}

interface Voice {
  id: string
  name: string
  accent?: string
}

interface Scenario {
  id: string
  level: string
  title: string
  text: string
  translation: string
}
```

### 4.3 User Profile (`src/profile/types.ts`)
```typescript
interface SmartProfile {
  uid: string
  level: Proficiency (A1-C2)
  learningLanguage: string
  nativeLanguage: string
  targetRegion: string
  languageMode: string
  age: number
  learningGoal: string
  dialect?: string
}
```

---

## 5. Session Context & Analytics

### 5.1 TutorSessionContext (`src/features/tutor/tutorSessionContextBuilder.ts`)
- ✅ **Contexto de sessão dinamicamente construído**
- Parâmetros: smartProfile, targetLanguage, cefrLevel
- Usado em PracticeRoom para contexto conversacional

### 5.2 Analytics Hooks
- `useAnalytics(userId)` → `trackEvent(eventName, metadata)`
- Eventos: `practice_room_session_started`, `ai_assistant_opened`, etc.
- Integração com monitoring (`useMonitoring()`)

---

## 6. Regional Localization

### 6.1 Regional Locale Resolution
- `resolvePronunciationLocale(language, explicitVariant, deviceLocale)`
- Suporta múltiplas variantes regionais (PT-BR, PT-PT, ES-ES, etc.)
- Device locale fallback

---

## 7. Backend API Endpoints (Frontend perspective)

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/pronunciation/evaluate` | POST | Avaliar pronúncia |
| `/api/pronunciation/transcribe` | POST | Transcrever áudio (Whisper) |
| `/api/pronunciation/results` | GET | Listar resultados do usuário |
| `/api/pronunciation/reports/generate` | POST | Gerar relatório de pronúncia |
| `/api/pronunciation/reports/teacher` | GET | Relatório do professor |
| `/api/learning-interaction` | POST | Interação com tutor (chat) |

---

## 8. Data Persistence Layer

### 8.1 IndexedDB Repositories
- **PronunciationRepository** (cache de resultados, offline queue)
- Integração automática com Firebase sync

### 8.2 localStorage
- Perfil do usuário: `lingolive_user_sub_{uid}`
- SmartProfile: `lingolive_smart_profile_{uid}`

### 8.3 Firebase
- Firestore: mensagens de chat, progressão
- Realtime DB: chat ao vivo
- Auth: autenticação

---

## 9. Infrastructure Ready for GPT Live-1

### ✅ Já Existente (Pronto para Reutilizar)
- Audio recording & encoding (WebRTC, base64)
- Authentication (Bearer token)
- Online/offline detection
- Cache layer (IndexedDB)
- Analytics infrastructure
- Regional locale resolution
- User profile & session context
- Pronunciation feedback UI components

### 🔧 Que Será Necessário Adaptar
- Substituir WhisperService com GPTLiveAdapter (mantém mesma interface)
- Adaptar PronunciationService para usar VoiceTutorProvider (nova interface abstrata)
- Adicionar feature flag `VOICE_PROVIDER=gpt-live`
- Integrar full-duplex handling (não apenas request/response)
- Coletar novas métricas (latência, interrupção natural)

---

## 10. Spike Técnico: Pontos de Integração

### Phase 0 Checklist
- [ ] VoiceTutorProvider interface abstrata
- [ ] GPTLiveAdapter implementado isoladamente
- [ ] Testes de latência (P95 < 300ms)
- [ ] Testes de WER em 3+ dialetos regionais
- [ ] Custo/min estimation
- [ ] Full-duplex interrupt handling prototype
- [ ] Feature flag funcionando
- [ ] Fallback a custom quando necessário

---

## Conclusão

**Status**: LingoLive tem uma arquitetura **bem-estabelecida** para integração.

**Vantagens para GPT Live-1**:
1. Service layer abstrato (fácil trocar implementação)
2. Offline-first mindset já implementado
3. Regional locale resolution já suporta múltiplos dialetos
4. Analytics infra pronta para novas métricas
5. Firebase auth + session context já em lugar

**Risco Principal**: Latência - Full-duplex esperado < 300ms, mas Whisper custom é ~150ms. GPT Live tem que validar isso no spike.

**Próximo Passo**: Começar Spike Técnico com implementação do VoiceTutorProvider abstrato + GPTLiveAdapter.
