import { db } from '../../firebase';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Flashcard, FlashcardProgress } from '../../types';

export class FlashcardService {
  async getCards(collectionId: string) {
    const q = query(collection(db, 'flashcards'), where('collectionId', '==', collectionId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Flashcard));
  }
  
  async saveProgress(userId: string, cardId: string, easeFactor: number, interval: number, repetitionCount: number) {
    // Basic SRS Logic: Update next review date
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);
    
    const progressRef = collection(db, 'flashcard_progress');
    return await addDoc(progressRef, {
      userId,
      cardId,
      nextReview,
      interval,
      repetitionCount,
      easeFactor,
      createdAt: serverTimestamp(),
    });
  }
}

export const flashcardService = new FlashcardService();
