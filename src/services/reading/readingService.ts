import { db } from '../../firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { ReadingText, ReadingBookmark, ReadingNote } from '../../types';

export class ReadingService {
  async getTexts(difficulty: string) {
    const q = query(collection(db, 'reading_texts'), where('difficulty', '==', difficulty));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReadingText));
  }
  
  async saveBookmark(bookmark: Omit<ReadingBookmark, 'id' | 'createdAt'>) {
    const bookmarksRef = collection(db, 'reading_bookmarks');
    return await addDoc(bookmarksRef, {
      ...bookmark,
      createdAt: serverTimestamp(),
    });
  }
  
  async saveNote(note: Omit<ReadingNote, 'id' | 'createdAt'>) {
    const notesRef = collection(db, 'reading_notes');
    return await addDoc(notesRef, {
      ...note,
      createdAt: serverTimestamp(),
    });
  }
}

export const readingService = new ReadingService();
