import { auth } from "../firebase";

export interface AdaptiveQuizQuestionDto {
  id: string; question: string; options: string[]; skill: string; difficulty: string;
}

const headers = async () => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Sessão necessária para gerar o quiz.");
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
};

export const adaptiveQuizService = {
  async generate(input: { language: string; ageGroup?: string | null; grade?: string }) {
    const response = await fetch("/api/quizzes/generate", { method: "POST", headers: await headers(), body: JSON.stringify(input) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Não foi possível gerar o quiz.");
    if (!payload.sessionId || !Array.isArray(payload.questions) || payload.questions.length !== 5) throw new Error("O servidor devolveu um quiz inválido.");
    return payload as { sessionId: string; questions: AdaptiveQuizQuestionDto[] };
  },
  async submit(sessionId: string, answers: number[], durationMinutes: number) {
    const response = await fetch(`/api/quizzes/${encodeURIComponent(sessionId)}/submit`, { method: "POST", headers: await headers(), body: JSON.stringify({ answers, durationMinutes }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Não foi possível corrigir o quiz.");
    return payload as { score: number; correctAnswers: number; totalQuestions: number; results: Array<{ questionId: string; correct: boolean; correctAnswerIndex: number; explanation: string }> };
  },
};
