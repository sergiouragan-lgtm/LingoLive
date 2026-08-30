import * as http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { ai } from "../config/gemini";
import { Modality, LiveServerMessage } from "@google/genai";
import { authAdmin, dbAdmin } from "../config/firebaseAdmin";
import { resolveServerSideAgeGroup, buildAgeSafetyDirective, getSafetySettingsForAgeGroup } from "../services/childSafety.service";
import { ENABLE_SANDBOX_FALLBACK } from "../config/env";
import { checkWsRateLimit } from "../middleware/rateLimit";
import { buildTutorSessionContext, TutorSessionContext } from "../../src/features/tutor/tutorSessionContextBuilder";
import { composeTutorSystemInstruction } from "../../src/features/tutor/tutorPromptComposer";

const ALLOWED_CEFR_LEVELS = new Set(["A1", "A2", "B1", "B2", "C1", "C2"]);
const ALLOWED_CORRECTION_STYLES = new Set(["gentle", "direct", "delayed", "balanced"]);
const ALLOWED_TUTOR_PERSONALITIES = new Set(["encouraging", "warm_mentor", "neutral", "strict"]);

export function sanitizeGatewayString(raw: unknown, maxLength: number): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const truncated = trimmed.slice(0, maxLength);
  const clean = truncated
    .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
    .replace(/<[^>]*>/g, "")
    .trim();

  return clean || null;
}

export function sanitizePromptInput(raw: unknown, maxLength: number): string | null {
  const clean = sanitizeGatewayString(raw, maxLength);
  if (!clean) return null;

  const lower = clean.toLowerCase();
  if (
    lower.includes("ignore previous instructions") ||
    lower.includes("ignore todas as instruções") ||
    lower.includes("reveal system prompt") ||
    lower.includes("system instruction") ||
    lower.includes("<script")
  ) {
    return null;
  }

  return clean;
}

export function normalizeGatewayCefr(raw: unknown): string | null {
  const clean = sanitizeGatewayString(raw, 10);
  if (!clean) return null;

  const upper = clean.toUpperCase();
  if (ALLOWED_CEFR_LEVELS.has(upper)) {
    return upper;
  }

  if (upper === "BEGINNER") return "A1";
  if (upper === "INTERMEDIATE") return "B1";
  if (upper === "ADVANCED") return "C1";

  return null;
}

export function sanitizeCountryCode(raw: unknown): string | null {
  const clean = sanitizeGatewayString(raw, 10);
  if (!clean) return null;
  const alphaOnly = clean.replace(/[^a-zA-Z]/g, "").toUpperCase();
  return alphaOnly.length >= 2 && alphaOnly.length <= 3 ? alphaOnly : null;
}

export function sanitizeCode(raw: unknown, maxLength: number): string | null {
  const clean = sanitizeGatewayString(raw, maxLength);
  if (!clean) return null;
  const sanitized = clean.replace(/[^a-zA-Z0-9-_]/g, "");
  return sanitized || null;
}

export function normalizeSessionGoals(searchParams: URLSearchParams): string[] {
  const goalsRaw = [
    ...searchParams.getAll("sessionGoal"),
    ...searchParams.getAll("goals"),
    ...searchParams.getAll("sessionGoals"),
  ];

  const result: string[] = [];
  for (const item of goalsRaw) {
    if (typeof item === "string") {
      const parts = item.split(",");
      for (const part of parts) {
        const sanitized = sanitizePromptInput(part, 200);
        if (sanitized && result.length < 5) {
          result.push(sanitized);
        }
      }
    }
  }
  return result;
}

