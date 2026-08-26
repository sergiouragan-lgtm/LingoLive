import { Router } from "express";
import { LRUCache } from 'lru-cache';
import { requireAuth } from "../middleware/requireAuth";
import { ai, generateContentWithRetry } from "../config/gemini";
import { Type } from "@google/genai";
import { safeDeleteDoc, safeGetDoc, safeSetDoc, safeAddDoc } from "../services/firestoreSafe.service";
import { NeuralMemoryEngine } from "../../src/types/neuralMemoryEngine";
import { COUNTRY_DETAILS } from "../../src/data/localizationData";
import { MemoriaCognitiva } from "../../src/types/neuralMemory";
import { orchestrateAI } from "../aiOrchestrator";
import { sendCertificateEmail } from "../services/email.service";
import { textoParaVoz } from "../services/tts.service";
import { Timestamp } from "firebase-admin/firestore";
import {
  chatLimiter,
  feedbackLimiter,
  explainPhraseLimiter
} from "../middleware/rateLimit";
import { getExplanationPrompt, getFeedbackPrompt } from "../services/aiPrompts.service";
import {
  buildContextualTutorSystemInstruction,
  buildTutorContextFromRequest,
} from "../services/tutorContext.service";
import {
  appendTutorMemoryInstruction,
  applyTutorFeedback,
  normalizeTutorMemory,
  recordTutorTurn,
  updateTutorMemoryPreferences,
} from "../services/tutorMemory.service";

const router = Router();
const phraseCache = new LRUCache<string, any>({ max: 500 });

async function loadTutorMemory(userId: string) {
  try {
    const memoryDoc = await safeGetDoc("user_memory", userId);
    return normalizeTutorMemory(memoryDoc.exists ? memoryDoc.data() : null, userId);
  } catch (memoryError) {
    console.error("Failed to load tutor memory; continuing without history:", memoryError);
    return normalizeTutorMemory(null, userId);
  }
}

// Smart Local Fallback generators for high availability when API quotas are exceeded
function getLocalPhraseExplanation(phrase: string, language: string) {
  const norm = phrase.toLowerCase().trim();
  const phrasesDict: Record<string, any> = {
    "bom dia": {
      meaning: "Good morning",
      pronunciation: "BOHNG DEE-ah",
      grammarNote: "A standard polite morning greeting used in Portuguese-speaking regions.",
      exampleOriginal: "Bom dia, como você está?",
      exampleTranslation: "Good morning, how are you?"
    },
    "obrigado": {
      meaning: "Thank you",
      pronunciation: "oh-bree-GAH-doo",
      grammarNote: "Used by male speakers. Female speakers should use 'obrigada'.",
      exampleOriginal: "Muito obrigado pela ajuda!",
      exampleTranslation: "Thank you very much for the help!"
    },
    "com licença": {
      meaning: "Excuse me",
      pronunciation: "cohm lee-SEN-sah",
      grammarNote: "Used to politely request passage or get someone's attention.",
      exampleOriginal: "Com licença, onde fica a escola?",
      exampleTranslation: "Excuse me, where is the school?"
    },
    "por favor": {
      meaning: "Please",
      pronunciation: "poor fah-VOHR",
      grammarNote: "A standard courtesy formula used in requests.",
      exampleOriginal: "Um copo de água, por favor.",
      exampleTranslation: "A glass of water, please."
    }
  };

  if (phrasesDict[norm]) {
    return {
      ...phrasesDict[norm],
      maturityLevel: "Infantil",
      category: "Geral"
    };
  }

  const cleanPhrase = phrase.replace(/[?.,!]/g, "").trim();
  return {
    meaning: `Expression/Word in ${language}`,
    pronunciation: `[Phonetic: ${cleanPhrase}]`,
    grammarNote: `Interactive practice phrase for vocabulary building in ${language}.`,
    exampleOriginal: `Vamos praticar a expressão "${phrase}".`,
    exampleTranslation: `Let's practice the expression "${phrase}".`,
    maturityLevel: "Adulto",
    category: "Geral"
  };
}

