import { db } from '../../firebase';
import { collection, addDoc, getDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { WritingEssay } from '../../types';

export class WritingService {
  async saveEssay(essay: Omit<WritingEssay, 'id' | 'createdAt' | 'updatedAt'>) {
    const essaysRef = collection(db, 'writing_essays');
    return await addDoc(essaysRef, {
      ...essay,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

export const writingService = new WritingService();
