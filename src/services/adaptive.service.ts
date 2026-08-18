import { auth } from '../firebase';
import { 
  AdaptiveLearningProfile, 
  AdaptiveGoal, 
  AdaptivePath, 
  AdaptiveRecommendation,
  LearningObjective,
  KnowledgeGap,
  AdaptivePathNode
} from '../types/adaptive';
import { AdaptiveRepository } from '../repositories/adaptive.repository';

export class AdaptiveService {
  private repository = new AdaptiveRepository();

  private async getAuthHeaders(): Promise<HeadersInit> {
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : '';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // --- PROFILE ---
  async getProfile(): Promise<AdaptiveLearningProfile> {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");

    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch('/api/adaptive/profile', { headers });
      if (res.ok) {
        const data = await res.json();
        await this.repository.saveProfile(data);
        return data;
      }
    } catch (err) {
      console.warn('[AdaptiveService] Server profile fetch error, fetching locally:', err);
    }

    // Local fallback
    const local = await this.repository.getProfile(user.uid);
    if (local) return local;

    // Create a rich default profile for Enterprise
    const defaultProfile: AdaptiveLearningProfile = {
      userId: user.uid,
      performanceScore: 50,
      quizScoreAverage: 50,
      speakingScore: 50,
      listeningScore: 50,
      readingSpeedWpm: 120,
      writingQualityScore: 50,
      attendanceRate: 1,
      learningStreak: 1,
      motivationLevel: 'medium',
      estimatedCefr: 'A1',
      difficultyIndex: 0.2,
      learningStyle: 'Hybrid',
      availableStudyTimeMin: 15,
      careerPath: 'General',
      isChildProfile: false,
      lastUpdated: new Date().toISOString()
    };
    await this.repository.saveProfile(defaultProfile);
    return defaultProfile;
  }

  async updateProfile(updates: Partial<AdaptiveLearningProfile>): Promise<AdaptiveLearningProfile> {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");

    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch('/api/adaptive/profile/update', {
        method: 'POST',
        headers,
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const { profile } = await res.json();
        await this.repository.saveProfile(profile);
        return profile;
      }
    } catch (err) {
      console.warn('[AdaptiveService] Server profile update error, saving locally:', err);
    }

    // Local fallback update
    const current = await this.getProfile();
    const updated: AdaptiveLearningProfile = {
      ...current,
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    
    // Simulate difficulty calculations locally
    const perf = updated.performanceScore;
    const quiz = updated.quizScoreAverage;
    const speaking = updated.speakingScore;
    const listening = updated.listeningScore;
    const writing = updated.writingQualityScore;
    const streak = updated.learningStreak;
    const motivationFactor = updated.motivationLevel === 'high' ? 1.15 : updated.motivationLevel === 'medium' ? 1.0 : 0.85;
    
    const baseScore = (speaking * 0.25) + (quiz * 0.2) + (listening * 0.2) + (writing * 0.15) + (perf * 0.1) + (Math.min(10, streak) * 10 * 0.1);
    const rawIndex = (baseScore / 100) * motivationFactor;
    updated.difficultyIndex = Math.max(0.1, Math.min(1.0, rawIndex));
    
    if (updated.difficultyIndex > 0.85) updated.estimatedCefr = 'C2';
    else if (updated.difficultyIndex > 0.70) updated.estimatedCefr = 'C1';
    else if (updated.difficultyIndex > 0.55) updated.estimatedCefr = 'B2';
    else if (updated.difficultyIndex > 0.40) updated.estimatedCefr = 'B1';
    else if (updated.difficultyIndex > 0.25) updated.estimatedCefr = 'A2';
    else updated.estimatedCefr = 'A1';

    await this.repository.saveProfile(updated);
    return updated;
  }

  // --- MULTI-GOAL LEARNING ORCHESTRATOR ---
  async getLearningObjectives(): Promise<LearningObjective[]> {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");

    // Stub for Multi-Goal orchestration
    return [
      {
        id: `obj_primary_${user.uid}`,
        userId: user.uid,
        type: 'Primary',
        title: 'Alcançar B2 em Inglês',
        description: 'Objetivo principal focado em fluência geral e gramática.',
        targetCefr: 'B2',
        status: 'active',
        priorityWeight: 0.6,
        createdAt: new Date().toISOString()
      },
      {
        id: `obj_prof_${user.uid}`,
        userId: user.uid,
        type: 'Professional',
        title: 'Inglês para Negócios',
        description: 'Melhorar vocabulário técnico para reuniões de software.',
        targetSkill: 'vocabulary',
        status: 'active',
        priorityWeight: 0.4,
        createdAt: new Date().toISOString()
      }
    ];
  }

  // --- KNOWLEDGE GAP ANALYSIS ---
  async getKnowledgeGaps(): Promise<KnowledgeGap[]> {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");

    // Stub: Returns identified gaps for the user
    return [
      {
        id: `gap_1_${user.uid}`,
        userId: user.uid,
        topic: 'Present Perfect vs Past Simple',
        type: 'grammar',
        severity: 'high',
        identifiedAt: new Date().toISOString()
      },
      {
        id: `gap_2_${user.uid}`,
        userId: user.uid,
        topic: 'Th- sound pronunciation',
        type: 'pronunciation',
        severity: 'medium',
        identifiedAt: new Date().toISOString()
      }
    ];
  }

  // --- RECOMMENDATIONS (GEMINI POWERED) ---
  async getRecommendations(languageCode: string): Promise<AdaptiveRecommendation[]> {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");

    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch('/api/adaptive/recommendations/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ language: languageCode })
      });
      if (res.ok) {
        const data = await res.json();
        await this.repository.saveRecommendations(user.uid, data);
        return data;
      }
    } catch (err) {
      console.warn('[AdaptiveService] Server recommendations error, pulling local defaults:', err);
    }