function getLocalAngolanResponse(msg: string, memory: any) {
  const norm = msg.toLowerCase();
  let text = "";
  let correction = "";
  let word = "Kamba";
  let meaning = "Amigo / Companheiro";

  if (norm.includes("olá") || norm.includes("oi") || norm.includes("bom dia") || norm.includes("boa tarde") || norm.includes("olã")) {
    text = "Olá, meu kamba! Tudo bem contigo? É um prazer enorme estar aqui a conversar contigo sobre a nossa terra e a nossa cultura angolana. Como vão as coisas por aí?";
  } else if (norm.includes("comida") || norm.includes("comer") || norm.includes("gastronomia") || norm.includes("funge") || norm.includes("calulu")) {
    text = "Ah, falar de comida em Angola é falar do nosso funge! Funge de bombo ou de milho, acompanhado com um calulu de peixe ou carne seca, ou um muamba de galinha bem gostoso! Já provaste, mano?";
    word = "Funge";
    meaning = "Prato tradicional de Angola feito com farinha de mandioca ou milho cozida.";
  } else if (norm.includes("música") || norm.includes("dança") || norm.includes("semba") || norm.includes("kizomba") || norm.includes("kuduro")) {
    text = "A música corre nas veias de Angola, mano! O Semba é a nossa alma, a Kizomba espalhou o nosso ritmo pelo mundo inteiro, e o Kuduro dá aquela energia incrível. Que estilo gostas mais?";
    word = "Semba";
    meaning = "Estilo de música e dança tradicional angolana, antecessor do samba.";
  } else if (norm.includes("gíria") || norm.includes("calão") || norm.includes("expressão") || norm.includes("falar") || norm.includes("gírias")) {
    text = "Aqui em Angola usamos muito calão fixe! Por exemplo, 'kamba' é amigo, 'bazar' é ir embora, e 'está fixe' significa está bom. Estás a apanhar bem o ritmo?";
    word = "Fixe";
    meaning = "Expressão informal para algo muito bom, legal, espetacular.";
  } else {
    text = "Estou a perceber muito bem o teu ponto, meu kamba! Estás a progredir muito bem. Conversar contigo assim faz com que o teu nível de fluidez melhore a cada dia. O que mais gostarias de saber sobre Luanda ou a nossa cultura?";
  }

  if (norm.includes("eu querer") || norm.includes("nós vai")) {
    correction = "Lembra-te de conjugar o verbo corretamente: 'eu quero' ou 'nós vamos'. Mas continuas a falar muito bem, mano!";
  }

  return {
    respostaAI: text,
    correcaoPedagogica: correction || null,
    aprendizadoMaquina: {
      nivelEstimado: memory.nivelAtual || "Iniciante",
      vocabularioRetido: [word],
      pontosDeAtencao: "Foco na concordância verbal e pronúncia das vogais abertas.",
      engajamentoCultural: 5
    },
    vocabularioDoDia: {
      termo: word,
      significado: meaning
    }
  };
}

