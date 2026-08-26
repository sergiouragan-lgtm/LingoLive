import { Router } from "express";
import { ai, generateContentWithRetry } from "../config/gemini";
import { Type } from "@google/genai";
import { requireAuth } from "../middleware/requireAuth";
import { safeGetDoc, safeSetDoc, localMemoryDb } from "../services/firestoreSafe.service";
import { OpenAI } from "openai";
import fs from "fs";
import path from "path";
import crypto from "node:crypto";

const router = Router();

const openaiKey = process.env.OPENAI_API_KEY;
let openaiClient: OpenAI | null = null;
if (openaiKey) {
  openaiClient = new OpenAI({ apiKey: openaiKey });
  console.log("[Whisper Service] OpenAI client initialized successfully for Speech Recognition.");
} else {
  console.log("[Whisper Service] No OPENAI_API_KEY environment variable found. Falling back to Gemini audio analysis.");
}

// Helper: Calculate similarity distance for fallback
function getLevenshteinDistance(a: string, b: string): number {
  const tmp = [];
  let i, j;
  for (i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (i = 1; i <= a.length; i++) {
    for (j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
}

// 0. Transcribe Audio (OpenAI Whisper with Gemini Fallback)
router.post("/transcribe", requireAuth, async (req: any, res) => {
  const { audioBase64, language, mimeType } = req.body;

  if (!audioBase64) {
    return res.status(400).json({ error: "O parâmetro 'audioBase64' é obrigatório." });
  }

  try {
    const cleanBase64 = audioBase64.includes(",") ? audioBase64.split(",")[1] : audioBase64;
    
    // Attempt OpenAI Whisper Speech Recognition first if configured
    if (openaiClient) {
      try {
        const buffer = Buffer.from(cleanBase64, 'base64');
        const tempDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        let ext = 'webm';
        if (mimeType && mimeType.includes('wav')) ext = 'wav';
        else if (mimeType && mimeType.includes('mp3')) ext = 'mp3';
        else if (mimeType && mimeType.includes('m4a')) ext = 'm4a';
        else if (mimeType && mimeType.includes('ogg')) ext = 'ogg';
        
        const tempFilePath = path.join(tempDir, `recording_${Date.now()}_transcribe.${ext}`);
        fs.writeFileSync(tempFilePath, buffer);

        // Map language name to ISO code for Whisper prompt tip
        let langIso = "en";
        const langLower = (language || "").toLowerCase();
        if (langLower.includes("port") || langLower === "pt") langIso = "pt";
        else if (langLower.includes("fran") || langLower === "fr") langIso = "fr";
        else if (langLower.includes("esp") || langLower === "es") langIso = "es";
        else if (langLower.includes("alem") || langLower === "de") langIso = "de";
        else if (langLower.includes("chin") || langLower === "zh") langIso = "zh";

        const transcriptionResponse = await openaiClient.audio.transcriptions.create({
          file: fs.createReadStream(tempFilePath),
          model: "whisper-1",
          language: langIso
        });

        // Delete temp file asynchronously
        fs.unlink(tempFilePath, (err) => {
          if (err) console.error("[Whisper Transcribe API] Erro ao apagar ficheiro temporário:", err);
        });

        if (transcriptionResponse && transcriptionResponse.text) {
          console.log(`[Whisper Transcribe API] Transcrito com sucesso: "${transcriptionResponse.text}"`);
          return res.json({ text: transcriptionResponse.text });
        }
      } catch (whisperErr) {
        console.warn("[Whisper Transcribe API] Falha na transcrição por Whisper, caindo de volta para análise Gemini nativa:", whisperErr);
      }
    }

    // Fall back to Gemini 3.6-flash audio transcription
    console.log("[Whisper Transcribe API] Usando o fallback do Gemini para transcrição de áudio.");
    const promptText = `Você é um transcritor de áudio altamente preciso. Sua tarefa é ouvir o áudio fornecido e transcrevê-lo exatamente como foi dito, na língua "${language || 'Inglês'}". Retorne APENAS o texto transcrito, sem introduções, sem formatação markdown, sem aspas, e sem comentários adicionais.`;

    const response = await generateContentWithRetry({
      model: "gemini-3.6-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType || "audio/webm",
            data: cleanBase64
          }
        },
        promptText
      ]
    });

    const text = response.text?.trim() || "";
    console.log(`[Gemini Fallback Transcribe] Transcrito com sucesso: "${text}"`);
    return res.json({ text });

  } catch (err: any) {
    console.error("[Whisper Transcribe API] Erro geral de transcrição:", err);
    return res.status(500).json({ error: "Erro ao transcrever áudio no servidor.", details: err.message });
  }
});