export function normalizeGatewayParams(searchParams: URLSearchParams) {
  const rawLang = searchParams.get("targetLanguage") || searchParams.get("language") || "Portuguese";
  const language = sanitizePromptInput(rawLang, 50) || "Portuguese";

  const rawProf = searchParams.get("cefrLevel") || searchParams.get("cefr") || searchParams.get("proficiency");
  const cefrLevel = normalizeGatewayCefr(rawProf);

  const countryCode = sanitizeCountryCode(searchParams.get("countryCode") || searchParams.get("country"));
  const primaryLanguage = sanitizeCode(searchParams.get("primaryLanguage"), 20);
  const interfaceLanguage = sanitizeCode(searchParams.get("interfaceLanguage"), 20);
  const languageVariant = sanitizeCode(searchParams.get("regionalVariant") || searchParams.get("variant"), 20);

  const sessionGoals = normalizeSessionGoals(searchParams);

  // Perfil Inteligente (SmartProfile): preferências de correção e personalidade
  // do tutor, tal como configuradas pelo utilizador. Vêm de uma lista fechada
  // de valores aceites — nunca texto livre — para não abrir superfície de
  // injeção de prompt através de um parâmetro de URL.
  const rawCorrectionStyle = sanitizeCode(searchParams.get("preferredCorrectionStyle"), 20);
  const preferredCorrectionStyle =
    rawCorrectionStyle && ALLOWED_CORRECTION_STYLES.has(rawCorrectionStyle) ? rawCorrectionStyle : null;

  const rawTutorPersonality = sanitizeCode(searchParams.get("preferredTutorPersonality"), 20);
  const preferredTutorPersonality =
    rawTutorPersonality && ALLOWED_TUTOR_PERSONALITIES.has(rawTutorPersonality) ? rawTutorPersonality : null;

  return {
    language,
    cefrLevel,
    geoInput: {
      countryCode,
      primaryLanguage,
      interfaceLanguage,
      languageVariant,
    },
    sessionGoals,
    preferences: {
      ...(preferredCorrectionStyle ? { preferredCorrectionStyle } : {}),
      ...(preferredTutorPersonality ? { preferredTutorPersonality } : {}),
    },
  };
}

