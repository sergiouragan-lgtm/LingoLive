import { doc, getDoc, updateDoc, setDoc, deleteField } from 'firebase/firestore';
import { db } from '../firebase';
import { Attribute, SmartProfile, IdentityDomain, LearningDomain, LocalizationDomain, EducationalDomain, AIPersonalizationDomain, GamificationDomain, SubscriptionDomain, AccountDomain, ChildProfileDomain, AccessibilityDomain } from '../profile/types';
import { normalizeTargetLanguages, setPrimaryTargetLanguage, addTargetLanguage, removeTargetLanguage } from './targetLanguagesPolicy';

export class SmartProfileEngine {
  private profileCache = new Map<string, { profile: SmartProfile | null; timestamp: number }>();
  private cacheTtlMs = 30000; // 30-second short-term in-memory cache by default

  /**
   * Sets the short-term cache duration in milliseconds.
   */
  public setCacheTTL(ttlMs: number): void {
    this.cacheTtlMs = ttlMs;
  }

  /**
   * Clears the in-memory profile cache for a specific user or all cached profiles.
   */
  public clearCache(userId?: string): void {
    if (userId) {
      this.profileCache.delete(userId);
    } else {
      this.profileCache.clear();
    }
  }
  /**
   * Normaliza a gravação do domínio 'learning' para garantir que 'targetLanguages'
   * é sempre sincronizado com 'targetLanguage' (e vice-versa), preservando o formato
   * Attribute<T> ou valor direto conforme recebido.
   *
   * Função pura de domínio: não depende do SDK do Firestore nem gera sentinelas de remoção.
   */
  public normalizeLearningDomain(learning: Partial<LearningDomain>): Partial<LearningDomain> {
    const result: Partial<LearningDomain> = { ...learning };

    const state = normalizeTargetLanguages({
      primaryLanguage: learning.targetLanguage,
      targetLanguages: learning.targetLanguages
    });

    if (state.primaryLanguage) {
      if (typeof learning.targetLanguage === 'string') {
        result.targetLanguage = state.primaryLanguage;
        result.targetLanguages = state.targetLanguages as string[];
      } else if (typeof learning.targetLanguage === 'object' && learning.targetLanguage !== null && 'value' in learning.targetLanguage) {
        const attr = learning.targetLanguage as Attribute<string>;
        result.targetLanguage = {
          ...attr,
          value: state.primaryLanguage
        };
        result.targetLanguages = {
          value: state.targetLanguages as string[],
          confidence: attr.confidence ?? 1,
          source: attr.source ?? 'user',
          lastUpdated: attr.lastUpdated ?? new Date().toISOString(),
          validationStatus: attr.validationStatus ?? 'verified',
          version: attr.version ?? '1.0.0'
        };
      }
    } else {
      delete result.targetLanguage;
      delete result.targetLanguages;
    }

    return result;
  }

  async getProfile(userId: string, forceRefresh = false): Promise<SmartProfile | null> {
    const now = Date.now();
    const cached = this.profileCache.get(userId);

    if (!forceRefresh && cached && (now - cached.timestamp < this.cacheTtlMs)) {
      return cached.profile;
    }

    const docRef = doc(db, 'profiles', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const profileData = docSnap.data() as SmartProfile;
      this.profileCache.set(userId, { profile: profileData, timestamp: now });
      return profileData;
    }
    this.profileCache.set(userId, { profile: null, timestamp: now });
    return null;
  }

  async getDomain<K extends keyof Omit<SmartProfile, 'userId' | 'updatedAt'>>(
    userId: string,
    domainName: K
  ): Promise<SmartProfile[K] | null> {
    const profile = await this.getProfile(userId);
    return profile ? profile[domainName] : null;
  }

  async updateDomain<K extends keyof Omit<SmartProfile, 'userId' | 'updatedAt'>>(
    userId: string,
    domainName: K,
    update: Partial<SmartProfile[K]>
  ): Promise<void> {
    const docRef = doc(db, 'profiles', userId);
    const processedUpdate = { ...update };
    const updateData: Record<string, any> = {};

    if (domainName === 'learning') {
      const learningUpdate = processedUpdate as Partial<LearningDomain>;
      const hasTargetLanguage = Object.prototype.hasOwnProperty.call(learningUpdate, 'targetLanguage');

      const isExplicitEmpty = (val: unknown): boolean => {
        if (typeof val === 'string') {
          return val.trim().length === 0;
        }
        if (typeof val === 'object' && val !== null && 'value' in val) {
          const innerVal = (val as { value: unknown }).value;
          if (typeof innerVal === 'string') {
            return innerVal.trim().length === 0;
          }
        }
        return false;
      };

      if (hasTargetLanguage && isExplicitEmpty(learningUpdate.targetLanguage)) {
        updateData['learning.targetLanguage'] = deleteField();
        updateData['learning.targetLanguages'] = deleteField();
        delete learningUpdate.targetLanguage;
        delete learningUpdate.targetLanguages;
      }

      const normalized = this.normalizeLearningDomain(learningUpdate);
      Object.assign(processedUpdate, normalized);
    }

    for (const key in processedUpdate) {
      if (processedUpdate[key as keyof typeof processedUpdate] !== undefined) {
        updateData[`${domainName}.${key}`] = processedUpdate[key as keyof typeof processedUpdate];
      }
    }
    updateData['updatedAt'] = new Date().toISOString();
    await updateDoc(docRef, updateData);
    this.clearCache(userId);
  }