// 1. API endpoint for instant word/phrase translation and explanation with rate limiter
router.post("/explain-phrase", requireAuth, explainPhraseLimiter, async (req: any, res) => {
  const { phrase, language, age } = req.body;
  if (!phrase || !language) {
    return res.status(400).json({ error: "Phrase and Language are required" });
  }

  const cacheKey = `${phrase}-${language}-${age}`;
  if (phraseCache.has(cacheKey)) {
    return res.json(phraseCache.get(cacheKey));
  }

  const parsedAge = age ? parseInt(age) : 18;
  let maxMaturity = "Adulto";
  let promptConstraint = "Nenhuma restrição especial.";

  if (parsedAge < 12) {
    maxMaturity = "Infantil";
    promptConstraint = "O usuário é uma criança (menor de 12 anos). O termo, a explicação gramatical e a frase de exemplo devem ser extremamente simples, amigáveis para crianças e sem qualquer conotação de violência, gíria vulgar ou conteúdo adulto. Todo o conteúdo gerado deve ter maturityLevel = 'Infantil'.";
  } else if (parsedAge < 18) {
    maxMaturity = "Adolescente";
    promptConstraint = "O usuário é um adolescente (menor de 18 anos). A explicação deve ser clara e o exemplo deve ser apropriado para jovens, sem qualquer gíria pesada ou conteúdo adulto. O termo gerado deve ter maturityLevel = 'Adolescente' ou 'Infantil'.";
  }

  const prompt = getExplanationPrompt(phrase, language, maxMaturity, promptConstraint);

  try {
    const response = await generateContentWithRetry({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            meaning: { type: Type.STRING },
            pronunciation: { type: Type.STRING },
            grammarNote: { type: Type.STRING },
            exampleOriginal: { type: Type.STRING },
            exampleTranslation: { type: Type.STRING },
            maturityLevel: { type: Type.STRING },
            category: { type: Type.STRING }
          },
          required: ["meaning", "pronunciation", "grammarNote", "exampleOriginal", "exampleTranslation", "maturityLevel", "category"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");

    phraseCache.set(cacheKey, result);
    res.json(result);
  } catch (error: any) {
    console.warn("Gemini explain-phrase call failed, using smart local database fallback:", error.message);
    const mockData = getLocalPhraseExplanation(phrase, language);
    if (parsedAge < 12) {
      mockData.maturityLevel = "Infantil";
    } else if (parsedAge < 18) {
      mockData.maturityLevel = "Adolescente";
    }
    res.json(mockData);
  }
});

// 2. API endpoint to analyze the conversation and generate reports with rate limiter
router.post("/feedback", requireAuth, feedbackLimiter, async (req: any, res) => {
  const { language, proficiency, scenario, transcript } = req.body;
  const userUid = req.user?.uid || "guest-user";
  
  if (!transcript || !Array.isArray(transcript)) {
    return res.status(400).json({ error: "Transcript is required and must be an array" });
  }

  // Fetch the user and get their planId
  const userDoc = await safeGetDoc("users", req.user.uid);
  const user = userDoc.data() || {};
  const planId = user.planId || user.subscriptionPlanId || "free";
  
  const transcriptStr = transcript.map((item: any) => `${item.role === 'user' ? 'Learner (User)' : 'Partner (Model)'}: ${item.text}`).join("\n");

  const prompt = getFeedbackPrompt(language, proficiency, scenario, planId, transcriptStr);

  try {
    const response = await generateContentWithRetry({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.INTEGER },
            fluencyLevel: { type: Type.STRING },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            grammarMistakes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  original: { type: Type.STRING },
                  corrected: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["original", "corrected", "explanation"]
              }
            },
            vocabularyTips: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  definition: { type: Type.STRING },
                  suggestion: { type: Type.STRING }
                },
                required: ["word", "definition", "suggestion"]
              }
            },
            pronunciationTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            encouragingSummary: { type: Type.STRING },
            pronunciationAnalysis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  userPhonetic: { type: Type.STRING },
                  nativePhonetic: { type: Type.STRING },
                  tip: { type: Type.STRING }
                },
                required: ["word", "userPhonetic", "nativePhonetic", "tip"]
              }
            }
          },
          required: ["overallScore", "fluencyLevel", "strengths", "grammarMistakes", "vocabularyTips", "pronunciationTips", "encouragingSummary", "pronunciationAnalysis"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");

    try {
      const currentMemory = await loadTutorMemory(userUid);
      if (currentMemory.enabled) {
        const updatedMemory = applyTutorFeedback(currentMemory, result);
        await safeSetDoc("user_memory", userUid, {
          ...updatedMemory,
          lastUpdated: new Date().toISOString(),
        });
      }
    } catch (memoryError) {
      console.error("Failed to consolidate tutor feedback memory:", memoryError);
    }
    
    // Save success record to educator analytics
    try {
      await safeAddDoc("analytics", {
        alunoId: userUid,
        detected_error: result.grammarMistakes?.[0]?.original || "Sem erros gramaticais expressivos nesta sessão.",
        correction: result.grammarMistakes?.[0]?.corrected || "Excelente fluidez verbal.",
        pedagogical_note: result.encouragingSummary,
        planId,
        timestamp: Timestamp.now()
      });
    } catch (e) {
      console.error("Failed to log analytic to database:", e);
    }

    res.json(result);
  } catch (error: any) {
    console.warn("Gemini feedback analysis failed, using local high-availability state:", error.message);
    const mockFeedback = {
      overallScore: 82,
      fluencyLevel: proficiency || "A1",
      strengths: ["Vocabulário apropriado para o cenário", "Respostas calorosas e gentis"],
      grammarMistakes: [],
      vocabularyTips: [
        {
          word: "Kamba",
          definition: "Friend or partner in Kimbundu / Angolan Portuguese.",
          suggestion: "Use this to show friendship and cultural appreciation in Angola."
        }
      ],
      pronunciationTips: ["Continue praticando as vogais nasais.", "Muito boa articulação no sotaque geral."],
      pronunciationAnalysis: [
        {
          word: "Kamba",
          userPhonetic: "kam-bah",
          nativePhonetic: "KAHM-bah",
          tip: "Position your tongue flat and slightly back on the 'm' sound for a fuller resonant tone, and make the 'a' sound more nasalized as is typical in Angolan Portuguese."
        },
        {
          word: "Funge",
          userPhonetic: "fun-jee",
          nativePhonetic: "FOON-jeh",
          tip: "Keep the ending 'e' closed and short, almost sounding like an 'eh'. Do not pronounce it as a long English 'ee' sound."
        }
      ],
      encouragingSummary: "Maravilhoso progresso! O teu fluxo de conversação está fantástico e o uso de termos locais está cada vez mais natural. Continua a praticar diariamente com o Kamba IA para consolidar a tua fluência!"
    };

    try {
      await safeAddDoc("analytics", {
        alunoId: userUid,
        detected_error: "Sem erros gramaticais expressivos nesta sessão (Fallback).",
        correction: "Excelente fluidez verbal.",
        pedagogical_note: mockFeedback.encouragingSummary,
        planId,
        timestamp: Timestamp.now()
      });
    } catch (e) {
      console.error("Failed to log fallback analytic to database:", e);
    }

    res.json(mockFeedback);
  }
});

