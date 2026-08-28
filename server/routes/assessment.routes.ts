import { Router } from "express";
import { ai, generateContentWithRetry } from "../config/gemini";
import { Type } from "@google/genai";
import { requireAuth } from "../middleware/requireAuth";
import { safeGetDoc, safeSetDoc, safeQueryDocs, localMemoryDb } from "../services/firestoreSafe.service";

const router = Router();

// 1. Get real exams created and persisted by authorized educators/CMS.
router.get("/exams", requireAuth, async (req, res) => {
  try {
    const exams = await safeQueryDocs("assessment_exams", "status", "published");
    return res.json(exams);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. Get Scheduled Exams for User
router.get("/scheduled", requireAuth, async (req: any, res) => {
  const userId = req.user.uid;
  try {
    const studentSnapshot = await safeGetDoc("students", userId);
    const student = studentSnapshot.exists ? studentSnapshot.data() : {};
    const direct = await safeQueryDocs("assessment_scheduled", "studentId", userId);
    const classId = student.classId || student.turma;
    const byClass = classId ? await safeQueryDocs("assessment_scheduled", "classId", classId) : [];
    const list = [...new Map([...direct, ...byClass].map((item) => [item.id, item])).values()]
      .filter((item: any) => item.status !== "cancelled");
    return res.json(list);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. Create or schedule a new exam (for Teachers)
router.post("/schedule", requireAuth, async (req: any, res) => {
  const { examId, title, classId, className, studentId, dueDate } = req.body;
  if (!examId || !title) {
    return res.status(400).json({ error: "Parâmetros 'examId' e 'title' são obrigatórios." });
  }

  try {
    const actorSnapshot = await safeGetDoc("users", req.user.uid);
    const actorRole = String(req.user.role || (actorSnapshot.exists ? actorSnapshot.data().role : "")).toUpperCase();
    if (!["TEACHER", "NATIVE_TEACHER", "ORG_ADMIN", "SUPER_ADMIN"].includes(actorRole)) {
      return res.status(403).json({ error: "Apenas docentes e administradores podem agendar avaliações." });
    }
    const examSnapshot = await safeGetDoc("assessment_exams", examId);
    if (!examSnapshot.exists || examSnapshot.data().status !== "published") {
      return res.status(404).json({ error: "Exame publicado não encontrado." });
    }
    const newSchedule = {
      id: `sched_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      examId,
      title,
      language: examSnapshot.data().language,
      teacherId: req.user.uid,
      studentId: studentId || null,
      scheduledDate: new Date().toISOString(),
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      classId: classId || null,
      className: className || null,
      status: "pending"
    };

    await safeSetDoc("assessment_scheduled", newSchedule.id, newSchedule);
    
    return res.json(newSchedule);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. Submit Completed Exam (Automatic Scoring + Gemini AI for free-text)
router.post("/submit", requireAuth, async (req: any, res) => {
  const userId = req.user.uid;
  const { examId, submissions, studentName } = req.body;

  if (!examId || !submissions) {
    return res.status(400).json({ error: "examId e submissions são obrigatórios." });
  }

  try {
    // 1. Fetch exam details
    const examSnapshot = await safeGetDoc("assessment_exams", examId);
    if (!examSnapshot.exists || examSnapshot.data().status !== "published") {
      return res.status(404).json({ error: "Exame publicado não encontrado." });
    }
    const exam = examSnapshot.data();

    const questionScores: any[] = [];
    let totalPointsEarned = 0;
    let totalPointsPossible = 0;

    // Separate auto-scorable from subjective AI-graded questions
    const subjectiveSubmissions: { question: any, value: string }[] = [];

    for (const q of exam.questions) {
      totalPointsPossible += q.points;
      const sub = submissions.find((s: any) => s.questionId === q.id);
      const answerVal = sub ? sub.value : "";

      if (["multiple-choice", "true-false", "fill-blank", "listening"].includes(q.type)) {
        // Auto-grade
        const isCorrect = answerVal.trim().toLowerCase() === (q.correctAnswer || "").trim().toLowerCase();
        const pts = isCorrect ? q.points : 0;
        totalPointsEarned += pts;

        questionScores.push({
          questionId: q.id,
          pointsEarned: pts,
          maxPoints: q.points,
          isCorrect,
          aiFeedback: isCorrect 
            ? "Resposta totalmente correcta de acordo com a chave do gabarito corporativo." 
            : `Incorreto. A resposta correta esperada era: "${q.correctAnswer}".`
        });
      } else {
        // Collect for AI batch evaluation
        subjectiveSubmissions.push({ question: q, value: answerVal });
      }
    }

    // Evaluate subjective answers using Gemini Model 3.5 Flash
    if (subjectiveSubmissions.length > 0) {
      try {
        const promptGrading = `
          Você é o Avaliador Executivo e Linguista Sênior da LingoLIVE IA.
          Por favor, avalie as seguintes respostas subjetivas dadas por um estudante num exame corporativo.
          Retorne obrigatoriamente um array no formato JSON correspondendo exatamente a cada questão enviada.

          Questões a avaliar:
          ${JSON.stringify(subjectiveSubmissions.map(s => ({
            id: s.question.id,
            type: s.question.type,
            instruction: s.question.instruction,
            rubrics: s.question.rubricCriteria,
            maxPoints: s.question.points,
            studentAnswer: s.value
          })))}

          Regras de Correção:
          - Atribua a pontuação total da questão (pointsEarned) proporcional ao desempenho frente às rubricas indicadas.
          - Forneça feedback construtivo detalhado focado em ambiente de negócios em Português.
          - Se for um áudio de fala ("speaking") e o valor do estudante for vazio ou uma indicação rápida de áudio, avalie com pontuação proporcional ao esforço ou indique de forma construtiva como estruturar melhor um pitch oral.
        `;

        const geminiResponse = await generateContentWithRetry({
          model: "gemini-3.6-flash",
          contents: promptGrading,
          config: {
            systemInstruction: "Avaliador Sênior da LingoLIVE. Retorne avaliações detalhadas em formato JSON estrito.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  pointsEarned: { type: Type.INTEGER },
                  aiFeedback: { type: Type.STRING },
                  rubricScores: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        dimension: { type: Type.STRING },
                        score: { type: Type.INTEGER },
                        feedback: { type: Type.STRING }
                      },
                      required: ["dimension", "score", "feedback"]
                    }
                  }
                },
                required: ["id", "pointsEarned", "aiFeedback", "rubricScores"]
              }
            }
          }
        });

        const parsedAIResults = JSON.parse(geminiResponse.text || "[]");

        for (const sub of subjectiveSubmissions) {
          const aiGrading = parsedAIResults.find((r: any) => r.id === sub.question.id);
          if (!aiGrading || !Number.isFinite(aiGrading.pointsEarned)) {
            throw new Error(`INVALID_GRADING_RESULT:${sub.question.id}`);
          }
          const pts = Math.max(0, Math.min(sub.question.points, aiGrading.pointsEarned));
          totalPointsEarned += pts;

          questionScores.push({
            questionId: sub.question.id,
            pointsEarned: pts,
            maxPoints: sub.question.points,
            isCorrect: pts >= (sub.question.points * 0.6),
            aiFeedback: aiGrading.aiFeedback,
            rubricScores: aiGrading.rubricScores
          });
        }

      } catch (geminiErr) {
        console.warn("[Assessment Router] Subjective AI grading unavailable:", geminiErr);
        return res.status(503).json({
          error: "ASSESSMENT_GRADING_UNAVAILABLE",
          message: "A correção real das respostas subjetivas está temporariamente indisponível. Nenhuma nota foi gravada.",
          retryable: true,
        });
      }
    }

    const scorePercent = Math.round((totalPointsEarned / totalPointsPossible) * 100);
    const passed = scorePercent >= exam.passingScorePercent;

    const attempt = {
      id: `attempt_${Date.now()}`,
      examId,
      userId,
      studentName: studentName || "Estudante LingoLIVE",
      timestamp: new Date().toISOString(),
      scorePercent,
      totalPointsEarned,
      totalPointsPossible,
      passed,
      questionScores,
      generalFeedback: passed 
        ? "Parabéns! Demonstrou proficiência exemplar, adequada aos padrões globais de liderança e comunicação empresarial. Continue a desenvolver a sua fluência."
        : "Obteve um bom esforço, mas não atingiu a pontuação mínima de corte. Recomendamos que reveja os módulos de vocabulário e tente novamente.",
      status: "graded" as const
    };

    // Save to databases
    await safeSetDoc("assessment_attempts", attempt.id, attempt);

    // Feed the adaptive profile only with persisted, actually graded attempts.
    const gradedAttempts = await safeQueryDocs("assessment_attempts", "userId", userId);
    const quizScoreAverage = Math.round(
      gradedAttempts.reduce((sum, item) => sum + Number(item.scorePercent || 0), 0) / gradedAttempts.length
    );
    const adaptiveSnapshot = await safeGetDoc("adaptive_profiles", userId);
    await safeSetDoc("adaptive_profiles", userId, {
      ...(adaptiveSnapshot.exists ? adaptiveSnapshot.data() : {}),
      userId,
      quizScoreAverage,
      assessmentAttempts: gradedAttempts.length,
      latestAssessmentId: attempt.id,
      latestAssessmentAt: attempt.timestamp,
      lastUpdated: attempt.timestamp,
    });
    
    // Append to list of history in local memory
    const historyKey = `assessment_attempts_list_${userId}`;
    const userHistory = localMemoryDb.get(historyKey) || [];
    localMemoryDb.set(historyKey, [attempt, ...userHistory]);

    // Complete only a schedule assigned to this student (directly or by class).
    const studentSnapshot = await safeGetDoc("students", userId);
    const studentClassId = studentSnapshot.exists
      ? studentSnapshot.data().classId || studentSnapshot.data().turma : null;
    const schedules = await safeQueryDocs("assessment_scheduled", "examId", examId);
    const matchedSched = schedules.find((schedule: any) =>
      schedule.status === "pending" &&
      (schedule.studentId === userId || (studentClassId && schedule.classId === studentClassId))
    );
    if (matchedSched) {
      await safeSetDoc("assessment_scheduled", matchedSched.id, {
        ...matchedSched,
        status: "completed",
        completedBy: userId,
        completedAt: attempt.timestamp,
      });
    }

    // 5. If passed, generate certificate!
    let certificate = null;
    if (passed) {
      certificate = {
        id: `cert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId,
        studentName: studentName || "Estudante LingoLIVE",
        examTitle: exam.title,
        language: exam.language,
        scorePercent,
        issueDate: new Date().toISOString(),
        verificationCode: `LL-VAL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        documentStatus: "pending",
        deliveryStatus: "not_sent",
        documentUrl: null,
      };
      await safeSetDoc("assessment_certificates", certificate.id, certificate);
      
      const certKey = `assessment_certificates_list_${userId}`;
      const userCerts = localMemoryDb.get(certKey) || [];
      localMemoryDb.set(certKey, [certificate, ...userCerts]);
    }

    return res.json({ attempt, certificate });

  } catch (err: any) {
    console.error("[Assessment Router] Failed during submission flow:", err);
    return res.status(500).json({ error: err.message });
  }
});

// 5. Get Certificates
router.get("/certificates", requireAuth, async (req: any, res) => {
  const userId = req.user.uid;
  try {
    const userCerts = await safeQueryDocs("assessment_certificates", "userId", userId);
    return res.json(userCerts);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
