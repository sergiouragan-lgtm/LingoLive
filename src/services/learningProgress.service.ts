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
}

export const learningProgressService = new LearningProgressService();