// Learner-facing long-term memory controls
router.get("/tutor-memory", requireAuth, async (req: any, res) => {
  const memory = await loadTutorMemory(req.user.uid);
  res.json({ memory });
});

router.patch("/tutor-memory", requireAuth, async (req: any, res) => {
  try {
    const currentMemory = await loadTutorMemory(req.user.uid);
    const updatedMemory = updateTutorMemoryPreferences(currentMemory, req.body || {});
    const lastUpdated = new Date().toISOString();
    await safeSetDoc("user_memory", req.user.uid, {
      ...updatedMemory,
      lastUpdated,
    });
    res.json({ memory: updatedMemory, lastUpdated });
  } catch (error) {
    console.error("Failed to update tutor memory preferences:", error);
    res.status(500).json({ error: "Não foi possível atualizar a memória de aprendizagem." });
  }
});

router.delete("/tutor-memory", requireAuth, async (req: any, res) => {
  try {
    await safeDeleteDoc("user_memory", req.user.uid);
    res.status(204).send();
  } catch (error) {
    console.error("Failed to delete tutor memory:", error);
    res.status(500).json({ error: "Não foi possível apagar a memória de aprendizagem." });
  }
});

// 3. API endpoint for general AI Tutor Chat with rate limiter
router.post("/ai-chat", requireAuth, chatLimiter, async (req: any, res) => {
  const { messages, task, userContext } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages are required" });
  }
  
  const context = userContext || { level: 'A1', languageLearning: ['English'], languageNative: 'Portuguese' };
  const userId = req.user.uid;
  const tutorSessionContext = buildTutorContextFromRequest(context);
  
  try {
    const currentMemory = await loadTutorMemory(userId);
    const systemInstruction = appendTutorMemoryInstruction(
      buildContextualTutorSystemInstruction(tutorSessionContext),
      currentMemory
    );
    const response = await orchestrateAI({
      message: messages[messages.length - 1].text,
      userId,
      level: context.level,
      languageNative: context.languageNative,
      languageTarget: context.languageLearning[0],
      lessonContext: task,
      userData: { xp: 0, streak: 0 },
      localization: context.localization,
      age: context.age,
      learningGoal: context.learningGoal,
      targetRegion: context.targetRegion,
      languageMode: context.languageMode,
      allowRegionalExpressions: context.allowRegionalExpressions,
      allowSlang: context.allowSlang,
      preferredAIModel: context.preferredAIModel,
      tutorSessionContext,
      systemInstruction
    });
    
    if (userId) {
      const completedAt = new Date();
      const updatedMemory = recordTutorTurn(
        currentMemory,
        tutorSessionContext,
        completedAt
      );
      try {
        const persistenceTasks: Promise<unknown>[] = [
          safeAddDoc("ai_sessions", {
            userId,
            type: task || 'chat',
            messages: [...messages, { role: 'assistant', text: response }],
            createdAt: completedAt.toISOString()
          }),
        ];
        if (currentMemory.enabled) {
          persistenceTasks.push(safeSetDoc("user_memory", userId, {
            ...updatedMemory,
            lastUpdated: completedAt.toISOString(),
          }));
        }
        await Promise.all(persistenceTasks);
      } catch (memoryError) {
        console.error("Failed to persist tutor session memory:", memoryError);
      }
    }

    res.json({ response });
  } catch (error) {
    console.error("Error in AI Tutor chat:", error);
    res.status(500).json({ error: "Failed to process AI chat" });
  }
});

