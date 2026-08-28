import { Router } from "express";
import { ai, generateContentWithRetry } from "../config/gemini";
import { Type } from "@google/genai";
import { requireAuth } from "../middleware/requireAuth";
import { safeGetDoc, safeSetDoc } from "../services/firestoreSafe.service";

const router = Router();

// Helper: Calculate Difficulty and CEFR level
function runDifficultyEngine(profile: any) {
  const perf = typeof profile.performanceScore === 'number' ? profile.performanceScore : 0;
  const quiz = typeof profile.quizScoreAverage === 'number' ? profile.quizScoreAverage : 0;
  const speaking = typeof profile.speakingScore === 'number' ? profile.speakingScore : 0;
  const listening = typeof profile.listeningScore === 'number' ? profile.listeningScore : 0;
  const writing = typeof profile.writingQualityScore === 'number' ? profile.writingQualityScore : 0;
  const streak = typeof profile.learningStreak === 'number' ? profile.learningStreak : 0;
  
  // Normalized motivation factor
  const motivationFactor = profile.motivationLevel === 'high' ? 1.15 : profile.motivationLevel === 'medium' ? 1.0 : 0.85;
  
  // Weighted performance calculation
  // Speaking: 25%, Quiz: 20%, Listening: 20%, Writing: 15%, Performance: 10%, Streak: 10%
  const streakBonus = Math.min(10, streak) * 10; // Max 100 points
  const baseScore = (speaking * 0.25) + (quiz * 0.2) + (listening * 0.2) + (writing * 0.15) + (perf * 0.1) + (streakBonus * 0.1);
  const adjustedScore = Math.max(0, Math.min(100, baseScore * motivationFactor));
  
  // Translate to a difficulty index (0.1 - 1.0)
  const difficultyIndex = Math.max(0, Math.min(1.0, adjustedScore / 100));
  
  // Translate to estimated CEFR
  let estimatedCefr: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' = 'A1';
  if (difficultyIndex > 0.85) estimatedCefr = 'C2';
  else if (difficultyIndex > 0.70) estimatedCefr = 'C1';
  else if (difficultyIndex > 0.55) estimatedCefr = 'B2';
  else if (difficultyIndex > 0.40) estimatedCefr = 'B1';
  else if (difficultyIndex > 0.25) estimatedCefr = 'A2';
  
  return { difficultyIndex, estimatedCefr };
}

// 1. Get Adaptive Profile
router.get("/profile", requireAuth, async (req: any, res) => {
  const userId = req.user.uid;
  try {
    const docSnap = await safeGetDoc("adaptive_profiles", userId);
    if (docSnap.exists) {
      return res.json(docSnap.data());
    }
    
    // Honest empty profile. Evidence metrics start at zero and are populated
    // only by completed learning activities.
    const defaultProfile = {
      userId,
      performanceScore: 0,
      quizScoreAverage: 0,
      speakingScore: 0,
      listeningScore: 0,
      readingSpeedWpm: 0,
      writingQualityScore: 0,
      attendanceRate: 0,
      learningStreak: 0,
      motivationLevel: 'medium',
      estimatedCefr: 'A1',
      difficultyIndex: 0,
      learningStyle: 'Hybrid',
      availableStudyTimeMin: 0,
      evidence: { quiz: 0, speaking: 0, listening: 0, reading: 0, writing: 0, attendance: 0 },
      lastUpdated: new Date().toISOString()
    };
    await safeSetDoc("adaptive_profiles", userId, defaultProfile);
    return res.json(defaultProfile);
  } catch (err: any) {
    console.error("[Adaptive Service] Error getting profile:", err);
    return res.status(500).json({ error: err.message });
  }
});

// 2. Update and Recalculate Profile
router.post("/profile/update", requireAuth, async (req: any, res) => {
  const userId = req.user.uid;
  const updates = req.body || {};
  
  try {
    const docSnap = await safeGetDoc("adaptive_profiles", userId);
    let currentProfile = docSnap.exists ? docSnap.data() : { userId };
    
    // Only self-declared preferences may come from the browser. Performance
    // metrics are written by authenticated activity endpoints.
    const allowedPreferences = {
      ...(typeof updates.motivationLevel === 'string' ? { motivationLevel: updates.motivationLevel } : {}),
      ...(typeof updates.learningStyle === 'string' ? { learningStyle: updates.learningStyle } : {}),
      ...(typeof updates.availableStudyTimeMin === 'number' ? { availableStudyTimeMin: Math.max(0, Math.min(1440, updates.availableStudyTimeMin)) } : {}),
      ...(typeof updates.careerPath === 'string' ? { careerPath: updates.careerPath } : {}),
    };
    const merged = {
      ...currentProfile,
      ...allowedPreferences,
      userId,
      lastUpdated: new Date().toISOString()
    };
    
    // Run Difficulty Engine
    const { difficultyIndex, estimatedCefr } = runDifficultyEngine(merged);
    merged.difficultyIndex = difficultyIndex;
    merged.estimatedCefr = estimatedCefr;
    
    await safeSetDoc("adaptive_profiles", userId, merged);
    return res.json({ success: true, profile: merged });
  } catch (err: any) {
    console.error("[Adaptive Service] Error updating profile:", err);
    return res.status(500).json({ error: err.message });
  }
});

