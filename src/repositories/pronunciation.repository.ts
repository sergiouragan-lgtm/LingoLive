import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  setDoc,
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { PronunciationResult, PronunciationReport, OfflineAudioQueueItem } from '../types/pronunciation';

export class PronunciationRepository {
  private resultsCollection = 'pronunciation_results';
  private reportsCollection = 'pronunciation_reports';

  private getLocalKey(col: string, userId: string): string {
    return `lingolive_${col}_${userId}`;
  }

  // --- PRONUNCIATION RESULTS ---
  async getResults(userId: string): Promise<PronunciationResult[]> {
    try {
      const q = query(collection(db, this.resultsCollection), where('userId', '==', userId));
      const snap = await getDocs(q);
      const results: PronunciationResult[] = [];
      snap.forEach(d => {
        results.push(d.data() as PronunciationResult);
      });
      // Sort by newest
      results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      localStorage.setItem(this.getLocalKey(this.resultsCollection, userId), JSON.stringify(results));
      return results;
    } catch (err) {
      console.warn('[PronunciationRepository] Firestore getResults error, loading from local cache:', err);
    }

    const cached = localStorage.getItem(this.getLocalKey(this.resultsCollection, userId));
    return cached ? JSON.parse(cached) : [];
  }

  async saveResult(result: PronunciationResult): Promise<void> {
    const userId = result.userId;
    // Save to cache
    const results = await this.getResults(userId);
    const updated = [result, ...results.filter(r => r.id !== result.id)];
    localStorage.setItem(this.getLocalKey(this.resultsCollection, userId), JSON.stringify(updated));

    try {
      const docRef = doc(db, this.resultsCollection, result.id);
      await setDoc(docRef, result, { merge: true });
    } catch (err) {
      console.warn('[PronunciationRepository] Firestore saveResult error, saved locally:', err);
    }
  }

  // --- REPORTS ---
  async getReport(userId: string): Promise<PronunciationReport | null> {
    try {
      const q = query(collection(db, this.reportsCollection), where('userId', '==', userId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const report = snap.docs[0].data() as PronunciationReport;
        localStorage.setItem(this.getLocalKey(this.reportsCollection, userId), JSON.stringify(report));
        return report;
      }
    } catch (err) {
      console.warn('[PronunciationRepository] Firestore getReport error:', err);
    }

    const cached = localStorage.getItem(this.getLocalKey(this.reportsCollection, userId));
    return cached ? JSON.parse(cached) : null;
  }

  async saveReport(report: PronunciationReport): Promise<void> {
    localStorage.setItem(this.getLocalKey(this.reportsCollection, report.userId), JSON.stringify(report));

    try {
      const docRef = doc(db, this.reportsCollection, report.id);
      await setDoc(docRef, report, { merge: true });
    } catch (err) {
      console.warn('[PronunciationRepository] Firestore saveReport error:', err);
    }
  }

  // --- OFFLINE QUEUE MANAGEMENT ---
  getOfflineQueue(userId: string): OfflineAudioQueueItem[] {
    const key = `lingolive_offline_queue_${userId}`;
    const cached = localStorage.getItem(key);
    return cached ? JSON.parse(cached) : [];
  }

  saveOfflineQueue(userId: string, queue: OfflineAudioQueueItem[]): void {
    const key = `lingolive_offline_queue_${userId}`;
    localStorage.setItem(key, JSON.stringify(queue));
  }

  async addToOfflineQueue(item: OfflineAudioQueueItem): Promise<void> {
    const queue = this.getOfflineQueue(item.userId);
    queue.push(item);
    this.saveOfflineQueue(item.userId, queue);
  }

  async removeFromOfflineQueue(userId: string, itemId: string): Promise<void> {
    const queue = this.getOfflineQueue(userId);
    const filtered = queue.filter(item => item.id !== itemId);
    this.saveOfflineQueue(userId, filtered);
  }
}