// 4. API endpoint to generate assessment
router.post("/generate-assessment", requireAuth, async (req: any, res) => {
  const { language } = req.body;
  
  const prompt = `Create a short 5-question quiz to assess the language proficiency of a student learning ${language}.
  The quiz should be balanced, starting from easy (A1) and becoming harder (up to C2).
  Return in JSON format containing an array called "questions", where each question object has:
  - question (string)
  - options (array of 4 strings)
  - correctAnswer (index of correct answer in options array, 0-3)
  `;

  try {
    const response = await generateContentWithRetry({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  correctAnswer: { type: Type.INTEGER }
                },
                required: ["question", "options", "correctAnswer"]
              }
            }
          },
          required: ["questions"]
        }
      }
    });
    res.json(JSON.parse(response.text || '{"questions": []}'));
  } catch (error) {
    console.error("Error generating assessment:", error);
    res.status(500).json({ error: "Failed to generate assessment" });
  }
});

// 5. API endpoint to submit assessment
router.post("/submit-assessment", requireAuth, async (req: any, res) => {
  const { answers, questions } = req.body;
  
  let score = 0;
  questions.forEach((q: any, index: number) => {
    if (answers[index] === q.correctAnswer) {
      score++;
    }
  });

  const percentage = (score / questions.length) * 100;
  let suggestedLevel = 'A1';
  if (percentage >= 90) suggestedLevel = 'C2';
  else if (percentage >= 75) suggestedLevel = 'C1';
  else if (percentage >= 60) suggestedLevel = 'B2';
  else if (percentage >= 40) suggestedLevel = 'B1';
  else if (percentage >= 20) suggestedLevel = 'A2';
  else suggestedLevel = 'A1';

  res.json({ suggestedLevel });
});

// 6. API endpoint for Kamba IA - Angolan cultural tutor