  // Convenience methods
  async updateIdentity(userId: string, update: Partial<IdentityDomain>) { await this.updateDomain(userId, 'identity', update); }
  async updateLearning(userId: string, update: Partial<LearningDomain>) { await this.updateDomain(userId, 'learning', update); }
  async updateLocalization(userId: string, update: Partial<LocalizationDomain>) { await this.updateDomain(userId, 'localization', update); }
  async updateEducational(userId: string, update: Partial<EducationalDomain>) { await this.updateDomain(userId, 'educational', update); }
  async updateAIPersonalization(userId: string, update: Partial<AIPersonalizationDomain>) { await this.updateDomain(userId, 'aiPersonalization', update); }
  async updateGamification(userId: string, update: Partial<GamificationDomain>) { await this.updateDomain(userId, 'gamification', update); }
  async updateSubscription(userId: string, update: Partial<SubscriptionDomain>) { await this.updateDomain(userId, 'subscription', update); }
  async updateAccount(userId: string, update: Partial<AccountDomain>) { await this.updateDomain(userId, 'account', update); }
  async updateChildProfile(userId: string, update: Partial<ChildProfileDomain>) { await this.updateDomain(userId, 'childProfile', update); }
  async updateAccessibility(userId: string, update: Partial<AccessibilityDomain>) { await this.updateDomain(userId, 'accessibility', update); }
  async setPrimaryTargetLanguage(userId: string, language: unknown): Promise<void> {
    const profile = await this.getProfile(userId);
    if (!profile) {
      throw new Error(`Profile not found for user: ${userId}`);
    }

    const learning: Partial<LearningDomain> = profile.learning || {};
    const state = normalizeTargetLanguages({
      primaryLanguage: learning.targetLanguage,
      targetLanguages: learning.targetLanguages
    });

    const newState = setPrimaryTargetLanguage(state, language);
    
    // Normalizar novamente para garantir formato Attribute se necessário
    const updatedLearning = this.normalizeLearningDomain({
      ...learning,
      targetLanguage: newState.primaryLanguage,
      targetLanguages: [...newState.targetLanguages]
    }) as LearningDomain;

    await this.updateLearning(userId, updatedLearning);
  }

  async addTargetLanguage(userId: string, language: unknown): Promise<void> {
    const profile = await this.getProfile(userId);
    if (!profile) {
      throw new Error(`Profile not found for user: ${userId}`);
    }

    const learning: Partial<LearningDomain> = profile.learning || {};
    const state = normalizeTargetLanguages({
      primaryLanguage: learning.targetLanguage,
      targetLanguages: learning.targetLanguages
    });

    const newState = addTargetLanguage(state, language);
    
    // Normalizar novamente para garantir formato Attribute se necessário
    const updatedLearning = this.normalizeLearningDomain({
      ...learning,
      targetLanguage: newState.primaryLanguage,
      targetLanguages: [...newState.targetLanguages]
    }) as LearningDomain;

    await this.updateLearning(userId, updatedLearning);
  }

  async removeTargetLanguage(userId: string, language: unknown): Promise<void> {
    const profile = await this.getProfile(userId);
    if (!profile) {
      throw new Error(`Profile not found for user: ${userId}`);
    }

    const learning: Partial<LearningDomain> = profile.learning || {};
    const state = normalizeTargetLanguages({
      primaryLanguage: learning.targetLanguage,
      targetLanguages: learning.targetLanguages
    });

    const newState = removeTargetLanguage(state, language);
    
    // Check if the result is empty
    if (newState.primaryLanguage === null && newState.targetLanguages.length === 0) {
        // Trigger the deleteField logic in updateLearning
        await this.updateLearning(userId, { targetLanguage: '' });
    } else {
        const updatedLearning = this.normalizeLearningDomain({
          ...learning,
          targetLanguage: newState.primaryLanguage,
          targetLanguages: [...newState.targetLanguages]
        }) as LearningDomain;

        await this.updateLearning(userId, updatedLearning);
    }
  }

  async initializeProfile(userId: string, initialProfile: Omit<SmartProfile, 'userId' | 'updatedAt'>): Promise<void> {
    const docRef = doc(db, 'profiles', userId);
    const profileToInit = { ...initialProfile };
    if (profileToInit.learning) {
      profileToInit.learning = this.normalizeLearningDomain(profileToInit.learning) as LearningDomain;
    }
    await setDoc(docRef, {
      userId,
      ...profileToInit,
      updatedAt: new Date().toISOString(),
    });
    this.clearCache(userId);
  }
}

export const smartProfileEngine = new SmartProfileEngine();