// 3. Generate Smart Recommendation Engine (Gemini Powered)
router.post("/recommendations/generate", requireAuth, async (req: any, res) => {
  const userId = req.user.uid;
  const { language } = req.body;
  
  try {
    const profileSnap = await safeGetDoc("adaptive_profiles", userId);
    const profile = profileSnap.exists ? profileSnap.data() : runDifficultyEngine({ userId });
    
    const userPrompt = `
      Gere 3 recomendações de aprendizagem de alta qualidade e personalizadas em Português para um estudante aprendendo o idioma "${language || 'Inglês'}".
      Métricas Atuais do Estudante:
      - Proficiência Geral (0-100): ${profile.performanceScore}
      - Média em Quizzes: ${profile.quizScoreAverage}%
      - Pontuação de Conversação (Speaking): ${profile.speakingScore}%
      - Pontuação de Compreensão Oral (Listening): ${profile.listeningScore}%
      - Velocidade de Leitura: ${profile.readingSpeedWpm} WPM
      - Qualidade de Escrita (Writing): ${profile.writingQualityScore}%
      - Frequência (Attendance): ${(profile.attendanceRate * 100).toFixed(0)}%
      - Dias Seguidos de Estudo (Streak): ${profile.learningStreak} dias
      - Motivação Atual: ${profile.motivationLevel}
      - Nível CEFR Estimado: ${profile.estimatedCefr}
      - Índice de Dificuldade de Aula: ${(profile.difficultyIndex * 100).toFixed(0)}%
      
      Importante: Recomende atividades focadas na habilidade com menor pontuação e explique o motivo científico/didático.
    `;
    
    const response = await generateContentWithRetry({
      model: "gemini-3.6-flash",
      contents: userPrompt,
      config: {
        systemInstruction: `Você é o Diretor de Aprendizagem Adaptativa Inteligente da LingoLIVE IA. Gere recomendações pedagógicas precisas, encorajadoras e totalmente estruturadas em JSON.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "ID único gerado" },
              title: { type: Type.STRING, description: "Título amigável e direto do conselho pedagógico" },
              description: { type: Type.STRING, description: "O que o estudante deve fazer em termos práticos" },
              actionView: { 
                type: Type.STRING, 
                description: "O identificador da tela para o botão de ação. Escolha APENAS entre: 'practice', 'quiz', 'live-sessions', 'vocab', 'profile'."
              },
              reason: { type: Type.STRING, description: "Explicação lógica de por que sugerimos isso baseado nas métricas" },
              priority: { type: Type.STRING, description: "Prioridade: 'high', 'medium' ou 'low'" },
              estimatedTimeMin: { type: Type.INTEGER, description: "Tempo estimado em minutos" }
            },
            required: ["id", "title", "description", "actionView", "reason", "priority", "estimatedTimeMin"]
          }
        }
      }
    });
    
    const recommendations = JSON.parse(response.text || "[]");
    const sanitizedRecs = Array.isArray(recommendations) 
      ? recommendations.map((rec: any, index: number) => ({
          ...rec,
          id: rec.id ? `${rec.id}_${index}_${Date.now()}` : `rec_${index}_${Date.now()}`
        }))
      : [];
    return res.json(sanitizedRecs);
  } catch (err: any) {
    console.error("[Adaptive Service] Error generating recommendations:", err);
    return res.status(503).json({
      error: "ADAPTIVE_RECOMMENDATIONS_UNAVAILABLE",
      message: "Não foi possível gerar recomendações reais neste momento.",
      retryable: true,
    });
  }
});

// 4. Generate Adaptive Learning Path (Gemini Powered)
router.post("/path/generate", requireAuth, async (req: any, res) => {
  const userId = req.user.uid;
  const { language } = req.body;
  
  try {
    const profileSnap = await safeGetDoc("adaptive_profiles", userId);
    const profile = profileSnap.exists ? profileSnap.data() : runDifficultyEngine({ userId });
    
    const userPrompt = `
      Gere uma Jornada de Aprendizagem Adaptativa sequencial contendo exatamente 4 missões/passos adaptados para o nível do estudante aprendendo o idioma "${language || 'Inglês'}".
      Perfil do Estudante:
      - Nível CEFR Estimado: ${profile.estimatedCefr}
      - Speaking: ${profile.speakingScore}%, Listening: ${profile.listeningScore}%, Quiz Average: ${profile.quizScoreAverage}%, Writing: ${profile.writingQualityScore}%
      - Streak: ${profile.learningStreak} dias, Motivação: ${profile.motivationLevel}
      
      Desenhe uma jornada lógica para melhorar os pontos fracos desse estudante. O primeiro passo deve estar desbloqueado ('unlocked'), os passos seguintes devem estar bloqueados ('locked').
    `;
    
    const response = await generateContentWithRetry({
      model: "gemini-3.6-flash",
      contents: userPrompt,
      config: {
        systemInstruction: `Você é o arquiteto de caminhos de aprendizagem da LingoLIVE IA. Gere uma jornada sequencial em JSON extremamente atraente e lúdica para o estudante.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            userId: { type: Type.STRING },
            language: { type: Type.STRING },
            generatedAt: { type: Type.STRING },
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING, description: "Título dinâmico e focado da lição" },
                  description: { type: Type.STRING, description: "Instrução pedagógica direta de aventura" },
                  type: { 
                    type: Type.STRING, 
                    description: "Tipo de exercício: 'speaking', 'listening', 'reading', 'writing', 'vocabulary', 'quiz'" 
                  },
                  difficulty: { type: Type.STRING, description: "Dificuldade sugerida: 'Beginner', 'Intermediate' ou 'Advanced'" },
                  xpReward: { type: Type.INTEGER, description: "XP de recompensa, ex: 100, 150, 200" },
                  status: { type: Type.STRING, description: "Deve ser 'unlocked' para o primeiro nó e 'locked' para os subsequentes" },
                  skillsTargeted: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    description: "Habilidades visadas, ex: ['Pronúncia', 'Fluência', 'Vocabulário', 'Gramática']" 
                  }
                },
                required: ["id", "title", "description", "type", "difficulty", "xpReward", "status", "skillsTargeted"]
              }
            }
          },
          required: ["id", "userId", "language", "generatedAt", "nodes"]
        }
      }
    });
    
    const learningPath = JSON.parse(response.text || "{}");
    learningPath.userId = userId;
    learningPath.id = `path_${userId}_${Date.now()}`;
    learningPath.generatedAt = new Date().toISOString();
    
    if (learningPath && Array.isArray(learningPath.nodes)) {
      learningPath.nodes = learningPath.nodes.map((node: any, index: number) => ({
        ...node,
        id: node.id ? `${node.id}_${index}_${Date.now()}` : `node_${index}_${Date.now()}`
      }));
    }
    
    await safeSetDoc("adaptive_paths", userId, learningPath);
    return res.json(learningPath);
  } catch (err: any) {
    console.error("[Adaptive Path] Error generating path:", err);
    return res.status(503).json({
      error: "ADAPTIVE_PATH_UNAVAILABLE",
      message: "Não foi possível gerar uma jornada adaptativa real neste momento.",
      retryable: true,
    });
  }
});