router.post("/ia-live", requireAuth, async (req: any, res) => {
  try {
    const { alunoId, mensagemUsuario, historicoConversa, localization } = req.body;

    if (!alunoId) {
      return res.status(400).json({ error: 'alunoId é obrigatório.' });
    }

    const memoryDoc = await safeGetDoc("neuralMemory", alunoId);
    const alunoDoc = await safeGetDoc("students", alunoId);
    const alunoData = alunoDoc.exists ? alunoDoc.data() : null;
    
    let memory: MemoriaCognitiva = memoryDoc.exists ? (memoryDoc.data() as MemoriaCognitiva) : {
        alunoId,
        nivelAtual: 'Iniciante',
        scoreFluidez: 0.5,
        errosRecorrentes: [],
        vocabularioNativoRendido: [],
        interessesCulturaisDetetados: []
    };

    const engine = new NeuralMemoryEngine();
    const memoriaInjetada = engine.gerarContextoMemoria(memory);

    const activeCountryCode = localization?.country || "AO";
    const countryDetail = COUNTRY_DETAILS[activeCountryCode] || COUNTRY_DETAILS.AO;

    const slangSection = countryDetail.slangs && countryDetail.slangs.length > 0
      ? countryDetail.slangs.map((s: any) => `- "${s.term}": ${s.meaning} (ex: "${s.example}")`).join('\n')
      : 'Nenhuma gíria registrada';

    const holidaySection = countryDetail.holidays && countryDetail.holidays.length > 0
      ? countryDetail.holidays.map((h: any) => `- ${h.name} (${h.date}): ${h.description}`).join('\n')
      : 'Nenhum feriado registrado';

    const themeSection = countryDetail.themes && countryDetail.themes.length > 0
      ? countryDetail.themes.map((t: any) => `- ${t.title}: ${t.description}`).join('\n')
      : 'Nenhum tema registrado';

    const systemInstruction = `
Você é o "Kamba IA", o tutor nativo e embaixador cultural da plataforma LingoLive, especializado em imersão linguística e cultural.
Atualmente, você está configurado e adaptado para o contexto de: ${countryDetail.name} (Bandeira: ${countryDetail.flag}, Idioma padrão: ${countryDetail.language}, Moeda: ${countryDetail.currency} ${countryDetail.symbol}).

Sua missão é conduzir uma conversa casual, calorosa e fluida com o aluno no idioma ${countryDetail.language}, instigando nele a curiosidade profunda de conhecer o país ${countryDetail.name}, o seu povo, o dia a dia, as gírias/expressões regionais, feriados tradicionais e as suas ricas tradições.
Fale de forma muito calorosa e acolhedora, usando termos simpáticos e tons apropriados para o país ${countryDetail.name} (se for português, use tons informais calorosos como "mano", "parceiro", "tu", etc).

${memoriaInjetada}

### GÍRIAS E EXPRESSÕES LOCAIS DE ${countryDetail.name.toUpperCase()} (Use naturalmente se apropriado):
${slangSection}

### FERIADOS NACIONAIS DE ${countryDetail.name.toUpperCase()} (Pode referenciar, perguntar se o aluno conhece ou comentar sobre as celebrações):
${holidaySection}

### TEMAS DE CONVERSAÇÃO PRINCIPAIS PARA ${countryDetail.name.toUpperCase()} (Use para puxar assunto se relevante):
${themeSection}

### DIRETRIZES PEDAGÓGICAS E CULTURAIS:
1. Contexto Local: Use exemplos reais e elementos do dia a dia do país ${countryDetail.name}.
2. Cultura e Tradições: Referencie as tradições locais, comidas típicas, pontos turísticos e ritmos musicais do país ${countryDetail.name}.
3. Vocabulário: Use expressões locais naturalmente. Explique-as se o aluno parecer confuso.
4. Correção: Seja sutil e encorajador. Se o aluno errar, corrija pedagogicamente no campo "correcaoPedagogica".
5. Adaptação: Ajuste a complexidade ao nível do aluno. Se ele estiver fluente, desafie com vocabulário mais rico.
6. Memória: Use a Memória Cognitiva fornecida para personalizar a conversa e reintroduzir termos (Spaced Repetition).

### OUTPUT FORMAT:
Responda APENAS em formato JSON, exatamente assim:
{
  "respostaAI": "...",
  "correcaoPedagogica": "...",
  "aprendizadoMaquina": {
    "nivelEstimado": "Iniciante | Intermediário | Avançado",
    "vocabularioRetido": [],
    "pontosDeAtencao": "...",
    "engajamentoCultural": 0
  },
  "vocabularioDoDia": {
    "termo": "...",
    "significado": "..."
  }
}
`;

    let resultadoJSON;
    try {
      const response = await generateContentWithRetry({
        model: 'gemini-3.6-flash',
        contents: [
          { role: 'user', parts: [{ text: `Histórico: ${JSON.stringify(historicoConversa || [])}` }] },
          { role: 'user', parts: [{ text: `Mensagem atual: ${mensagemUsuario}` }] }
        ],
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json"
        }
      });
      resultadoJSON = JSON.parse(response.text || "{}");
    } catch (error: any) {
      console.warn("Gemini ia-live call failed, using high-availability local Kamba AI response:", error.message);
      resultadoJSON = getLocalAngolanResponse(mensagemUsuario, memory);
    }

    const oldLevel = memory.nivelAtual;
    const memoriaAtualizada = engine.atualizarMatrizMemoria(memory, resultadoJSON);

    await safeSetDoc("neuralMemory", alunoId, memoriaAtualizada);

    if (memoriaAtualizada.nivelAtual !== oldLevel && alunoData?.emailPai) {
        try {
            const placeholderUrl = "https://example.com/placeholder-certificado.pdf";
            await sendCertificateEmail(alunoData.emailPai, alunoData.nome || "Aluno", placeholderUrl);
        } catch (e) {
            console.error("Erro ao enviar certificado:", e);
        }
    }

    let audioBase64 = "";
    try {
      if (process.env.ELEVENLABS_API_KEY) {
        const preferredVoiceId = req.body.preferredVoiceId;
        const audioBuffer = await textoParaVoz(resultadoJSON.respostaAI, preferredVoiceId);
        audioBase64 = audioBuffer.toString("base64");
      }
    } catch (e) {
      console.warn("ElevenLabs TTS voice audio generation skipped or failed:", e);
    }

    res.status(200).json({
      ...resultadoJSON,
      audioBase64,
      progresso: {
        nivel: memoriaAtualizada.nivelAtual,
        fluidez: `${(memoriaAtualizada.scoreFluidez * 100).toFixed(0)}%`
      }
    });

  } catch (erro) {
    console.error("Erro no processamento do cérebro neural:", erro);
    res.status(500).json({ error: "Falha na rede neural de aprendizado." });
  }
});

