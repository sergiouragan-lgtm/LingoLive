import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { LearningProgress } from '../../../domain/learning/LearningProgress';
import { LearningProgressMerger } from '../../../application/learning/LearningProgressMerger';

export class FirestoreLearningProgressRepository {
  constructor(private readonly collectionName = 'learning_progress') {}

  private id(userId: string, courseId: string): string {
    return `${userId}_${courseId}`;
  }

  private cacheKey(userId: string, courseId: string): string {
    return `lingolive_learning_progress_${userId}_${courseId}`;
  }

  private cache(progress: LearningProgress): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.cacheKey(progress.userId, progress.courseId), JSON.stringify(progress));
    }
  }

  async save(progress: LearningProgress): Promise<void> {
    this.cache(progress);
    await setDoc(doc(db, this.collectionName, this.id(progress.userId, progress.courseId)), progress, { merge: true });
  }

  async find(userId: string, courseId: string): Promise<LearningProgress | null> {
    const cachedRaw = typeof localStorage !== 'undefined' ? localStorage.getItem(this.cacheKey(userId, courseId)) : null;
    const cached = cachedRaw ? JSON.parse(cachedRaw) as LearningProgress : null;
    try {
      const snapshot = await getDoc(doc(db, this.collectionName, this.id(userId, courseId)));
      if (!snapshot.exists()) return cached;
      const remote = snapshot.data() as LearningProgress;
      const resolved = cached ? LearningProgressMerger.merge(cached, remote) : remote;
      this.cache(resolved);
      return resolved;
    } catch (error) {
      if (cached) return cached;
      throw error;
    }
  }
}
