import { db } from '../../firebase';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ListeningTrack, ListeningProgress } from '../../types';

export class ListeningService {
  async getTracks(difficulty: string) {
    const q = query(collection(db, 'listening_tracks'), where('difficulty', '==', difficulty));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ListeningTrack));
  }
  
  async saveProgress(userId: string, progress: Omit<ListeningProgress, 'id'>) {
    const progressRef = collection(db, 'listening_progress');
    return await addDoc(progressRef, {
      ...progress,
      userId,
      createdAt: serverTimestamp(),
    });
  }
}

export const listeningService = new ListeningService();