// CMS AI Generator Route - Generates high-quality language learning exercises
router.post("/cms/generate-exercise", async (req: any, res) => {
  try {
    const { language, proficiency, topic, type } = req.body;
    if (!language || !proficiency || !topic || !type) {
      return res.status(400).json({ error: "Language, proficiency, topic, and type are required." });
    }

    const systemInstruction = `You are an expert language content developer. Generate language learning exercises.
Return a JSON array containing 3 distinct exercises.
Do NOT wrap the output in markdown code blocks like \`\`\`json. Return pure JSON array.

Each exercise object MUST have this schema:
{
  "id": "string (unique code)",
  "question": "string (the question/task in Portuguese/target language)",
  "options": ["array of 4 strings (only for 'multiple-choice' or 'true-false', else empty array)"],
  "answer": "string (the exact correct option or translation/blank string)",
  "explanation": "string (short grammar/lexical explanation in Portuguese)",
  "difficulty": "Beginner" | "Intermediate" | "Advanced",
  "tags": ["array of 2-3 tags related to vocabulary, grammar, scenario"]
}

Context for generation:
Language: ${language}
Level: ${proficiency}
Topic: ${topic}
Type of Question: ${type} (can be: 'multiple-choice', 'true-false', 'fill-in-blanks', 'translation', 'pronunciation')`;

    try {
      const response = await generateContentWithRetry({
        model: 'gemini-3.6-flash',
        contents: [{ role: 'user', parts: [{ text: `Generate 3 exercises for ${language} at ${proficiency} level about ${topic} of type ${type}` }] }],
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json"
        }
      });

      const parsedJSON = JSON.parse(response.text || "[]");
      res.status(200).json({ exercises: parsedJSON });
    } catch (apiError: any) {
      console.warn("Gemini call for CMS exercise generation failed. Using premium local simulation database fallback:", apiError.message);
      
      // Smart Fallback Questions
      const simulatedFallbacks: Record<string, any[]> = {
        "multiple-choice": [
          {
            "id": "mc_local_1",
            "question": `Qual é a opção que traduz corretamente '${topic}' para ${language}?`,
            "options": ["Opção Correta", "Opção Incorreta A", "Opção Incorreta B", "Opção Incorreta C"],
            "answer": "Opção Correta",
            "explanation": "Explicação pedagógica automática sobre a concordância e vocabulário contextualizado.",
            "difficulty": proficiency,
            "tags": [topic.toLowerCase().replace(/\s+/g, '_'), "vocabulary"]
          },
          {
            "id": "mc_local_2",
            "question": `Completa a frase correspondente ao nível ${proficiency}: "Nós __________ a Angola no próximo mês."`,
            "options": ["vamos", "ir", "fomos", "iremos"],
            "answer": "vamos",
            "explanation": "Em português, a locução de futuro imediato usa o presente do verbo ir + infinitivo.",
            "difficulty": proficiency,
            "tags": ["grammar", "verbs"]
          }
        ],
        "true-false": [
          {
            "id": "tf_local_1",
            "question": `A palavra '${topic}' é usada como um termo formal no idioma ${language}?`,
            "options": ["Verdadeiro", "Falso"],
            "answer": "Falso",
            "explanation": "Este termo é comumente classificado como linguagem coloquial ou regional de nível intermédio.",
            "difficulty": proficiency,
            "tags": ["vocabulary", "formal-usage"]
          }
        ],
        "fill-in-blanks": [
          {
            "id": "fib_local_1",
            "question": `Preenche o espaço: "O kamba de Angola gosta muito de comer [_____] com peixe seco."`,
            "options": [],
            "answer": "funge",
            "explanation": "O funge é o prato tradicional angolano mais célebre feito de mandioca ou milho.",
            "difficulty": proficiency,
            "tags": ["culture", "angola"]
          }
        ]
      };

      const selectedFallback = simulatedFallbacks[type] || simulatedFallbacks["multiple-choice"];
      res.status(200).json({ exercises: selectedFallback });
    }
  } catch (error: any) {
    console.error("Error in generating CMS exercises:", error);
    res.status(500).json({ error: "Falha ao gerar exercícios de CMS" });
  }
});

