import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Lesson, LessonMetadata } from '../../../domain/learning/aggregates/Lesson';
import { ILessonRepository } from '../../../domain/learning/repositories/ILessonRepository';
import { LessonTitle } from '../../../domain/learning/value-objects/LessonTitle';

interface LessonDocument {
  id: string;
  title: string;
  content: string;
  metadata?: LessonMetadata;
  updatedAt: string;
}

export class FirestoreLessonRepository implements ILessonRepository {
  constructor(private readonly collectionName = 'learning_lessons') {}

  async save(lesson: Lesson): Promise<void> {
    const payload: LessonDocument = {
      id: lesson.id,
      title: lesson.getTitle().getValue(),
      content: lesson.getContent(),
      metadata: lesson.getMetadata(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, this.collectionName, lesson.id), payload, { merge: true });
  }

  async findById(id: string): Promise<Lesson | null> {
    const snapshot = await getDoc(doc(db, this.collectionName, id));
    if (!snapshot.exists()) return null;
    const data = snapshot.data() as LessonDocument;
    return new Lesson(data.id, new LessonTitle(data.title), data.content, data.metadata);
  }
}
