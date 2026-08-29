import { auth } from "../firebase";

export interface LearningEventInput {
  type: "conversation" | "quiz" | "pronunciation" | "vocabulary" | "assessment" | "lesson";
  language: string;
  durationMinutes: number;
  score?: number;
  skills: Array<"speaking" | "listening" | "reading" | "writing" | "grammar" | "vocabulary">;
}

export type LearningSkill = LearningEventInput["skills"][number];

export interface LearningProgress {
  userId: string;
  totalActivities: number;
  totalMinutes: number;
  completedByType: Record<LearningEventInput["type"], number>;
  skills: Record<LearningSkill, { attempts: number; averageScore: number | null }>;
  lastActivityAt: string | null;
  lastLanguage: string | null;
}

const createEventId = (type: string) =>
  `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

class LearningProgressService {
  private async request(path: string, init?: RequestInit): Promise<Response> {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error("Sessão necessária para sincronizar o progresso.");
    return fetch(path, {
      ...init,
      headers: {
        ...init?.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getProgress(): Promise<LearningProgress> {
    const response = await this.request("/api/learning/progress");
    if (!response.ok) throw new Error("Falha ao carregar progresso de aprendizagem.");
    const payload = await response.json();
    return payload.progress as LearningProgress;
  }

  async recordEvent(input: LearningEventInput): Promise<void> {
    if (!auth.currentUser) return;
    const response = await this.request("/api/learning/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...input,
        id: createEventId(input.type),
        occurredAt: new Date().toISOString(),
      }),
    });
    if (!response.ok) throw new Error("Falha ao sincronizar progresso de aprendizagem.");
  }

  async completeFlashcardSession(input: { sessionId: string; language: string; durationMinutes: number; ratings: Array<{ cardId: string; word: string; rating: "known" | "learning" }> }) {
    const response = await this.request(`/api/learning/flashcard-sessions/${encodeURIComponent(input.sessionId)}/complete`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Falha ao concluir a revisão de flashcards.");
    window.dispatchEvent(new CustomEvent("lingolive_learning_progress_updated"));
    return payload as { xpAwarded: number; newTotalXp: number; duplicate: boolean; progress: LearningProgress };
  }
}

export const learningProgressService = new LearningProgressService();
