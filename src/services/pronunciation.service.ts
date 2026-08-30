import { auth } from '../firebase';
import { PronunciationRepository } from '../repositories/pronunciation.repository';
import { PronunciationResult, PronunciationReport, OfflineAudioQueueItem } from '../types/pronunciation';

export class PronunciationService {
  private repository = new PronunciationRepository();

  private async getAuthHeaders(): Promise<HeadersInit> {
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : '';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Helper check for network connection
  isOnline(): boolean {
    return typeof window !== 'undefined' && window.navigator ? window.navigator.onLine : true;
  }

  // --- EVALUATION ENGINE ---
  async evaluatePronunciation(
    targetText: string, 
    audioBase64: string, 
    language: string, 
    mimeType = 'audio/webm',
    attemptId = `attempt_${crypto.randomUUID()}`,
    durationMinutes = 0.1
  ): Promise<PronunciationResult> {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");

    // Check if offline
    if (!this.isOnline()) {
      const offlineItem: OfflineAudioQueueItem = {
        id: `offline_${Date.now()}`,
        userId: user.uid,
        timestamp: new Date().toISOString(),
        targetText,
        audioBlobBase64: audioBase64
      };

      await this.repository.addToOfflineQueue(offlineItem);
      throw new Error("OFFLINE_MODE_SAVED");
    }

    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/pronunciation/evaluate', {
      method: 'POST',
      headers,
      body: JSON.stringify({ targetText, audioBase64, language, mimeType, attemptId, durationMinutes })
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || "Falha na análise de pronúncia do servidor");
    }

    const result: PronunciationResult = await res.json();
    window.dispatchEvent(new CustomEvent('lingolive_learning_progress_updated'));
    return result;
  }

  // --- GET RESULTS ---
  async getResults(): Promise<PronunciationResult[]> {
    const user = auth.currentUser;
    if (!user) return [];
    
    if (!this.isOnline()) throw new Error("Ligue-se à internet para consultar resultados canónicos.");
    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/pronunciation/results', { headers });
    if (!res.ok) throw new Error("Não foi possível carregar os resultados do Firebase.");
    return res.json();
  }

  // --- REPORTS ---
  async getReport(language = 'Inglês'): Promise<PronunciationReport> {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");

    if (!this.isOnline()) throw new Error("Ligue-se à internet para gerar o relatório canónico.");
    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/pronunciation/reports/generate', { method: 'POST', headers, body: JSON.stringify({ language }) });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(payload.error || "Não foi possível gerar o relatório.");
    return payload;
  }

  async getTeacherReport(): Promise<any> {
    if (!this.isOnline()) throw new Error("Ligue-se à internet para consultar relatórios.");
    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/pronunciation/reports/teacher', { headers });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(payload.error || "Relatório de turma indisponível.");
    return payload;
  }

  // --- OFFLINE SYNC QUEUE ---
  getOfflineQueue(): OfflineAudioQueueItem[] {
    const user = auth.currentUser;
    if (!user) return [];
    return this.repository.getOfflineQueue(user.uid);
  }

  async syncOfflineQueue(onProgress?: (syncedItem: PronunciationResult) => void): Promise<number> {
    const user = auth.currentUser;
    if (!user) return 0;

    const queue = this.repository.getOfflineQueue(user.uid);
    if (queue.length === 0) return 0;

    let syncedCount = 0;
    for (const item of queue) {
      try {
        const res = await this.evaluatePronunciation(
          item.targetText,
          item.audioBlobBase64,
          'Inglês',
          'audio/webm',
          item.id
        );
        if (onProgress) {
          onProgress(res);
        }
        await this.repository.removeFromOfflineQueue(user.uid, item.id);
        syncedCount++;
      } catch (e) {
        console.error(`[PronunciationService] Failed syncing item ${item.id}:`, e);
      }
    }
    return syncedCount;
  }
}
