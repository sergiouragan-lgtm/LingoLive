import { doc, getDoc, setDoc, updateDoc, onSnapshot, arrayUnion, increment } from 'firebase/firestore';
import { db, auth } from '../firebase';

export interface Badge {
  id: string;
  title: string;
  description: string;
  iconName: string;
  progress: number;
  totalRequired: number;
  unlockedAt: string | null;
}

export interface UserAchievements {
  userId: string;
  languagesExplored: string[];
  quizzesCompleted: number;
  badges: {
    [badgeId: string]: Badge;
  };
}

const DEFAULT_BADGES = {
  'language-explorer': {
    id: 'language-explorer',
    title: 'Language Explorer',
    description: 'Explore 2 ou mais idiomas diferentes para expandir seus horizontes.',
    iconName: 'BookOpen',
    progress: 0,
    totalRequired: 2,
    unlockedAt: null
  },
  'quiz-master': {
    id: 'quiz-master',
    title: 'Quiz Master',
    description: 'Complete 3 ou mais testes e questionários de fixação gramatical.',
    iconName: 'GraduationCap',
    progress: 0,
    totalRequired: 3,
    unlockedAt: null
  },
  'word-master': {
    id: 'word-master',
    title: 'Word Master',
    description: 'Salve palavras novas no seu baralho pessoal de vocabulário.',
    iconName: 'Award',
    progress: 0,
    totalRequired: 5,
    unlockedAt: null
  }
};

/**
 * Helper to retry async operations on failure with exponential backoff.
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 5, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (error.message?.includes('offline') && retries > 0) {
      console.warn(`[AchievementsManager] Offline/Error, retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * Ensures that an achievements document exists for the user in Firestore.
 */
export async function initializeAchievements(userId: string, retries = 3): Promise<UserAchievements> {
  console.log('[AchievementsManager] initializeAchievements called for userId:', userId, 'currentUser:', auth.currentUser?.uid);
  const docRef = doc(db, 'user_achievements', userId);
  
  return withRetry(async () => {
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      const initialData: UserAchievements = {
        userId,
        languagesExplored: [],
        quizzesCompleted: 0,
        badges: DEFAULT_BADGES
      };
      await setDoc(docRef, initialData);
      return initialData;
    }

    const existingData = snap.data() as UserAchievements;
    // Ensure default badges are present if schemas match/merge
    const mergedBadges = { ...DEFAULT_BADGES, ...(existingData.badges || {}) };
    const updatedData = {
      ...existingData,
      userId,
      languagesExplored: existingData.languagesExplored || [],
      quizzesCompleted: existingData.quizzesCompleted || 0,
      badges: mergedBadges
    };
    return updatedData;
  }, retries);
}

/**
 * Real-time subscription to user achievements from Firestore.
 */
export function subscribeToAchievements(
  userId: string, 
  onUpdate: (data: UserAchievements) => void,
  onUnlock?: (badgeTitle: string) => void
): () => void {
  const docRef = doc(db, 'user_achievements', userId);
  
  // First ensure document exists
  initializeAchievements(userId).catch(err => {
    console.error('[AchievementsManager] Failed to initialize achievements document on subscribe:', err);
  });

  let previousUnlockedIds: string[] = [];

  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data() as UserAchievements;
      const mergedBadges = { ...DEFAULT_BADGES, ...(data.badges || {}) };
      
      const currentUnlockedIds: string[] = [];
      Object.values(mergedBadges).forEach((b) => {
        if (b.unlockedAt) {
          currentUnlockedIds.push(b.id);
        }
      });

      // Detect newly unlocked badges
      if (previousUnlockedIds.length > 0 && onUnlock) {
        currentUnlockedIds.forEach(id => {
          if (!previousUnlockedIds.includes(id)) {
            const b = mergedBadges[id];
            if (b) onUnlock(b.title);
          }
        });
      }
      
      previousUnlockedIds = currentUnlockedIds;

      onUpdate({
        ...data,
        badges: mergedBadges
      });
    }
  });
}

/**
 * Tracks and records a language being explored by the student.
 */
