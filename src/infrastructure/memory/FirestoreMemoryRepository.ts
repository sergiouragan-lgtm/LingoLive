import { db } from "../../firebase";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { UserMemory } from "../../domain/memory/UserMemory";

export class FirestoreMemoryRepository {
  private readonly collectionName = "user_memory";

  async getMemory(userId: string): Promise<UserMemory | null> {
    const docRef = doc(db, this.collectionName, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserMemory;
    }
    return null;
  }

  async saveMemory(userId: string, memory: Partial<UserMemory>): Promise<void> {
    const docRef = doc(db, this.collectionName, userId);
    await setDoc(docRef, { ...memory, lastUpdated: serverTimestamp() }, { merge: true });
  }
}
