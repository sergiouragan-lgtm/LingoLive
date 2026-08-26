import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { LearningProgress } from '../../../domain/learning/LearningProgress';

export class FirestoreLearningProgressRepository {
  constructor(private readonly collectionName = 'learning_progress') {}

  private id(userId: string, courseId: string): string {
    return `${userId}_${courseId}`;
  }

  async save(progress: LearningProgress): Promise<void> {
    await setDoc(doc(db, this.collectionName, this.id(progress.userId, progress.courseId)), progress, { merge: true });
  }

  async find(userId: string, courseId: string): Promise<LearningProgress | null> {
    const snapshot = await getDoc(doc(db, this.collectionName, this.id(userId, courseId)));
    return snapshot.exists() ? snapshot.data() as LearningProgress : null;
  }
}