    return this.repository.getRecommendations(user.uid);
  }

  // --- LEARNING PATH (GEMINI POWERED) ---
  async getPath(languageCode: string): Promise<AdaptivePath> {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");

    // Check repository first
    const cached = await this.repository.getPath(user.uid, languageCode);
    if (cached) return cached;

    return this.generateNewPath(languageCode);
  }

  async generateNewPath(languageCode: string): Promise<AdaptivePath> {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");

    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch('/api/adaptive/path/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ language: languageCode })
      });
      if (res.ok) {
        const data = await res.json();
        await this.repository.savePath(data);
        return data;
      }
    } catch (err) {
      console.warn('[AdaptiveService] Server path generator error, generating local path:', err);
    }

    // Default Fallback - ALPE Enterprise Generation Logic
    const profile = await this.getProfile();
    const objectives = await this.getLearningObjectives();
    const gaps = await this.getKnowledgeGaps();

    let pathType: AdaptivePath['pathType'] = 'Standard';
    if (profile.isChildProfile) pathType = 'Child';
    else if (profile.careerPath !== 'General' && profile.careerPath !== 'Student') pathType = 'Career';
    else if (objectives.length > 1) pathType = 'Multi_Goal';

    // Base difficulty mapped from index
    let nodeDifficulty: AdaptivePathNode['difficulty'] = 'Intermediate';
    if (profile.difficultyIndex > 0.8) nodeDifficulty = 'Expert';
    else if (profile.difficultyIndex > 0.5) nodeDifficulty = 'Advanced';
    else if (profile.difficultyIndex < 0.3) nodeDifficulty = 'Beginner';

    // Generate Microlearning duration based on profile
    const baseDuration = profile.availableStudyTimeMin || 15;

    const nodes: AdaptivePathNode[] = [];

    // Node 1: Review Engine (Spaced Repetition Focus)
    if (gaps.length > 0) {
      nodes.push({
        id: `node_review_${Date.now()}`,
        title: `Revisão: ${gaps[0].topic}`,
        description: `Micro-sessão de repetição espaçada focada em fechar uma lacuna de conhecimento.`,
        type: 'review',
        difficulty: nodeDifficulty,
        durationMin: 5,
        xpReward: 100,
        status: 'unlocked',
        skillsTargeted: [gaps[0].type, "Retenção de Memória"],
        isReview: true
      });
    }

    // Node 2: Primary Objective
    const primaryObj = objectives.find(o => o.type === 'Primary');
    if (pathType === 'Child') {
      nodes.push({
        id: `node_child_${Date.now()}`,
        title: "Aventura Vocabular",
        description: "Encontre as palavras perdidas neste mini-jogo divertido.",
        type: "game",
        difficulty: "Beginner",
        durationMin: baseDuration,
        xpReward: 250,
        status: gaps.length > 0 ? 'locked' : 'unlocked',
        skillsTargeted: ["Vocabulário", "Escuta"]
      });
    } else {
      nodes.push({
        id: `node_primary_${Date.now()}`,
        title: "Sessão Prática Principal",
        description: `Lição central focada no seu objetivo: ${primaryObj?.title || 'Fluência'}.`,
        type: "speaking",
        difficulty: nodeDifficulty,
        durationMin: baseDuration > 15 ? 15 : baseDuration,
        xpReward: 200,
        status: gaps.length > 0 ? 'locked' : 'unlocked',
        skillsTargeted: ["Fluência", "Pronúncia"],
        tiedObjectiveId: primaryObj?.id
      });
    }

    // Node 3: Secondary / Professional (if applicable)
    if (pathType === 'Multi_Goal' || pathType === 'Career') {
      const profObj = objectives.find(o => o.type === 'Professional');
      nodes.push({
        id: `node_prof_${Date.now()}`,
        title: `Simulação de ${profile.careerPath || 'Negócios'}`,
        description: "Exercício prático focado no seu vocabulário profissional.",
        type: "professional_simulation",
        difficulty: nodeDifficulty,
        durationMin: 10,
        xpReward: 300,
        status: 'locked',
        skillsTargeted: ["Vocabulário Técnico", "Comunicação B2B"],
        tiedObjectiveId: profObj?.id
      });
    } else if (pathType !== 'Child') {
      nodes.push({
        id: `node_general_${Date.now()}`,
        title: "Leitura Adaptativa",
        description: "Artigo dinâmico ajustado à sua velocidade de leitura e vocabulário.",
        type: "reading",
        difficulty: nodeDifficulty,
        durationMin: 10,
        xpReward: 150,
        status: 'locked',
        skillsTargeted: ["Compreensão", "Velocidade de Leitura"]
      });
    }

    const fallbackPath: AdaptivePath = {
      id: `path_${user.uid}_${Date.now()}`,
      userId: user.uid,
      language: languageCode,
      generatedAt: new Date().toISOString(),
      pathType,
      nodes
    };
    await this.repository.savePath(fallbackPath);
    return fallbackPath;
  }

  async savePath(path: AdaptivePath): Promise<void> {
    await this.repository.savePath(path);
  }

  // --- STUDY SLOT SCHEDULE ---
  async getStudySchedule() {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");

    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch('/api/adaptive/schedule', { headers });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('[AdaptiveService] Study schedule error, providing smart local estimation:', err);
    }

    return {
      userId: user.uid,
      advice: "O ALPE detectou uma oportunidade de otimização: Intercale sessões de Listening e Writing usando Microlearning de 10 minutos diários para maximizar a retenção via Spaced Repetition.",
      recommendedDurationMin: 15,
      frequencyDaysPerWeek: 5,
      timeSlotRecommendation: "Noite (20:30 - 20:45)",
      nextRecommendedSession: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
  }

  // --- GOALS ---
  async getGoals(): Promise<AdaptiveGoal[]> {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");
    return this.repository.getGoals(user.uid);
  }

  async updateGoalProgress(goalId: string, increment: number): Promise<AdaptiveGoal[]> {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");

    const goals = await this.getGoals();
    const updatedGoals = await Promise.all(goals.map(async (goal) => {
      if (goal.id === goalId) {
        const nextVal = Math.min(goal.targetValue, goal.currentValue + increment);
        const completed = nextVal >= goal.targetValue;
        const updatedGoal = {
          ...goal,
          currentValue: nextVal,
          completed
        };
        await this.repository.saveGoal(updatedGoal);
        return updatedGoal;
      }
      return goal;
    }));

    return updatedGoals;
  }

  async createCustomGoal(title: string, category: AdaptiveGoal['category'], targetValue: number, deadlineDays: number, xpReward: number): Promise<AdaptiveGoal> {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");

    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + deadlineDays);

    const goal: AdaptiveGoal = {
      id: `goal_custom_${Date.now()}`,
      userId: user.uid,
      title,
      category,
      targetValue,
      currentValue: 0,
      deadline: deadlineDate.toISOString().split('T')[0],
      completed: false,
      xpReward
    };

    await this.repository.saveGoal(goal);
    return goal;
  }

  async deleteGoal(goalId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");
    await this.repository.deleteGoal(user.uid, goalId);
  }
}