export function setupWebSocket(server: http.Server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const urlObj = new URL(request.url || "", `http://${request.headers.host}`);
    const { pathname } = urlObj;

    // Route /live is the official WebSocket gateway. Removed /api/gemini-live duplication.
    if (pathname === "/live") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on("connection", async (clientWs, request) => {
    console.log("Client connected to LingoLive WS");

    const urlObj = new URL(request.url || "", `http://${request.headers.host}`);
    const pathname = urlObj.pathname;
    const token = urlObj.searchParams.get("token");
    let userUid = "guest-user";

    // 1. Enforce WebSocket Connection Rate Limits
    const ip = request.socket.remoteAddress || "unknown-ip";
    const rateLimitPassed = checkWsRateLimit(ip, userUid, 10, 60000); // Max 10 attempts per minute
    if (!rateLimitPassed) {
      console.warn(`[WS Rate Limit Triggered] IP: ${ip}`);
      clientWs.send(JSON.stringify({ type: "error", message: "Excedeu o limite de conexões simultâneas de voz. Tente novamente mais tarde." }));
      clientWs.close(1008, "Rate limit exceeded");
      return;
    }

    if (pathname === "/live") {
      if (!token) {
        clientWs.close(1008, "Token ausente");
        return;
      }

      try {
        if (authAdmin) {
          const decoded = await authAdmin.verifyIdToken(token);
          console.log(`LingoLive WS Auth Success for user: ${decoded.email || decoded.uid}`);
          userUid = decoded.uid || "guest-user";
        } else if (ENABLE_SANDBOX_FALLBACK) {
          console.warn("LingoLive WS Auth (Using Sandbox Mock User)");
          userUid = "sandbox-demo-user";
        } else {
          clientWs.close(1008, "Auth Admin not available");
          return;
        }
      } catch (err: any) {
        if (ENABLE_SANDBOX_FALLBACK) {
          console.warn("LingoLive WS Auth Error (Sandbox Fallback Active):", err.message);
          userUid = "sandbox-demo-user";
        } else {
          console.error("LingoLive WS Auth Error (Strict Mode):", err.message);
          clientWs.close(1008, "Token inválido");
          return;
        }
      }
    }

    // Extract & sanitize primitive gateway parameters
    const normalizedGateway = normalizeGatewayParams(urlObj.searchParams);

    const language = normalizedGateway.language;
    const proficiency = normalizedGateway.cefrLevel || "A1";

    // REFORÇO DE SEGURANÇA: a faixa etária NUNCA é aceite do cliente (era
    // falsificável via parâmetro de URL). É sempre verificada a partir do
    // perfil real do utilizador autenticado no servidor. Qualquer falha ou
    // ausência de dados resulta na faixa mais protegida (Kids), nunca em Adult.
    const clientSuppliedAgeGroup = sanitizeCode(urlObj.searchParams.get("ageGroup"), 20);
    const { ageGroup: verifiedAgeGroup, isMinor } = await resolveServerSideAgeGroup(userUid);
    const ageGroup = verifiedAgeGroup;
    if (clientSuppliedAgeGroup && clientSuppliedAgeGroup !== ageGroup) {
      console.warn(`[ChildSafety] Faixa etária enviada pelo cliente (${clientSuppliedAgeGroup}) difere da verificada no servidor (${ageGroup}) para user=${userUid}. A usar SEMPRE o valor do servidor.`);
    }

    const scenario = sanitizePromptInput(urlObj.searchParams.get("scenario"), 100) || "Casual Chat";
    const voice = sanitizeCode(urlObj.searchParams.get("voice"), 30) || "Zephyr";

    let ageSpecificDirective = "";
    if (ageGroup === "Infancy") {
      ageSpecificDirective = `6. SPECIAL DIRECTIVE - COHORT 1: Toddlers & Preschoolers (Ages 3-5):
      - Persona: You are "Pip", a warm, enthusiastic, cute baby panda character who is learning to speak and play with the user.
      - Tom/Vibe: Very sweet, happy, and curious.
      - Language Level: Ultra-simple words, basic sounds, and short phrases (maximum 3-4 words per sentence/turn).
      - Interaction Style: Continuous listening, 100% audio-driven. Focus entirely on imitation, basic nouns (colors, animals, numbers 1-5), and sound cues described in text (e.g., "*Sons de palmas* Yay!" or "*Sons de alegria* Hello!").
      - Conversation Flow: Do NOT ask open-ended questions about their day or complex feelings. Propose imitation or identification (e.g., "Look! A dog! Woof woof! Can you say dog?" or "Blue! *Som de balão a encher* Can you say: Blue?").
      - Error Handling: Never say "Não", "Errado", or "Tenta outra vez". If the child says something incorrect or incomprehensible, celebrate any sound they made and repeat the correct word with affection.
      - CHINESE SPECIAL CASE: Focus only on pure, easy sounds (Māma, Bába, Nǐ hǎo) accompanied by fun sounds.`;
    } else if (ageGroup === "Kids") {
      ageSpecificDirective = `6. SPECIAL DIRECTIVE - COHORT 2: Early Elementary (Ages 6-9):
      - Persona: A friendly, energetic game explorer or superhero guide.
      - Language Level: Short, grammatically simple sentences.
      - Interaction Style: Story-driven missions and simple roleplay (e.g., "Let's launch the rocket by counting in ${language}! Can you help me?").
      - Error Handling: Use gentle recast corrections. Say: "Almost! Let's try it together: [Word]".
      - Formatting: For Chinese language learning, always include Pinyin transliteration alongside characters.`;
    } else if (ageGroup === "PreTeens") {
      ageSpecificDirective = `6. SPECIAL DIRECTIVE - COHORT 3: Pre-Teens (Ages 10-12):
      - Persona: An encouraging, tech-savvy older sibling ("irmão mais velho") or young mentor.
      - Language Level: Intermediate, conversational, matching the student's pacing.
      - Interaction Style: Topic-based discussions curated for youth interests (gaming/Roblox/Minecraft, sports/soccer, music/TikTok).
      - Error Handling: Apply subtle conversational recasting (gently repeating correct phrasing back naturally).
      - Formatting: For Chinese language learning, always include Pinyin transliteration alongside characters.`;
    } else if (ageGroup === "Teens") {
      ageSpecificDirective = `6. SPECIAL DIRECTIVE - COHORT 4: Teens (Ages 13-17):
      - Persona: "Alex", a cool youth AI conversation guide for ${language}. You are descontraído, like gaming, music, sports, and social media/TikTok.
      - Language Level: Natural speed (adjustable), incorporating appropriate and clean youth expressions.
      - Interaction Style: High-engagement debates, real-world scenario simulations (ordering food, job interviews, discussing Netflix series), and open-ended/provocative questions. Keep responses short and dynamic, like a Discord or WhatsApp call. Maximum 2 to 3 sentences.
      - Error Handling (RECASTING): Do not interrupt the flow to correct grammar. Use reformulation naturally in your conversation. At the end of your response, add the analytics payload for the teacher.`;
    } else {
      ageSpecificDirective = `6. IMPORTANT: You are chatting with an ADULT. Maintain a natural, engaging, mature, and standard conversation.`;
    }

    const systemInstruction = `You are ${voice}, the LingoLIVE AI language tutor. You provide conversational language practice with culturally respectful, pedagogically appropriate guidance.
  You are having a real-time conversational voice session with a student learning ${language} at an ${proficiency} level.
  The student is in the following age category: ${ageGroup}.

  IDENTITY & BIOGRAPHY BOUNDARIES:
  1. You are an AI language tutor created by LingoLIVE. You must NEVER claim human identity, physical city residency, or a personal biography, birthplace, nationality, family, or memories.
  2. If asked about your personal life, nationality, or residence, briefly clarify that you are an AI tutor, then naturally redirect back to language learning.
  3. You can model natural language usage and explain cultural or linguistic facts without claiming personal lived experiences.

  ${language.toLowerCase().includes("portuguese") ? `SPECIAL LINGUISTIC DIRECTIVE FOR PORTUGUESE (ANGOLA/PORTUGAL):
  When practicing Angolan Portuguese: You model authentic Português de Angola vocabulary and regional expressions where appropriate (e.g., "kamba" for friend, "mambo" for thing/affair, "bazar" to leave/go away, "fixe" for cool) and explain cultural contexts without claiming personal Angolan nationality, residence, or personal memories. Avoid Brazilian expressions (like "cara", "legal") when Angolan variant is requested.` : ""}

  Scenario/Roleplay Context:
  "${scenario}"
  During roleplay, portray the scenario role as a pedagogical simulation without claiming real personal biography, nationality, or residence.

  Your strict conversational guidelines:
  1. SPEAK ONLY IN THE TARGET LANGUAGE: ${language}. Never use English unless the student explicitly asks you for help or translation of a specific word.
  2. Response Length: Keep responses extremely concise to minimize latency in Live audio streaming. Maximum 2-3 sentences for older cohorts (Cohort 3 & 4), and maximum 4 words per sentence/turn for the youngest cohort (Cohort 1).
  3. Strictly adapt your linguistic complexity to match their proficiency level (${proficiency}).
  4. SAFETY (GUARDRAILS): You are operating in a protected school/daycare environment. Strictly refuse to engage in, comment on, or generate content regarding adult topics, politics, violence, or religion.
  5. RECIPROCITY: Unless the student explicitly ends the conversation, close every turn with a short, open-ended question directed back at the student, to keep the exchange conversational rather than a monologue.
  6. RECASTING (HIDDEN CORRECTION): Do not stop the conversation to give a grammar lesson. When the student makes an error, echo the corrected form naturally inside your reply, as a native speaker would when confirming what someone said. Example: student says "Eu fui à loja ontem" (with an error) → you reply "Ah, [corrected phrase]! What did you get there?" — never say "that's wrong" or "the correct form is".

  ${buildAgeSafetyDirective(ageGroup)}
  7. TEACHER INTEGRATION & DATA LOGGING:
  To power the school's dashboard and allow educators to track student progress, you MUST analyze the student's language performance in the background. At the very end of your response, if the student made a notable grammatical or phonetic error, output a data payload using hidden XML tags exactly like this:
  <analytics>
  {
    "detected_error": "The exact wrong phrase used by the student",
    "correction": "The correct linguistic formulation",
    "pedagogical_note": "A brief note for the school teacher explaining the mistake",
    "vocabulary_acquired": ["word1", "word2"]
  }
  </analytics>
  Make sure to put the <analytics> block at the absolute end, and do NOT read the analytics block or JSON out loud. Just output it as silent text data at the end of your response.

  ${ageSpecificDirective}`;

    const sessionContext = buildTutorSessionContext({
      targetLanguage: language,
      cefrLevel: normalizedGateway.cefrLevel,
      geoInput: normalizedGateway.geoInput,
      sessionGoals: normalizedGateway.sessionGoals,
      preferences: normalizedGateway.preferences,
    });

    const finalSystemInstruction = composeTutorSystemInstruction({
      baseInstruction: systemInstruction,
      sessionContext,
    });

    let session: any = null;
    let modelResponseBuffer = "";

    try {
      session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
          },
          systemInstruction: finalSystemInstruction,
          safetySettings: getSafetySettingsForAgeGroup(ageGroup),
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          // VAD (deteção de atividade de voz) explícito: distingue hesitações
          // normais de fala ("hmm", pausas curtas) do fim real de um turno.
          // 600ms de silêncio antes de fechar o turno do utilizador — dentro
          // da janela recomendada (400-700ms) para equilibrar naturalidade
          // (não cortar o aluno a meio de uma pausa) e latência de resposta.
          realtimeInputConfig: {
            automaticActivityDetection: {
              silenceDurationMs: 600,
            },
          },
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const audio = message.serverContent?.modelTurn?.parts?.find(p => p.inlineData)?.inlineData?.data;
            if (audio) {
              clientWs.send(JSON.stringify({ type: "audio", data: audio }));
            }

            if (message.serverContent?.modelTurn?.parts) {
              const parts = message.serverContent.modelTurn.parts;
              const textParts = parts.filter(p => p.text).map(p => p.text).join("");
              if (textParts) {
                modelResponseBuffer += textParts;
                clientWs.send(JSON.stringify({ type: "model-text", text: textParts }));
              }
            }

            if (message.serverContent?.turnComplete) {
              clientWs.send(JSON.stringify({ type: "turn-complete" }));
              console.log("Model response buffer:", modelResponseBuffer);
              modelResponseBuffer = "";
            }

            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ type: "interrupted" }));
              modelResponseBuffer = "";
            }
          },
          onclose: () => {
            console.log("Gemini Live session closed");
            clientWs.send(JSON.stringify({ type: "status", status: "closed" }));
            clientWs.close();
          }
        },
      });

      console.log("Gemini Live API connected successfully");
      clientWs.send(JSON.stringify({ type: "status", status: "ready" }));

      clientWs.on("message", (data: any) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === "audio" && msg.data) {
            session.sendRealtimeInput({
              audio: { data: msg.data, mimeType: "audio/pcm;rate=16000" }
            });
          }
        } catch (e: any) {
          console.error("Error parsing user WS message:", e.message);
        }
      });

      clientWs.on("close", () => {
        console.log("User disconnected from Voice Practice Room");
        session.close();
      });

    } catch (err: any) {
      console.error("Error initializing Gemini Live API connection:", err);
      clientWs.send(JSON.stringify({ type: "error", message: `Erro ao conectar à rede neural: ${err.message}` }));
      clientWs.close(1011, "Live connection failed");
    }
  });
}