export async function recordLanguageExplored(userId: string, languageName: string): Promise<void> {
  console.log('[AchievementsManager] recordLanguageExplored:', { userId, languageName, currentAuthUser: auth.currentUser?.uid });
  try {
    await withRetry(async () => {
      const docRef = doc(db, 'user_achievements', userId);
      const snap = await getDoc(docRef);
      console.log('[DEBUG] recordLanguageExplored: userId:', userId, 'auth.currentUser.uid:', auth.currentUser?.uid);
      
      let currentData = snap.exists() 
        ? (snap.data() as UserAchievements) 
        : await initializeAchievements(userId);

      const languages = currentData.languagesExplored || [];
      if (!languages.includes(languageName)) {
        const nextLanguages = [...languages, languageName];
        const nextBadges = { ...currentData.badges };
        
        // Update progress
        const explorer = { ...nextBadges['language-explorer'] };
        explorer.progress = nextLanguages.length;
        if (explorer.progress >= explorer.totalRequired && !explorer.unlockedAt) {
          explorer.unlockedAt = new Date().toISOString();
        }
        nextBadges['language-explorer'] = explorer;

        await setDoc(docRef, {
          languagesExplored: nextLanguages,
          badges: nextBadges
        }, { merge: true });
      }
    });
  } catch (error: any) {
    if (error.message?.includes('offline')) {
      console.warn('[AchievementsManager] Offline, skipping recording language explored achievement');
    } else {
      console.error('[AchievementsManager] Error recording language explored achievement:', error);
    }
  }
}

/**
 * Tracks and records a completed quiz by the student.
 */
export async function recordQuizCompleted(userId: string): Promise<void> {
  console.log('[AchievementsManager] recordQuizCompleted:', { userId, currentAuthUser: auth.currentUser?.uid });
  try {
    await withRetry(async () => {
      const docRef = doc(db, 'user_achievements', userId);
      const snap = await getDoc(docRef);
      
      let currentData = snap.exists() 
        ? (snap.data() as UserAchievements) 
        : await initializeAchievements(userId);

      const quizzesCount = (currentData.quizzesCompleted || 0) + 1;
      const nextBadges = { ...currentData.badges };

      // Update progress
      const quizMaster = { ...nextBadges['quiz-master'] };
      quizMaster.progress = quizzesCount;
      if (quizMaster.progress >= quizMaster.totalRequired && !quizMaster.unlockedAt) {
        quizMaster.unlockedAt = new Date().toISOString();
      }
      nextBadges['quiz-master'] = quizMaster;

      await setDoc(docRef, {
        quizzesCompleted: quizzesCount,
        badges: nextBadges
      }, { merge: true });
    });
  } catch (error: any) {
    if (error.message?.includes('offline')) {
      console.warn('[AchievementsManager] Offline, skipping recording quiz completed achievement');
    } else {
      console.error('[AchievementsManager] Error recording quiz completed achievement:', error);
    }
  }
}

/**
 * Tracks and records saved words progress.
 */
export async function recordSavedWordsCount(userId: string, count: number): Promise<void> {
  console.log('[AchievementsManager] recordSavedWordsCount:', { userId, count, currentAuthUser: auth.currentUser?.uid });
  try {
    await withRetry(async () => {
      const docRef = doc(db, 'user_achievements', userId);
      const snap = await getDoc(docRef);
      
      let currentData = snap.exists() 
        ? (snap.data() as UserAchievements) 
        : await initializeAchievements(userId);

      const nextBadges = { ...currentData.badges };
      const wordMaster = { ...nextBadges['word-master'] };
      
      wordMaster.progress = count;
      if (wordMaster.progress >= wordMaster.totalRequired && !wordMaster.unlockedAt) {
        wordMaster.unlockedAt = new Date().toISOString();
      }
      nextBadges['word-master'] = wordMaster;

      await setDoc(docRef, {
        badges: nextBadges
      }, { merge: true });
    });
  } catch (error: any) {
    if (error.message?.includes('offline')) {
      console.warn('[AchievementsManager] Offline, skipping recording saved words count');
    } else {
      console.error('[AchievementsManager] Error recording saved words count:', error);
    }
  }
}

/**
 * Backs up the actual saved words array to the user's achievements document in Firestore.
 */
export async function backupSavedWordsToFirestore(userId: string, words: any[]): Promise<void> {
  try {
    await withRetry(async () => {
      const docRef = doc(db, 'user_achievements', userId);
      await setDoc(docRef, {
        savedWords: words
      }, { merge: true });
    });
  } catch (error) {
    console.error('[AchievementsManager] Error backing up saved words:', error);
    throw error;
  }
}

/**
 * Fetches the backed up saved words array from the user's achievements document in Firestore.
 */
export async function fetchSavedWordsFromFirestore(userId: string): Promise<any[] | null> {
  try {
    const docRef = doc(db, 'user_achievements', userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return data.savedWords || null;
    }
    return null;
  } catch (error) {
    console.error('[AchievementsManager] Error fetching saved words from Firestore:', error);
    throw error;
  }
}

