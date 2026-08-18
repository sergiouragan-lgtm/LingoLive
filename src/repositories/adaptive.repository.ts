import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  query, 
  where,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  AdaptiveLearningProfile, 
  AdaptiveGoal, 
  AdaptivePath, 
  AdaptiveRecommendation 
} from '../types/adaptive';

export class AdaptiveRepository {
  private profileCollection = 'adaptive_profiles';
  private goalsCollection = 'adaptive_goals';
  private pathsCollection = 'adaptive_paths';
  private recsCollection = 'adaptive_recomms';

  // HELPER: Generate fallback keys for localStorage
  private getLocalKey(collectionName: string, userId: string, subId?: string): string {
    return subId ? `lingolive_${collectionName}_${userId}_${subId}` : `lingolive_${collectionName}_${userId}`;
  }

  // --- PROFILE METHODS ---
  async getProfile(userId: string): Promise<AdaptiveLearningProfile | null> {
    try {
      const docRef = doc(db, this.profileCollection, userId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as AdaptiveLearningProfile;
        localStorage.setItem(this.getLocalKey(this.profileCollection, userId), JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn('[AdaptiveRepository] Firestore getProfile error, falling back to local storage:', err);
    }

    const local = localStorage.getItem(this.getLocalKey(this.profileCollection, userId));
    return local ? JSON.parse(local) : this.createDefaultProfile(userId);
  }

  async saveProfile(profile: AdaptiveLearningProfile): Promise<void> {
    const localKey = this.getLocalKey(this.profileCollection, profile.userId);
    localStorage.setItem(localKey, JSON.stringify(profile));

    try {
      const docRef = doc(db, this.profileCollection, profile.userId);
      await setDoc(docRef, profile, { merge: true });
    } catch (err) {
      console.warn('[AdaptiveRepository] Firestore saveProfile error, saved locally:', err);
    }
  }

  createDefaultProfile(userId: string): AdaptiveLearningProfile {
    return {
      userId,
      performanceScore: 75,
      quizScoreAverage: 80,
      speakingScore: 70,
      listeningScore: 75,
      readingSpeedWpm: 120,
      writingQualityScore: 68,
      attendanceRate: 0.9,
      learningStreak: 3,
      motivationLevel: 'high',
      estimatedCefr: 'B1',
      difficultyIndex: 0.5,
      learningStyle: 'Hybrid',
      availableStudyTimeMin: 15,
      careerPath: 'General',
      isChildProfile: false,
      lastUpdated: new Date().toISOString()
    };
  }

  // --- GOALS METHODS ---
  async getGoals(userId: string): Promise<AdaptiveGoal[]> {
    try {
      const q = query(collection(db, this.goalsCollection), where('userId', '==', userId));
      const snap = await getDocs(q);
      const goals: AdaptiveGoal[] = [];
      snap.forEach(d => {
        goals.push(d.data() as AdaptiveGoal);
      });
      if (goals.length > 0) {
        localStorage.setItem(this.getLocalKey(this.goalsCollection, userId), JSON.stringify(goals));
        return goals;
      }
    } catch (err) {
      console.warn('[AdaptiveRepository] Firestore getGoals error, falling back to local storage:', err);
    }

    const local = localStorage.getItem(this.getLocalKey(this.goalsCollection, userId));
    return local ? JSON.parse(local) : this.createDefaultGoals(userId);
  }

  async saveGoal(goal: AdaptiveGoal): Promise<void> {
    // Save locally
    const currentGoals = await this.getGoals(goal.userId);
    const updated = currentGoals.filter(g => g.id !== goal.id);
    updated.push(goal);
    localStorage.setItem(this.getLocalKey(this.goalsCollection, goal.userId), JSON.stringify(updated));

    try {
      const docRef = doc(db, this.goalsCollection, goal.id);
      await setDoc(docRef, goal, { merge: true });
    } catch (err) {
      console.warn('[AdaptiveRepository] Firestore saveGoal error, saved locally:', err);
    }
  }

  async deleteGoal(userId: string, goalId: string): Promise<void> {
    const currentGoals = await this.getGoals(userId);
    const updated = currentGoals.filter(g => g.id !== goalId);
    localStorage.setItem(this.getLocalKey(this.goalsCollection, userId), JSON.stringify(updated));

    try {
      await deleteDoc(doc(db, this.goalsCollection, goalId));
    } catch (err) {
      console.warn('[AdaptiveRepository] Firestore deleteGoal error:', err);
    }
  }

  createDefaultGoals(userId: string): AdaptiveGoal[] {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    const deadline = tomorrow.toISOString().split('T')[0];

    return [
      {
        id: `goal_1_${userId}`,
        userId,
        title: 'Completar 3 Quizzes de vocabulário',
        category: 'vocabulary',
        targetValue: 3,
        currentValue: 1,
        deadline,
        completed: false,
        xpReward: 150
      },
      {
        id: `goal_2_${userId}`,
        userId,
        title: 'Praticar pronúncia por 15 minutos',
        category: 'speaking',
        targetValue: 15,
        currentValue: 5,
        deadline,
        completed: false,
        xpReward: 200
      },
      {
        id: `goal_3_${userId}`,
        userId,
        title: 'Manter a sequência de estudo diária',
        category: 'consistency',
        targetValue: 5,
        currentValue: 3,
        deadline,
        completed: false,
        xpReward: 300
      }
    ];
  }

  // --- LEARNING PATH METHODS ---
  async getPath(userId: string, language: string): Promise<AdaptivePath | null> {
    try {
      const q = query(
        collection(db, this.pathsCollection), 
        where('userId', '==', userId), 
        where('language', '==', language)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const path = snap.docs[0].data() as AdaptivePath;
        localStorage.setItem(this.getLocalKey(this.pathsCollection, userId, language), JSON.stringify(path));
        return path;
      }
    } catch (err) {
      console.warn('[AdaptiveRepository] Firestore getPath error, falling back to local storage:', err);
    }

    const local = localStorage.getItem(this.getLocalKey(this.pathsCollection, userId, language));
    return local ? JSON.parse(local) : null;
  }

  async savePath(path: AdaptivePath): Promise<void> {
    localStorage.setItem(this.getLocalKey(this.pathsCollection, path.userId, path.language), JSON.stringify(path));

    try {
      const docRef = doc(db, this.pathsCollection, path.id);
      await setDoc(docRef, path, { merge: true });
    } catch (err) {
      console.warn('[AdaptiveRepository] Firestore savePath error, saved locally:', err);
    }
  }

  // --- RECOMMENDATIONS METHODS ---
  async getRecommendations(userId: string): Promise<AdaptiveRecommendation[]> {
    try {
      const q = query(collection(db, this.recsCollection), where('userId', '==', userId));
      const snap = await getDocs(q);
      const recs: AdaptiveRecommendation[] = [];
      snap.forEach(d => {
        recs.push(d.data() as AdaptiveRecommendation);
      });
      if (recs.length > 0) {
        localStorage.setItem(this.getLocalKey(this.recsCollection, userId), JSON.stringify(recs));
        return recs;
      }
    } catch (err) {
      console.warn('[AdaptiveRepository] Firestore getRecommendations error, falling back to local:', err);
    }

    const local = localStorage.getItem(this.getLocalKey(this.recsCollection, userId));
    return local ? JSON.parse(local) : this.createDefaultRecommendations();
  }

  async saveRecommendations(userId: string, recs: AdaptiveRecommendation[]): Promise<void> {
    localStorage.setItem(this.getLocalKey(this.recsCollection, userId), JSON.stringify(recs));

    try {
      // Clear old recommendations in Firestore first or save individually
      for (const rec of recs) {
        const docRef = doc(db, this.recsCollection, rec.id);
        await setDoc(docRef, { ...rec, userId }, { merge: true });
      }
    } catch (err) {
      console.warn('[AdaptiveRepository] Firestore saveRecommendations error:', err);
    }
  }

  createDefaultRecommendations(): AdaptiveRecommendation[] {
    return [
      {
        id: 'rec_default_1',
        title: 'Fortalecer habilidades de Listening',
        description: 'Os seus resultados de compreensão oral estão abaixo da sua média geral. Pratique com um áudio curto.',
        actionView: 'practice',
        reason: 'O seu score de escuta está em 75% comparado com 80% em quizzes.',
        priority: 'high',
        estimatedTimeMin: 10
      },
      {
        id: 'rec_default_2',
        title: 'Exercício de Escrita Livre',
        description: 'Escreva um ensaio de 150 palavras sobre os seus hobbies para treinar a sua fluência gramatical.',
        actionView: 'practice',
        reason: 'A sua qualidade de escrita tem potencial de melhoria.',
        priority: 'medium',
        estimatedTimeMin: 15
      },
      {
        id: 'rec_default_3',
        title: 'Sessão Prática de Conversação',
        description: 'Simule um diálogo no aeroporto ou restaurante com o nosso Tutor de IA.',
        actionView: 'live-chat',
        reason: 'Manter a regularidade da fala é essencial para desbloquear a sua fluência.',
        priority: 'high',
        estimatedTimeMin: 5
      }
    ];
  }
}