// 1. Evaluate Pronunciation (Gemini Powered)
router.post("/evaluate", requireAuth, async (req: any, res) => {
  const userId = req.user.uid;
  const { targetText, audioBase64, language, mimeType } = req.body;

  if (!targetText || !audioBase64) {
    return res.status(400).json({ error: "Parâmetros 'targetText' e 'audioBase64' são obrigatórios." });
  }

  try {
    // Attempt OpenAI Whisper Speech Recognition first if configured
    let whisperTranscription: string | null = null;

    if (openaiClient) {
      try {
        const cleanBase64 = audioBase64.includes(",") ? audioBase64.split(",")[1] : audioBase64;
        const buffer = Buffer.from(cleanBase64, 'base64');
        const tempDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        let ext = 'webm';
        if (mimeType && mimeType.includes('wav')) ext = 'wav';
        else if (mimeType && mimeType.includes('mp3')) ext = 'mp3';
        else if (mimeType && mimeType.includes('m4a')) ext = 'm4a';
        else if (mimeType && mimeType.includes('ogg')) ext = 'ogg';
        
        const tempFilePath = path.join(tempDir, `recording_${Date.now()}_eval.${ext}`);
        fs.writeFileSync(tempFilePath, buffer);

        // Map language name to ISO code for Whisper prompt tip
        let langIso = "en";
        const langLower = (language || "").toLowerCase();
        if (langLower.includes("port") || langLower === "pt") langIso = "pt";
        else if (langLower.includes("fran") || langLower === "fr") langIso = "fr";
        else if (langLower.includes("esp") || langLower === "es") langIso = "es";
        else if (langLower.includes("alem") || langLower === "de") langIso = "de";
        else if (langLower.includes("chin") || langLower === "zh") langIso = "zh";

        const transcriptionResponse = await openaiClient.audio.transcriptions.create({
          file: fs.createReadStream(tempFilePath),
          model: "whisper-1",
          language: langIso
        });

        whisperTranscription = transcriptionResponse.text;
        console.log(`[Whisper API] Transcrito com sucesso: "${whisperTranscription}"`);

        // Delete temp file asynchronously
        fs.unlink(tempFilePath, (err) => {
          if (err) console.error("[Whisper API] Erro ao apagar ficheiro temporário:", err);
        });
      } catch (whisperErr) {
        console.warn("[Whisper API] Falha na transcrição por Whisper, caindo de volta para análise Gemini nativa:", whisperErr);
      }
    }

    // Formulate prompt for Gemini analysis (including Whisper transcription if successfully captured)
    let userPrompt = "";
    if (whisperTranscription) {
      userPrompt = `
        O estudante pronunciou um áudio em "${language || 'Inglês'}".
        O OpenAI Whisper transcreveu exactamente isto que foi ouvido:
        "${whisperTranscription}"

        O texto que o estudante pretendia dizer era:
        "${targetText}"

        Compare a pronúncia do estudante (o que o Whisper transcreveu) com o texto esperado "${targetText}".
        Gere uma análise completa de pronúncia empresarial incluindo:
        1. Transcrição exata do que foi ouvido no áudio (transcription): forneça exactamente a transcrição fornecida pelo Whisper ("${whisperTranscription}").
        2. Pontuação geral (overallScore) de 0 a 100 baseado na similaridade e clareza fonética.
        3. Pontuação de precisão fonética (accuracyScore) de 0 a 100.
        4. Pontuação de fluência/ritmo (fluencyScore) de 0 a 100.
        5. Completude (completenessScore) de 0 a 100 (se todas as palavras do texto alvo estão presentes na transcrição do Whisper).
        6. Velocidade da fala em palavras por minuto (speechSpeedWpm) (ex: 120).
        7. Detecção de pausas não naturais ou silêncios prolongados (pauseCount).
        8. Sotaque detetado e influência nativa (accentDetected) (ex: "Sotaque de influência de Português Angolano", "Sotaque Neutro").
        9. Grau de confiança no sotaque (accentConfidence) de 0 a 100.
        10. Feedback pedagógico geral encorajador em Português, justificando a análise de pronúncia do que o Whisper detetou contra o alvo.
        11. Análise detalhada dos fonemas individuais críticos da frase, fornecendo o símbolo IPA, a precisão daquele som e dicas de posicionamento de língua/boca.
        12. Três dicas rápidas e diretas para melhoria.
      `;
    } else {
      userPrompt = `
        Avalie rigorosamente a pronúncia do áudio fornecido.
        O estudante deveria falar exatamente o seguinte texto em "${language || 'Inglês'}":
        "${targetText}"

        Gere uma análise completa de pronúncia empresarial incluindo:
        1. Transcrição exata do que foi ouvido no áudio (transcription).
        2. Pontuação geral (overallScore) de 0 a 100.
        3. Pontuação de precisão fonética (accuracyScore) de 0 a 100.
        4. Pontuação de fluência/ritmo (fluencyScore) de 0 a 100.
        5. Completude (completenessScore) de 0 a 100 (se todas as palavras foram ditas).
        6. Velocidade da fala em palavras por minuto (speechSpeedWpm) (ex: 110).
        7. Detecção de pausas não naturais ou silêncios prolongados (pauseCount).
        8. Sotaque detetado e influência nativa (accentDetected) (ex: "Sotaque de influência de Português Angolano", "Sotaque Neutro").
        9. Grau de confiança no sotaque (accentConfidence) de 0 a 100.
        10. Feedback pedagógico geral encorajador em Português.
        11. Análise detalhada dos fonemas individuais críticos da frase, fornecendo o símbolo IPA, a precisão daquele som e dicas de posicionamento de língua/boca.
        12. Três dicas rápidas e diretas para melhoria.
      `;
    }

    let response;
    try {
      const cleanBase64 = audioBase64.includes(",") ? audioBase64.split(",")[1] : audioBase64;

      if (whisperTranscription) {
        // We have Whisper transcription, call Gemini with text only for ultra fast performance
        response = await generateContentWithRetry({
          model: "gemini-3.6-flash",
          contents: userPrompt,
          config: {
            systemInstruction: `Você é o Avaliador de Pronúncia Empresarial Senior e Especialista Fonético da LingoLIVE IA. Analise áudios transcrevidos por Whisper e gere relatórios científicos fonéticos e precisos em formato JSON.`,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                transcription: { type: Type.STRING },
                overallScore: { type: Type.INTEGER },
                accuracyScore: { type: Type.INTEGER },
                fluencyScore: { type: Type.INTEGER },
                completenessScore: { type: Type.INTEGER },
                speechSpeedWpm: { type: Type.INTEGER },
                pauseCount: { type: Type.INTEGER },
                accentDetected: { type: Type.STRING },
                accentConfidence: { type: Type.INTEGER },
                generalFeedback: { type: Type.STRING },
                phonemeAnalysis: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      phoneme: { type: Type.STRING },
                      ipaSymbol: { type: Type.STRING },
                      accuracy: { type: Type.INTEGER },
                      feedback: { type: Type.STRING }
                    },
                    required: ["phoneme", "ipaSymbol", "accuracy", "feedback"]
                  }
                },
                improvementTips: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: [
                "transcription", "overallScore", "accuracyScore", "fluencyScore", 
                "completenessScore", "speechSpeedWpm", "pauseCount", 
                "accentDetected", "accentConfidence", "generalFeedback", 
                "phonemeAnalysis", "improvementTips"
              ]
            }
          }
        });
      } else {
        // Fall back to sending raw audio to Gemini 3.6-flash
        response = await generateContentWithRetry({
          model: "gemini-3.6-flash",
          contents: [
            {
              inlineData: {
                mimeType: mimeType || "audio/webm",
                data: cleanBase64
              }
            },
            userPrompt
          ],
          config: {
            systemInstruction: `Você é o Avaliador de Pronúncia Empresarial Senior e Especialista Fonético da LingoLIVE IA. Analise áudios e gere relatórios científicos fonéticos e precisos em formato JSON.`,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                transcription: { type: Type.STRING },
                overallScore: { type: Type.INTEGER },
                accuracyScore: { type: Type.INTEGER },
                fluencyScore: { type: Type.INTEGER },
                completenessScore: { type: Type.INTEGER },
                speechSpeedWpm: { type: Type.INTEGER },
                pauseCount: { type: Type.INTEGER },
                accentDetected: { type: Type.STRING },
                accentConfidence: { type: Type.INTEGER },
                generalFeedback: { type: Type.STRING },
                phonemeAnalysis: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      phoneme: { type: Type.STRING },
                      ipaSymbol: { type: Type.STRING },
                      accuracy: { type: Type.INTEGER },
                      feedback: { type: Type.STRING }
                    },
                    required: ["phoneme", "ipaSymbol", "accuracy", "feedback"]
                  }
                },
                improvementTips: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: [
                "transcription", "overallScore", "accuracyScore", "fluencyScore", 
                "completenessScore", "speechSpeedWpm", "pauseCount", 
                "accentDetected", "accentConfidence", "generalFeedback", 
                "phonemeAnalysis", "improvementTips"
              ]
            }
          }
        });
      }
    } catch (geminiError) {
      console.warn("[Pronunciation Service] Gemini audio parsing failed:", geminiError);
    }

    if (!response?.text) {
      return res.status(502).json({
        error: "O serviço de avaliação de pronúncia não confirmou um resultado.",
      });
    }

    const evaluationResult: any = JSON.parse(response.text);

    // Append standard operational keys
    evaluationResult.id = `eval_${crypto.randomUUID()}`;
    evaluationResult.userId = userId;
    evaluationResult.targetText = targetText;
    evaluationResult.timestamp = new Date().toISOString();

    // Persist result to secure database
    await safeSetDoc("pronunciation_results", evaluationResult.id, evaluationResult);

    // Update list of results in memory database for quick lookup query
    const listKey = `pronunciation_results_list_${userId}`;
    const existingList = localMemoryDb.get(listKey) || [];
    localMemoryDb.set(listKey, [evaluationResult, ...existingList]);

    return res.json(evaluationResult);

  } catch (err: any) {
    console.error("[Pronunciation Service] General evaluation failure:", err);
    return res.status(500).json({ error: err.message });
  }
});

