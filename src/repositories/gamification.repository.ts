import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  UserGamificationState, 
  StoreItem, 
  BadgeRule, 
  GamificationAchievement, 
  GamificationChallenge, 
  LeaderboardUser 
} from '../types/gamification';

export class GamificationRepository {
  private collectionName = 'user_gamification';

  private getLocalKey(userId: string): string {
    return `lingolive_gamification_${userId}`;
  }

  // Initial template for a new user gamification state
  private getInitialState(userId: string): UserGamificationState {
    return {
      userId,
      xp: 0,
      level: 1,
      coins: 100, // Gift of 100 starter coins!
      streak: 0,
      lastActiveDate: null,
      avatar: {
        base: 'neutral',
        accessory: 'none',
        background: 'slate',
        title: 'Iniciante'
      },
      inventory: ['skin_neutral', 'title_beginner'],
      badges: [],
      completedChallenges: [],
      achievementsProgress: {},
      league: 'bronze'
    };
  }

  // STATIC ASSETS & RULES DEFINITION
  getStoreItems(): StoreItem[] {
    return [
      { id: 'skin_explorer', name: 'Traje de Explorador', description: 'Para mentes destemidas e curiosas.', cost: 150, category: 'avatar_skin', iconName: 'Compass' },
      { id: 'skin_scholar', name: 'Manto de Estudioso', description: 'O visual clássico do conhecimento.', cost: 250, category: 'avatar_skin', iconName: 'GraduationCap' },
      { id: 'skin_wizard', name: 'Traje de Feiticeiro', description: 'Canalize a magia das línguas.', cost: 400, category: 'avatar_skin', iconName: 'Sparkles' },
      { id: 'skin_champion', name: 'Armadura de Campeão', description: 'Digno das lendas que dominam a conversação.', cost: 600, category: 'avatar_skin', iconName: 'ShieldCheck' },
      
      { id: 'acc_glasses', name: 'Óculos Intelectuais', description: 'Aumenta o estilo e a sabedoria visual.', cost: 100, category: 'avatar_accessory', iconName: 'Eye' },
      { id: 'acc_headphones', name: 'Auscultadores Pro', description: 'Feedback tátil e auditivo premium.', cost: 200, category: 'avatar_accessory', iconName: 'Volume2' },
      { id: 'acc_crown', name: 'Coroa Imperial', description: 'Para reis e rainhas da fluência.', cost: 500, category: 'avatar_accessory', iconName: 'Crown' },
      { id: 'acc_cap', name: 'Boné Desportivo', description: 'Visual urbano e descontraído.', cost: 120, category: 'avatar_accessory', iconName: 'User' },
      
      { id: 'bg_cosmic', name: 'Fundo Espacial', description: 'Viaje através do cosmos da aprendizagem.', cost: 180, category: 'avatar_bg', iconName: 'Database' },
      { id: 'bg_sunset', name: 'Pôr do Sol Dourado', description: 'Um brilho quente para acompanhar o seu progresso.', cost: 120, category: 'avatar_bg', iconName: 'Sun' },
      { id: 'bg_emerald', name: 'Templo de Esmeralda', description: 'A paz natural e foco profundo.', cost: 150, category: 'avatar_bg', iconName: 'Leaf' },
      { id: 'bg_royal', name: 'Salão de Veludo', description: 'Exclusividade digna de banquetes literários.', cost: 250, category: 'avatar_bg', iconName: 'Gem' },
      
      { id: 'title_polyglot', name: 'Título: Poliglota', description: 'Exibe "Poliglota" no seu perfil.', cost: 150, category: 'title', iconName: 'Type' },
      { id: 'title_voice_master', name: 'Título: Mestre de Voz', description: 'Exibe "Mestre de Voz" no seu perfil.', cost: 200, category: 'title', iconName: 'Mic' },
      { id: 'title_legend', name: 'Título: Lenda Ativa', description: 'Exibe "Lenda Ativa" no seu perfil.', cost: 350, category: 'title', iconName: 'Flame' },
      
      { id: 'streak_freeze', name: 'Congelamento de Ofensiva', description: 'Protege a sua ofensiva caso falte um dia.', cost: 100, category: 'streak_freeze', iconName: 'Lock' }
    ];
  }

