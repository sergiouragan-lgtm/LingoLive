import { GoogleGenAI } from "@google/genai";
import { AI_CONFIG } from "./orchestration/config/AIConfig";
import { AIOrchestrationLogger } from "./orchestration/utils/Logger";
import { safeGetDoc, safeSetDoc } from "../firestoreSafe.service";
import { dbAdmin } from "../../config/firebaseAdmin";
import { buildTutorSessionContext } from "../../../src/features/tutor/tutorSessionContextBuilder";
import { composeTutorSystemInstruction } from "../../../src/features/tutor/tutorPromptComposer";
import { resolveServerSideAgeGroup, buildAgeSafetyDirective, getSafetySettingsForAgeGroup } from "../childSafety.service";
import { AIProviderError, normalizeProviderError } from "./orchestration/errors/AIProviderError";

// Supported languages definition
export type SupportedLanguage = "pt" | "en" | "fr" | "zh";

export interface ConversationTurnRequest {
  userId: string;
  sessionId: string;
  userMessage: string;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  userCEFR: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  currentTopic?: string;
  voiceInput?: boolean;
}

export interface GrammarCorrection {
  hasMistake: boolean;
  mistake?: string;
  corrected?: string;
  explanation?: string;
}

export interface VocabularySuggestion {
  original: string;
  suggested: string;
  context: string;
}

export interface PronunciationHint {
  word: string;
  phonetic: string;
  tip: string;
}

export interface TurnScore {
  grammar: number; // 0-100
  fluency: number; // 0-100
  vocabulary: number; // 0-100
  topicRelevance: number; // 0-100
  overall: number; // 0-100
}

export interface VoiceGuidance {
  recommendedVoiceRate: number; // 0.8 to 1.2
  intonationFocus: string;
  estimatedSpeechDurationSeconds: number;
}

export interface MultilingualConversationResponse {
  reply: string;
  topic: string;
  topicSwitched: boolean;
  grammarCorrection: GrammarCorrection;
  vocabularySuggestions: VocabularySuggestion[];
  pronunciationHints: PronunciationHint[];
  turnScore: TurnScore;
  voiceGuidance: VoiceGuidance;
}

export interface ConversationSession {
  sessionId: string;
  userId: string;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  userCEFR: string;
  currentTopic: string;
  topicHistory: string[];
  cumulativeScore: number;
  totalTurns: number;
  updatedAt: string;
}

export class MultilingualConversationEngine {
  private aiClient: GoogleGenAI | null = null;

  constructor() {
    const apiKey = AI_CONFIG.providers.google.apiKey || process.env.GEMINI_API_KEY;
    if (apiKey) this.aiClient = new GoogleGenAI({ apiKey });
  }