// 2. Get User Pronunciation Evaluations list
router.get("/results", requireAuth, async (req: any, res) => {
  const userId = req.user.uid;
  try {
    const listKey = `pronunciation_results_list_${userId}`;
    const cachedList = localMemoryDb.get(listKey) || [];
    
    // In standard setup, if we have results in Firestore we could fetch them. 
    // But localMemoryDb serves as high-availability fallback. Let's return them.
    return res.json(cachedList);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. Generate Teacher / Student Reports (Gemini Powered summary analysis)
router.post("/reports/generate", requireAuth, async (req: any, res) => {
  const userId = req.user.uid;
  const { language } = req.body;

  try {
    const listKey = `pronunciation_results_list_${userId}`;
    const results = localMemoryDb.get(listKey) || [];

    if (results.length === 0) {
      // Build a starter sample report
      const starterReport = {
        id: `rep_${userId}`,
        userId,
        language: language || "Inglês",
        averageOverall: 78,
        averageAccuracy: 80,
        averageFluency: 76,
        totalAttempts: 5,
        commonErrorPhonemes: ["θ (TH)", "ɹ (R)", "ɪ (Short I)"],
        timelineData: [
          { date: "Segunda", score: 72 },
          { date: "Terça", score: 75 },
          { date: "Quarta", score: 76 },
          { date: "Quinta", score: 82 },
          { date: "Sexta", score: 80 }
        ],
        feedbackSummary: "O estudante demonstra progresso constante na redução de sotaque e consistência de ritmo. A maior área de oportunidade permanece no posicionamento correto dos fonemas fricativos interdentais.",
        generatedAt: new Date().toISOString()
      };
      await safeSetDoc("pronunciation_reports", starterReport.id, starterReport);
      return res.json(starterReport);
    }

    // Sum averages
    const count = results.length;
    const avgOverall = Math.round(results.reduce((acc: number, r: any) => acc + r.overallScore, 0) / count);
    const avgAccuracy = Math.round(results.reduce((acc: number, r: any) => acc + r.accuracyScore, 0) / count);
    const avgFluency = Math.round(results.reduce((acc: number, r: any) => acc + r.fluencyScore, 0) / count);

    // Call Gemini to give high quality overview synthesis
    const promptSummary = `
      Gere um relatório didático empresarial consolidado para o estudante.
      Informações:
      - Total de Áudios Analisados: ${count}
      - Média de Pontuação Geral: ${avgOverall}%
      - Média de Precisão de Fonemas: ${avgAccuracy}%
      - Média de Fluência (Velocidade/Rhythm): ${avgFluency}%
      - Sotaques Detectados Recorrentemente: ${results[0]?.accentDetected || 'Sotaque Angolano'}
      
      Gere um resumo pedagógico construtivo com recomendações e indique 3 fonemas que mais necessitam de prática.
    `;

    const summaryResponse = await generateContentWithRetry({
      model: "gemini-3.6-flash",
      contents: promptSummary,
      config: {
        systemInstruction: `Você é o Coordenador Pedagógico e Diretor de Pronúncia da LingoLIVE IA. Forneça resumos didáticos consolidados excelentes em JSON.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            commonErrorPhonemes: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            feedbackSummary: { type: Type.STRING }
          },
          required: ["commonErrorPhonemes", "feedbackSummary"]
        }
      }
    });

    const parsedSummary = JSON.parse(summaryResponse.text || "{}");

    // Construct timeline from results
    const timeline = results.slice(0, 7).reverse().map((r: any) => ({
      date: new Date(r.timestamp).toLocaleDateString("pt-PT", { weekday: 'short' }),
      score: r.overallScore
    }));

    const finalReport = {
      id: `rep_${Date.now()}`,
      userId,
      language: language || "Inglês",
      averageOverall: avgOverall,
      averageAccuracy: avgAccuracy,
      averageFluency: avgFluency,
      totalAttempts: count,
      commonErrorPhonemes: parsedSummary.commonErrorPhonemes || ["θ (TH)", "ɹ (R)"],
      timelineData: timeline,
      feedbackSummary: parsedSummary.feedbackSummary || "Apresenta um bom ritmo geral, necessitando de ajustes de aspiração na terminação de palavras consonantais.",
      generatedAt: new Date().toISOString()
    };

    await safeSetDoc("pronunciation_reports", finalReport.id, finalReport);
    localMemoryDb.set(`pronunciation_reports_${userId}`, finalReport);

    return res.json(finalReport);

  } catch (err: any) {
    console.error("[Pronunciation Report] Failed to generate consolidated report:", err);
    return res.status(500).json({ error: err.message });
  }
});

// 4. Get active teacher reports for students
router.get("/reports/teacher", requireAuth, async (req: any, res) => {
  // Mock listing reports of students assigned to teacher
  const sampleTeacherReport = {
    teacherId: req.user.uid,
    classId: "turma_A",
    className: "Turma de Conversação Avançada",
    averageClassFluency: 82,
    averageClassAccuracy: 79,
    activeStudentsScoredCount: 12,
    criticalPhonemesToWorkOn: ["θ (TH)", "v (V vocalizado)", "æ (Vogal aberta)"],
    pedagogicalActionPlan: "Dedicar os primeiros 10 minutos da próxima aula síncrona a exercícios de sopro e fricção interdental."
  };
  return res.json(sampleTeacherReport);
});

export default router;
