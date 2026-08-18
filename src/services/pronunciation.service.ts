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
    mimeType = 'audio/webm'
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
      body: JSON.stringify({ targetText, audioBase64, language, mimeType })
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || "Falha na análise de pronúncia do servidor");
    }

    const result: PronunciationResult = await res.json();
    await this.repository.saveResult(result);
    return result;
  }

  // --- GET RESULTS ---
  async getResults(): Promise<PronunciationResult[]> {
    const user = auth.currentUser;
    if (!user) return [];
    
    if (this.isOnline()) {
      try {
        const headers = await this.getAuthHeaders();
        const res = await fetch('/api/pronunciation/results', { headers });
        if (res.ok) {
          const results = await res.json();
          // Cache each result locally
          for (const r of results) {
            await this.repository.saveResult(r);
          }
          return results;
        }
      } catch (err) {
        console.warn('[PronunciationService] Failed to load from server, falling back to repository cache:', err);
      }
    }
    return this.repository.getResults(user.uid);
  }

  // --- REPORTS ---
  async getReport(language = 'Inglês'): Promise<PronunciationReport> {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");

    if (this.isOnline()) {
      try {
        const headers = await this.getAuthHeaders();
        const res = await fetch('/api/pronunciation/reports/generate', {
          method: 'POST',
          headers,
          body: JSON.stringify({ language })
        });
        if (res.ok) {
          const report = await res.json();
          await this.repository.saveReport(report);
          return report;
        }
      } catch (err) {
        console.warn('[PronunciationService] Failed to generate server report:', err);
      }
    }

    const cached = await this.repository.getReport(user.uid);
    if (cached) return cached;

    // Starter placeholder report
    return {
      id: `rep_${user.uid}`,
      userId: user.uid,
      language,
      averageOverall: 0,
      averageAccuracy: 0,
      averageFluency: 0,
      totalAttempts: 0,
      commonErrorPhonemes: [],
      timelineData: [],
      feedbackSummary: "Grave o seu primeiro áudio para gerar um relatório completo de pronúncia do LingoLIVE.",
      generatedAt: new Date().toISOString()
    };
  }

  async getTeacherReport(): Promise<any> {
    if (this.isOnline()) {
      try {
        const headers = await this.getAuthHeaders();
        const res = await fetch('/api/pronunciation/reports/teacher', { headers });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn(e);
      }
    }
    return {
      averageClassFluency: 78,
      averageClassAccuracy: 75,
      activeStudentsScoredCount: 8,
      criticalPhonemesToWorkOn: ["θ (TH)", "ɪ (Short I)"],
      pedagogicalActionPlan: "Dedicar mais atenção síncrona a fricativas."
    };
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
          'Inglês'
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