  /**
   * Process a message turn through the Multilingual Conversation Engine
   */
  async processTurn(request: ConversationTurnRequest): Promise<MultilingualConversationResponse> {
    const start = Date.now();
    AIOrchestrationLogger.info(`MultilingualConversationEngine received turn for user=${request.userId} | languageTarget=${request.targetLanguage}`);

    // 1. Get or initialize Session details
    const session = await this.getOrCreateSession(request);

    // 2. Fetch recent historical turns
    const history = await this.getHistory(request.userId, request.sessionId);
    const historySummary = history.map(h => `${h.role === 'user' ? 'Aluno' : 'Tutor'}: ${h.content}`).join("\n");

    // 2.5 Carregar a identidade linguística/cultural do utilizador (mesma fonte
    // usada pelas sessões "Live") para adaptar o tutor de texto ao dialeto/região
    // preferidos do aluno — fecha a lacuna em que só o Live tinha esta adaptação.
    let culturalGeoInput: {
      countryCode: string | null;
      primaryLanguage: string | null;
      interfaceLanguage: string | null;
      languageVariant: string | null;
    } = {
      countryCode: null,
      primaryLanguage: request.sourceLanguage || null,
      interfaceLanguage: null,
      languageVariant: null,
    };
    try {
      const lieSnap = await dbAdmin
        .collection("users")
        .doc(request.userId)
        .collection("settings")
        .doc("linguistic_identity")
        .get();
      if (lieSnap.exists) {
        const lie = lieSnap.data() as any;
        culturalGeoInput = {
          countryCode: lie?.regionalVariant || null,
          primaryLanguage: lie?.nativeLanguage || request.sourceLanguage || null,
          interfaceLanguage: lie?.interfaceLanguage || null,
          languageVariant: lie?.preferredDialect || null,
        };
      }
    } catch (err: any) {
      AIOrchestrationLogger.warn(`Não foi possível carregar identidade linguística de ${request.userId}, a seguir sem adaptação cultural: ${err.message}`);
    }

    // REFORÇO DE SEGURANÇA (auditoria): o chat de texto não tinha, até agora,
    // NENHUMA adaptação ou proteção por faixa etária — só as sessões de voz
    // (Live) tinham. A faixa etária é sempre verificada a partir do perfil
    // real do utilizador no servidor, nunca aceite de um parâmetro do cliente.
    const { ageGroup } = await resolveServerSideAgeGroup(request.userId);

    const systemPrompt = `Você é um tutor nativo especialista de inteligência artificial de LingoLIVE.
Sua missão é responder ao aluno, corrigir erros gramaticais de forma amigável, sugerir vocabulários mais ricos, fornecer dicas de pronúncia legíveis foneticamente e avaliar o desempenho dele em tempo real.

O aluno está aprendendo o idioma alvo: "${request.targetLanguage}" (Código do idioma).
Nível CEFR do aluno: "${request.userCEFR}".
Idioma nativo do aluno: "${request.sourceLanguage}".
Se "voiceInput" for verdadeiro (${request.voiceInput ? "Sim" : "Não"}), simplifique a resposta para que soe natural se falada em áudio.

${buildAgeSafetyDirective(ageGroup)}

Estruture a resposta OBRIGATORIAMENTE no seguinte formato JSON (sem blocos externos adicionais):
{
  "reply": "Resposta detalhada e direta em ${request.targetLanguage}, adequada para o nível ${request.userCEFR}.",
  "topic": "O tópico detectado da conversa (ex: greetings, travel, gastronomy, family, business).",
  "topicSwitched": true ou false (coloque true se o aluno mudou de assunto em relação ao tópico anterior: "${session.currentTopic}"),
  "grammarCorrection": {
    "hasMistake": true ou false,
    "mistake": "A frase errada dita pelo aluno (se houver)",
    "corrected": "A frase corrigida pelo tutor (se houver)",
    "explanation": "Explicação amigável em ${request.sourceLanguage} sobre o erro de gramática."
  },
  "vocabularySuggestions": [
    {
      "original": "Palavra comum usada pelo aluno",
      "suggested": "Sinônimo mais nativo e avançado",
      "context": "Contexto curto do porquê de usar a nova sugestão."
    }
  ],
  "pronunciationHints": [
    {
      "word": "Palavra difícil no idioma alvo",
      "phonetic": "Pronúncia aproximada legível",
      "tip": "Como posicionar a língua ou entonação para acertar a pronúncia."
    }
  ],
  "turnScore": {
    "grammar": score de 0 a 100 baseado na exatidão,
    "fluency": score de 0 a 100 baseado na fluidez e ritmo presumido,
    "vocabulary": score de 0 a 100 baseado na complexidade dos termos,
    "topicRelevance": score de 0 a 100 baseado no contexto,
    "overall": média ponderada dos scores
  },
  "voiceGuidance": {
    "recommendedVoiceRate": velocidade sugerida para reproduzir o TTS (ex: 0.9 para iniciantes, 1.1 para avançados),
    "intonationFocus": "onde o aluno deve colocar ênfase na entonação",
    "estimatedSpeechDurationSeconds": duração aproximada de fala
  }
}`;

    const sessionContext = buildTutorSessionContext({
      targetLanguage: request.targetLanguage,
      cefrLevel: request.userCEFR,
      geoInput: culturalGeoInput,
      sessionGoals: request.currentTopic ? [request.currentTopic] : null,
    });

    const finalSystemPrompt = composeTutorSystemInstruction({
      baseInstruction: systemPrompt,
      sessionContext,
    }) || systemPrompt;

    const promptMessage = `Histórico de Conversas Prévias:\n${historySummary}\n\nMensagem recente do Aluno: "${request.userMessage}"`;

    if (!AI_CONFIG.providers.google.apiKey && !process.env.GEMINI_API_KEY) {
      throw new AIProviderError("AI_PROVIDER_NOT_CONFIGURED", "google", "GEMINI_API_KEY is not configured.", false);
    }

    try {
      const response = await this.aiClient!.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptMessage,
        config: {
          systemInstruction: finalSystemPrompt,
          safetySettings: getSafetySettingsForAgeGroup(ageGroup),
          temperature: 0.6,
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "";
      const cleaned = this.cleanMarkdownJSON(responseText);
      const parsed: MultilingualConversationResponse = JSON.parse(cleaned);

      // 3. Save current turn into Firestore history
      await this.saveTurn(request.userId, request.sessionId, request.userMessage, parsed.reply);

      // 4. Update session aggregates
      await this.updateSession(session, parsed);

      AIOrchestrationLogger.info(`MultilingualConversationEngine processed successfully in ${Date.now() - start}ms`);
      return parsed;

    } catch (error: any) {
      AIOrchestrationLogger.error(`Failed to process turn in Multilingual Engine: ${error.message}`, error, "MultilingualConversationEngine");
      throw normalizeProviderError("google", error);
    }
  }

  private cleanMarkdownJSON(text: string): string {
    let clean = text.trim();
    if (clean.startsWith("```")) {
      clean = clean.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "").trim();
    }
    return clean;
  }

