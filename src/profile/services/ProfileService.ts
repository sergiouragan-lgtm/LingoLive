import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { SmartProfile } from '../types';

export class ProfileService {
  async getProfile(userId: string): Promise<SmartProfile | null> {
    try {
      const docRef = doc(db, 'profiles', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as SmartProfile;
      }
      return null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  async updateProfile(userId: string, update: Partial<SmartProfile>) {
    try {
      const docRef = doc(db, 'profiles', userId);
      await updateDoc(docRef, update as any);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  async initializeProfile(profile: SmartProfile) {
    try {
      const docRef = doc(db, 'profiles', profile.userId);
      await setDoc(docRef, profile);
    } catch (error) {
      console.error('Error initializing profile:', error);
      throw error;
    }
  }
}

export const profileService = new ProfileService();