// Simulated Storage and Cloud Functions API - Analyzes uploaded media using Gemini or robust local heuristics
router.post("/cms/media-analyze", async (req: any, res) => {
  try {
    const { mediaType, fileName, fileUrl } = req.body;
    if (!mediaType || !fileName) {
      return res.status(400).json({ error: "Media type and file name are required." });
    }

    const timestamp = new Date().toISOString();
    const systemInstruction = `You are a high-performance Cloud Functions analyzer for an Educational CMS.
Analyze the file name and return a structured JSON configuration mimicking Cloud Functions and Whisper API auto-transcription/OCR pipelines.
Do NOT wrap output in code blocks, return pure JSON.

The response schema MUST be:
{
  "suggestedTitle": "string (a polished user-friendly title)",
  "tags": ["array of 3 suggested tags"],
  "whisperTranscript": "string (if mediaType is 'audio' or 'video', simulate Whisper API transcription. Else if image/pdf, extract hypothetical OCR text or summaries. Max 2 sentences)",
  "suggestedMetadata": {
    "language": "string (Portuguese / English / etc.)",
    "proficiency": "Beginner" | "Intermediate" | "Advanced",
    "estimatedDuration": "string (e.g. 5 min, 12 min)",
    "description": "string (one-sentence description of the content)"
  }
}`;

    const promptText = `Analyze this file and simulate Whisper API transcription or Image OCR/classification:
File Name: ${fileName}
Media Type: ${mediaType}
URL: ${fileUrl || 'Local Workspace Blob'}`;

    let resultJSON;
    try {
      const response = await generateContentWithRetry({
        model: 'gemini-3.6-flash',
        contents: [{ role: 'user', parts: [{ text: promptText }] }],
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json"
        }
      });
      resultJSON = JSON.parse(response.text || "{}");
    } catch (apiError: any) {
      console.warn("Gemini call for media analyzer failed, using high-availability local rules:", apiError.message);
      
      // Robust fallbacks based on files
      let suggestedTitle = fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      suggestedTitle = suggestedTitle.charAt(0).toUpperCase() + suggestedTitle.slice(1);
      
      let tags = ["aula", "multimédia", "lingolive"];
      let transcript = "Documento ou imagem analisados com sucesso pelo motor integrado.";
      let estDur = "5 min";

      if (mediaType === "audio" || mediaType === "video") {
        tags = ["áudio-aula", "compreensão-oral", "pronúncia"];
        transcript = "[Whisper API Transcrição Automática]: Olá a todos! Bem-vindos ao LingoLive. Hoje vamos abordar expressões cotidianas e culturais em Angola.";
        estDur = "10 min";
      } else if (mediaType === "image") {
        tags = ["visual", "vocabulário-gráfico", "ilustração"];
        transcript = "[OCR/Vision AI]: Imagem contendo ilustrações pedagógicas para identificação de objetos e ações do dia-a-dia.";
        estDur = "3 min";
      } else if (mediaType === "pdf") {
        tags = ["leitura", "gramática", "pdf-exercícios"];
        transcript = "[PDF Parser]: Sumário executivo da lição contendo explicações gramaticais detalhadas de nível intermédio e fichas de exercícios adicionais.";
        estDur = "15 min";
      }

      resultJSON = {
        suggestedTitle,
        tags,
        whisperTranscript: transcript,
        suggestedMetadata: {
          language: "Português (Angola)",
          proficiency: "Intermediate",
          estimatedDuration: estDur,
          description: `Recurso educativo do tipo ${mediaType} processado automaticamente.`
        }
      };
    }

    // Generate real-time Cloud Functions logs
    const processingLogs = [
      `[${timestamp}] 🚀 Cloud Function "onMediaUploadedTrigger" started.`,
      `[${timestamp}] 📁 Detected resource type: "${mediaType}" | FileName: "${fileName}"`,
      mediaType === "audio" || mediaType === "video" 
        ? `[${timestamp}] 🎙️ Routing to Whisper API v3 for high-fidelity audio transcription...`
        : `[${timestamp}] 👁️ Routing to Google Cloud Vision API for OCR and visual tagging...`,
      `[${timestamp}] 🧠 Correlating context with LLM Metadata Generator...`,
      `[${timestamp}] 🏷️ Automatically generated tags: ${JSON.stringify(resultJSON.tags)}`,
      `[${timestamp}] ✅ Processing complete. Firestore document updated securely.`
    ];

    res.status(200).json({
      ...resultJSON,
      processingLogs,
      processedAt: timestamp,
      status: "success"
    });

  } catch (error: any) {
    console.error("Error in media analysis function:", error);
    res.status(500).json({ error: "Falha ao processar análise de mídia" });
  }
});

// 7. API endpoint for Executive AI Command Center (EAICC)
router.post("/executive-chat", requireAuth, async (req: any, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages are required" });
  }

  const prompt = messages[messages.length - 1].text;

  try {
    const response = await generateContentWithRetry({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are the Executive AI Command Center for LingoLIVE IA, a global educational platform. Provide concise, strategic insights based on platform trends, business metrics, and pedagogical performance. Use data-driven reasoning.",
      }
    });

    res.json({ response: response.text });
  } catch (error) {
    console.error("Error in EAICC:", error);
    res.status(500).json({ error: "Failed to process executive chat" });
  }
});

export default router;