  /**
   * Session Management: Get existing session or create fresh configuration
   */
  private async getOrCreateSession(request: ConversationTurnRequest): Promise<ConversationSession> {
    try {
      const docSnap = await safeGetDoc("ai_multilingual_sessions", request.sessionId);
      if (docSnap.exists) {
        return docSnap.data() as ConversationSession;
      }
    } catch (e: any) {
      AIOrchestrationLogger.warn(`Failed to read session details from Firestore. Initializing volatile transient session state.`);
    }

    const newSession: ConversationSession = {
      sessionId: request.sessionId,
      userId: request.userId,
      sourceLanguage: request.sourceLanguage,
      targetLanguage: request.targetLanguage,
      userCEFR: request.userCEFR,
      currentTopic: request.currentTopic || "greetings",
      topicHistory: [request.currentTopic || "greetings"],
      cumulativeScore: 0,
      totalTurns: 0,
      updatedAt: new Date().toISOString()
    };

    return newSession;
  }

  private async updateSession(session: ConversationSession, response: MultilingualConversationResponse): Promise<void> {
    session.totalTurns += 1;
    session.cumulativeScore += response.turnScore.overall;
    session.currentTopic = response.topic;

    if (response.topicSwitched && !session.topicHistory.includes(response.topic)) {
      session.topicHistory.push(response.topic);
    }

    session.updatedAt = new Date().toISOString();

    try {
      await safeSetDoc("ai_multilingual_sessions", session.sessionId, session);
    } catch (e: any) {
      AIOrchestrationLogger.warn(`Failed to update session metrics in Firestore for session ${session.sessionId}`);
    }
  }

  /**
   * History Repository: Fetch historical transcripts
   */
  async getHistory(userId: string, sessionId: string): Promise<{ role: "user" | "assistant"; content: string; timestamp: string }[]> {
    try {
      const docSnap = await safeGetDoc("ai_multilingual_history", `${userId}_${sessionId}`);
      if (docSnap.exists) {
        const data = docSnap.data();
        if (data && Array.isArray(data.turns)) {
          return data.turns.slice(-6); // Limit to last 6 turns for optimal context window caching
        }
      }
    } catch (e: any) {
      AIOrchestrationLogger.warn(`Failed to fetch history for ${userId}_${sessionId}`);
    }
    return [];
  }

  private async saveTurn(userId: string, sessionId: string, userMsg: string, aiMsg: string): Promise<void> {
    const key = `${userId}_${sessionId}`;
    const turns = await this.getHistory(userId, sessionId);
    
    turns.push({ role: "user", content: userMsg, timestamp: new Date().toISOString() });
    turns.push({ role: "assistant", content: aiMsg, timestamp: new Date().toISOString() });

    try {
      await safeSetDoc("ai_multilingual_history", key, {
        userId,
        sessionId,
        turns: turns.map(t => ({
          role: t.role,
          content: t.content,
          timestamp: t.timestamp
        })),
        lastUpdated: new Date().toISOString()
      });
    } catch (e: any) {
      AIOrchestrationLogger.warn(`Failed to persist conversation turn history for ${key}`);
    }
  }
}