// 5. Get Personalized Study Schedule Recommender
router.get("/schedule", requireAuth, async (req: any, res) => {
  const userId = req.user.uid;
  try {
    const docSnap = await safeGetDoc("adaptive_profiles", userId);
    const profile = docSnap.exists ? docSnap.data() : { learningStreak: 2, motivationLevel: 'high' };
    
    let advice = "";
    let recommendedDurationMin = 15;
    let frequencyDaysPerWeek = 5;
    let timeSlotRecommendation = "19:00 - 19:30";
    
    if (profile.motivationLevel === 'low') {
      advice = "Níveis de motivação baixos detectados. Recomendamos micro-estudos diários de 5 minutos focados em jogos rápidos ou flashcards simples para reduzir a fricção mental.";
      recommendedDurationMin = 8;
      frequencyDaysPerWeek = 4;
      timeSlotRecommendation = "Manhã cedo (08:00 - 08:10)";
    } else if (profile.learningStreak > 5) {
      advice = "Sequência fantástica! Para continuar o seu ritmo, configure uma sessão de reforço avançada no final da tarde. Concentre-se nas áreas mais difíceis.";
      recommendedDurationMin = 25;
      frequencyDaysPerWeek = 7;
      timeSlotRecommendation = "Tarde (17:30 - 18:00)";
    } else {
      advice = "Excelente ritmo de estudo. Recomendamos intercalar sessões de Listening com Writing em dias alternados para um desenvolvimento balanceado.";
      recommendedDurationMin = 15;
      frequencyDaysPerWeek = 5;
      timeSlotRecommendation = "Noite (20:30 - 20:45)";
    }
    
    return res.json({
      userId,
      advice,
      recommendedDurationMin,
      frequencyDaysPerWeek,
      timeSlotRecommendation,
      nextRecommendedSession: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
