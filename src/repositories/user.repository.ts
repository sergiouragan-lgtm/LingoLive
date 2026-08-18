import { doc, getDoc, setDoc, updateDoc, query, collection, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from '../models/user';

export class UserRepository {
  private db = db;

  async getUser(uid: string): Promise<User | null> {
    const docRef = doc(this.db, 'users', uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as User) : null;
  }

  async createUser(user: User): Promise<void> {
    await setDoc(doc(this.db, 'users', user.id), user);
  }

  async deleteUser(userId: string): Promise<void> {
    await deleteDoc(doc(this.db, 'users', userId));
  }

  async deleteUserByEmail(email: string): Promise<void> {
    const q = query(collection(this.db, 'users'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (document) => {
      await deleteDoc(doc(this.db, 'users', document.id));
    });
  }
}