  getBadges(): BadgeRule[] {
    return [
      { id: 'daily_streak_3', name: 'Foco Diário', description: 'Alcançou uma ofensiva de 3 dias seguidos', iconName: 'Flame', color: 'text-orange-500 bg-orange-500/10 border-orange-500/20', criteriaType: 'streak', requiredValue: 3 },
      { id: 'daily_streak_7', name: 'Hábito de Aço', description: 'Alcançou uma ofensiva de 7 dias seguidos', iconName: 'Flame', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', criteriaType: 'streak', requiredValue: 7 },
      { id: 'daily_streak_30', name: 'Lenda Inabalável', description: 'Alcançou uma ofensiva de 30 dias seguidos', iconName: 'Award', color: 'text-red-500 bg-red-500/10 border-red-500/20', criteriaType: 'streak', requiredValue: 30 },
      { id: 'xp_1000', name: 'Sábio em Ascensão', description: 'Acumulou mais de 1000 XP', iconName: 'Sparkles', color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20', criteriaType: 'xp', requiredValue: 1000 },
      { id: 'xp_5000', name: 'Mestre do Saber', description: 'Acumulou mais de 5000 XP', iconName: 'BookOpen', color: 'text-purple-500 bg-purple-500/10 border-purple-500/20', criteriaType: 'xp', requiredValue: 5000 },
      { id: 'quiz_master_5', name: 'Mestre dos Quizzes', description: 'Concluiu 5 quizzes com sucesso', iconName: 'CheckCircle', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', criteriaType: 'quiz', requiredValue: 5 },
      { id: 'pronunciation_star', name: 'Voz Perfeita', description: 'Atingiu nota máxima de pronúncia', iconName: 'Mic', color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20', criteriaType: 'pronunciation', requiredValue: 90 },
      { id: 'coins_collector', name: 'Riqueza de Fluência', description: 'Acumulou 1000 moedas', iconName: 'CircleDollarSign', color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20', criteriaType: 'coins', requiredValue: 1000 }
    ];
  }

  getAchievements(): GamificationAchievement[] {
    return [
      { id: 'streak_master', name: 'Mestre da Ofensiva', description: 'Desbloqueie ofensivas longas na plataforma.', category: 'consistency', iconName: 'Flame', targetValue: 7, rewardXp: 100, rewardCoins: 50 },
      { id: 'xp_hunter', name: 'Caçador de XP', description: 'Acumule pontos de experiência praticando.', category: 'learning', iconName: 'Sparkles', targetValue: 1500, rewardXp: 150, rewardCoins: 100 },
      { id: 'quiz_conqueror', name: 'Conquistador de Quizzes', description: 'Complete quizzes de vocabulário de alta pontuação.', category: 'performance', iconName: 'ClipboardList', targetValue: 5, rewardXp: 80, rewardCoins: 40 },
      { id: 'pronunciation_pro', name: 'Voz Fluente', description: 'Pratique avaliações de pronúncia para afinar o sotaque.', category: 'performance', iconName: 'Volume2', targetValue: 10, rewardXp: 120, rewardCoins: 60 },
      { id: 'coin_collector', name: 'Investidor de Conhecimento', description: 'Acumule moedas para usar na Loja de Recompensas.', category: 'social', iconName: 'CircleDollarSign', targetValue: 800, rewardXp: 50, rewardCoins: 50 }
    ];
  }

  async awardXpViaServer(eventId: string, eventType: string, extra: Record<string, any> = {}): Promise<any> {
    try {
      const authModule = await import('../firebase');
      const token = await authModule.auth.currentUser?.getIdToken();
      const res = await fetch('/api/gamification/award-xp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          eventId,
          eventType,
          ...extra
        })
      });
      return await res.json();
    } catch (err) {
      console.warn('[GamificationRepository] Server award-xp failed:', err);
      return null;
    }
  }

  // CORE STATE OPERATIONS
  async getUserState(userId: string): Promise<UserGamificationState> {
    try {
      const docRef = doc(db, this.collectionName, userId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const state = snap.data() as UserGamificationState;
        localStorage.setItem(this.getLocalKey(userId), JSON.stringify(state));
        return state;
      } else {
        const initialState = this.getInitialState(userId);
        await setDoc(docRef, initialState);
        localStorage.setItem(this.getLocalKey(userId), JSON.stringify(initialState));
        return initialState;
      }
    } catch (err) {
      console.warn('[GamificationRepository] Firestore error fetching state, loading local cache:', err);
    }
    
    const cached = localStorage.getItem(this.getLocalKey(userId));
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Total offline fallback creation (not saved in FB yet, but will queue or wait)
    const fallback = this.getInitialState(userId);
    localStorage.setItem(this.getLocalKey(userId), JSON.stringify(fallback));
    return fallback;
  }

  async saveUserState(state: UserGamificationState): Promise<void> {
    const userId = state.userId;
    localStorage.setItem(this.getLocalKey(userId), JSON.stringify(state));
    
    try {
      const docRef = doc(db, this.collectionName, userId);
      await setDoc(docRef, state, { merge: true });
    } catch (err) {
      console.warn('[GamificationRepository] Offline or Error saving state to Firestore. Cached locally.', err);
      // Let's implement an offline synchronization queue
      this.queueOfflineSync(userId, state);
    }
  }

  private queueOfflineSync(userId: string, state: UserGamificationState) {
    const queueKey = 'lingolive_gamification_sync_queue';
    const queue = localStorage.getItem(queueKey) ? JSON.parse(localStorage.getItem(queueKey)!) : [];
    if (!queue.includes(userId)) {
      queue.push(userId);
      localStorage.setItem(queueKey, JSON.stringify(queue));
    }
  }

  async runSyncQueue(): Promise<void> {
    const queueKey = 'lingolive_gamification_sync_queue';
    const queue = localStorage.getItem(queueKey) ? JSON.parse(localStorage.getItem(queueKey)!) : [];
    if (queue.length === 0) return;

    console.log('[GamificationRepository] Running offline sync queue for users:', queue);
    const failedUsers: string[] = [];
    
    for (const uid of queue) {
      const cached = localStorage.getItem(this.getLocalKey(uid));
      if (cached) {
        try {
          const state = JSON.parse(cached);
          const docRef = doc(db, this.collectionName, uid);
          await setDoc(docRef, state, { merge: true });
        } catch (err) {
          console.warn('[GamificationRepository] Offline sync failed for user:', uid, err);
          failedUsers.push(uid);
        }
      }
    }
    localStorage.setItem(queueKey, JSON.stringify(failedUsers));
  }

  // LEADERBOARDS & LEAGUES
  async getLeaderboard(userId: string, league: 'bronze' | 'silver' | 'gold' | 'diamond' = 'bronze'): Promise<LeaderboardUser[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('xp', 'desc'),
        limit(50)
      );
      const snap = await getDocs(q);
      const list: LeaderboardUser[] = [];
      let rankCounter = 1;
      
      snap.forEach(docSnap => {
        const d = docSnap.data();
        if (d.league === league || !d.league) {
          list.push({
            userId: d.userId,
            name: d.userName || `Poliglota #${d.userId.substring(0, 4)}`,
            level: d.level || 1,
            xpThisWeek: d.xpThisWeek || Math.min(d.xp, 120),
            totalXp: d.xp || 0,
            streak: d.streak || 0,
            avatar: d.avatar || { base: 'neutral', background: 'slate' },
            rank: rankCounter++,
            isCurrentUser: d.userId === userId
          });
        }
      });

      if (list.length > 0) {
        localStorage.setItem(`lingolive_leaderboard_${league}`, JSON.stringify(list));
        return list;
      }
    } catch (err) {
      console.warn('[GamificationRepository] Firestore leaderboard query failed, utilizing mock/cache entries.', err);
    }

    const cached = localStorage.getItem(`lingolive_leaderboard_${league}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Seeding beautiful dynamic leaderboard competitors to keep it alive & competitive!
    const names = [
      'Sofia Silva', 'Sérgio Santos', 'Mariana Costa', 'Mateus Oliveira', 
      'Ana Pereira', 'João Rodrigues', 'Beatriz Martins', 'Pedro Ferreira',
      'Inês Gomes', 'Diogo Carvalho'
    ];
    const bases = ['scholar', 'explorer', 'wizard', 'champion', 'neutral'];
    const bgs = ['slate', 'cosmic', 'sunset', 'emerald', 'royal'];
    const accs = ['glasses', 'headphones', 'crown', 'none', 'cap'];

    const mockCompetitors: LeaderboardUser[] = names.map((name, idx) => {
      const level = 12 - idx;
      const totalXp = level * 600 + idx * 45;
      const streak = idx * 3 + 2;
      return {
        userId: `mock-user-${idx}`,
        name,
        level,
        xpThisWeek: level * 30 + idx * 10,
        totalXp,
        streak,
        avatar: {
          base: bases[idx % bases.length],
          background: bgs[idx % bgs.length],
          accessory: accs[idx % accs.length],
          title: level > 10 ? 'Lenda' : level > 5 ? 'Poliglota' : 'Iniciante'
        },
        rank: idx + 2
      };
    });

    // We fetch user's own state and inject them in the leaderboard
    const userState = await this.getUserState(userId);
    const userEntry: LeaderboardUser = {
      userId,
      name: 'Tu',
      level: userState.level,
      xpThisWeek: userState.xp > 0 ? Math.floor(userState.xp * 0.4) : 0, // Mock weekly fraction of total
      totalXp: userState.xp,
      streak: userState.streak,
      avatar: userState.avatar,
      rank: 1, // Will sort and set ranks correctly
      isCurrentUser: true
    };

    const combined = [userEntry, ...mockCompetitors];
    combined.sort((a, b) => b.totalXp - a.totalXp);
    
    // Reset ranks
    combined.forEach((item, index) => {
      item.rank = index + 1;
    });

    localStorage.setItem(`lingolive_leaderboard_${league}`, JSON.stringify(combined));
    return combined;
  }

  // DYNAMIC CHALLENGES
  async getChallenges(userId: string): Promise<GamificationChallenge[]> {
    // We fetch active state to map current values
    const state = await this.getUserState(userId);
    
    // We create static base challenges that adapt dynamically to state progress
    const dailyChallenges: GamificationChallenge[] = [
      {
        id: 'daily_xp_50',
        title: 'Foco Diário de XP',
        description: 'Ganhe 50 XP hoje para manter a mente ativa.',
        type: 'daily',
        targetValue: 50,
        currentValue: Math.min(state.xp % 100, 50), // Map dynamic progress
        metric: 'xp',
        rewardXp: 20,
        rewardCoins: 10,
        completed: (state.xp % 100) >= 50 || state.completedChallenges.includes('daily_xp_50')
      },
      {
        id: 'daily_practice_1',
        title: 'Prática de Imersão',
        description: 'Complete 1 sessão de conversação com o Tutor de IA.',
        type: 'daily',
        targetValue: 1,
        currentValue: state.completedChallenges.includes('daily_practice_1') ? 1 : 0,
        metric: 'practice',
        rewardXp: 30,
        rewardCoins: 15,
        completed: state.completedChallenges.includes('daily_practice_1')
      },
      {
        id: 'daily_quiz_1',
        title: 'Revisão Veloz',
        description: 'Conclua 1 quiz rápido de vocabulário hoje.',
        type: 'daily',
        targetValue: 1,
        currentValue: state.completedChallenges.includes('daily_quiz_1') ? 1 : 0,
        metric: 'quiz',
        rewardXp: 25,
        rewardCoins: 12,
        completed: state.completedChallenges.includes('daily_quiz_1')
      }
    ];

    const weeklyChallenges: GamificationChallenge[] = [
      {
        id: 'weekly_xp_300',
        title: 'Maratona Semanal',
        description: 'Acumule 300 XP nas suas sessões ao longo da semana.',
        type: 'weekly',
        targetValue: 300,
        currentValue: Math.min(state.xp, 300),
        metric: 'xp',
        rewardXp: 100,
        rewardCoins: 50,
        completed: state.xp >= 300 || state.completedChallenges.includes('weekly_xp_300')
      },
      {
        id: 'weekly_pronounce_3',
        title: 'Perfeccionismo Vocal',
        description: 'Faça 3 avaliações de pronúncia para afinar seu sotaque.',
        type: 'weekly',
        targetValue: 3,
        currentValue: state.completedChallenges.includes('weekly_pronounce_3') ? 3 : 1, // Start with some progress
        metric: 'pronunciation',
        rewardXp: 80,
        rewardCoins: 40,
        completed: state.completedChallenges.includes('weekly_pronounce_3')
      }
    ];

    return [...dailyChallenges, ...weeklyChallenges];
  }
}

export const gamificationRepository = new GamificationRepository();
export default gamificationRepository;
