import { gamificationRepository } from '../repositories/gamification.repository';
import { 
  UserGamificationState, 
  StoreItem, 
  BadgeRule, 
  GamificationChallenge, 
  GamificationAchievement 
} from '../types/gamification';
import { notificationService } from './notification.service';

export class GamificationService {
  private repository = gamificationRepository;

  // Level computation logic
  getLevelAndProgress(xp: number): { level: number; xpInCurrentLevel: number; xpRequiredForNextLevel: number } {
    let level = 1;
    let xpNeeded = 100;
    let tempXp = xp;
    while (tempXp >= xpNeeded) {
      tempXp -= xpNeeded;
      level++;
      xpNeeded = level * 100;
    }
    return {
      level,
      xpInCurrentLevel: tempXp,
      xpRequiredForNextLevel: xpNeeded
    };
  }

  // Retrieve user gamification state
  async getUserState(userId: string): Promise<UserGamificationState> {
    return await this.repository.getUserState(userId);
  }

  // Add XP and handle levels, badges, and achievements
  async addXp(userId: string, amount: number, sourceName: string): Promise<{
    oldLevel: number;
    newLevel: number;
    leveledUp: boolean;
    badgesUnlocked: string[];
    achievementsUnlocked: string[];
  }> {
    const state = await this.repository.getUserState(userId);
    const oldXp = state.xp;
    const newXp = oldXp + amount;
    
    const oldProgress = this.getLevelAndProgress(oldXp);
    const newProgress = this.getLevelAndProgress(newXp);
    
    const leveledUp = newProgress.level > oldProgress.level;
    
    state.xp = newXp;
    state.level = newProgress.level;

    const results = {
      oldLevel: oldProgress.level,
      newLevel: newProgress.level,
      leveledUp,
      badgesUnlocked: [] as string[],
      achievementsUnlocked: [] as string[]
    };

    // If leveled up, award bonus coins
    if (leveledUp) {
      const levelUpBonus = newProgress.level * 50;
      state.coins += levelUpBonus;
      
      // In-app Notification
      await notificationService.notifyUser(userId, {
        title: '🎉 Subiste de Nível!',
        message: `Parabéns! Alcançaste o Nível ${newProgress.level} e ganhaste um bónus de +${levelUpBonus} moedas!`,
        type: 'achievement'
      });
    }

    // Progress achievements
    const achResults = await this.incrementAchievementProgress(state, 'xp_hunter', amount);
    results.achievementsUnlocked.push(...achResults);

    // Dynamic Badge Audit
    const newlyUnlockedBadges = await this.checkAndAwardBadges(state);
    results.badgesUnlocked.push(...newlyUnlockedBadges);

    // Save final state
    await this.repository.saveUserState(state);

    return results;
  }

  // Add Coins
  async addCoins(userId: string, amount: number, sourceName: string): Promise<void> {
    const state = await this.repository.getUserState(userId);
    state.coins += amount;
    
    // Check coins collector achievement
    const achResults = await this.incrementAchievementProgress(state, 'coin_collector', amount);
    
    // Save state
    await this.repository.saveUserState(state);

    if (achResults.length > 0) {
      await notificationService.notifyUser(userId, {
        title: '🏆 Conquista Desbloqueada!',
        message: `Ganhaste uma nova conquista de moedas!`,
        type: 'achievement'
      });
    }
  }

  // Increment and record learning streak
  async recordActivity(userId: string): Promise<{
    streakIncremented: boolean;
    newStreak: number;
    badgeUnlocked: string | null;
  }> {
    const state = await this.repository.getUserState(userId);
    const today = new Date().toISOString().split('T')[0];
    
    let streakIncremented = false;
    let badgeUnlocked: string | null = null;

    if (state.lastActiveDate === null) {
      state.streak = 1;
      state.lastActiveDate = today;
      streakIncremented = true;
    } else {
      const lastActive = new Date(state.lastActiveDate);
      const currentDate = new Date(today);
      const diffTime = Math.abs(currentDate.getTime() - lastActive.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive active day
        state.streak += 1;
        state.lastActiveDate = today;
        streakIncremented = true;
      } else if (diffDays > 1) {
        // Broken streak - check if they have a streak freeze power-up
        const freezeIdx = state.inventory.indexOf('streak_freeze');
        if (freezeIdx !== -1) {
          // Consume streak freeze
          state.inventory.splice(freezeIdx, 1);
          state.lastActiveDate = today;
          // Streak stays preserved!
          await notificationService.notifyUser(userId, {
            title: '❄️ Escudo de Ofensiva Ativo!',
            message: 'O teu Congelamento de Ofensiva foi consumido. A tua sequência foi protegida contra faltas!',
            type: 'system'
          });
          streakIncremented = false;
        } else {
          // Reset streak
          state.streak = 1;
          state.lastActiveDate = today;
          streakIncremented = true;
        }
      }
    }

    if (streakIncremented) {
      // Record achievement progress
      const achResults = await this.incrementAchievementProgress(state, 'streak_master', 1);
      
      // Badge audit for streak
      const newlyUnlocked = await this.checkAndAwardBadges(state);
      if (newlyUnlocked.length > 0) {
        badgeUnlocked = newlyUnlocked[0];
      }
    }

    await this.repository.saveUserState(state);
    return {
      streakIncremented,
      newStreak: state.streak,
      badgeUnlocked
    };
  }

  // Complete a Daily or Weekly Challenge
  async completeChallenge(userId: string, challengeId: string): Promise<{
    success: boolean;
    xpEarned: number;
    coinsEarned: number;
  }> {
    const state = await this.repository.getUserState(userId);
    if (state.completedChallenges.includes(challengeId)) {
      return { success: false, xpEarned: 0, coinsEarned: 0 };
    }

    const challenges = await this.repository.getChallenges(userId);
    const chal = challenges.find(c => c.id === challengeId);

    if (!chal) return { success: false, xpEarned: 0, coinsEarned: 0 };

    state.completedChallenges.push(challengeId);
    
    // Add rewards
    await this.addXp(userId, chal.rewardXp, `Desafio: ${chal.title}`);
    state.coins += chal.rewardCoins; // Add coins directly

    await this.repository.saveUserState(state);

    await notificationService.notifyUser(userId, {
      title: '🎯 Desafio Concluído!',
      message: `Completaste o desafio "${chal.title}" e ganhaste +${chal.rewardXp} XP e +${chal.rewardCoins} moedas!`,
      type: 'achievement'
    });

    return {
      success: true,
      xpEarned: chal.rewardXp,
      coinsEarned: chal.rewardCoins
    };
  }

  // Purchase an item from Reward Store
  async purchaseItem(userId: string, itemId: string): Promise<{
    success: boolean;
    message: string;
    newState?: UserGamificationState;
  }> {
    const state = await this.repository.getUserState(userId);
    const storeItems = this.repository.getStoreItems();
    const item = storeItems.find(i => i.id === itemId);

    if (!item) {
      return { success: false, message: 'Item não encontrado no catálogo.' };
    }

    if (state.coins < item.cost) {
      return { success: false, message: 'Moedas insuficientes para adquirir este item.' };
    }

    const isConsumable = item.category === 'streak_freeze';
    
    if (state.inventory.includes(itemId) && !isConsumable) {
      return { success: false, message: 'Já adquiriste este item cosmético anteriormente.' };
    }

    // Deduct coins and record inventory
    state.coins -= item.cost;
    state.inventory.push(itemId);

    await this.repository.saveUserState(state);

    await notificationService.notifyUser(userId, {
      title: '🛍️ Compra Efetuada!',
      message: `Adquiriste "${item.name}" com sucesso por ${item.cost} moedas.`,
      type: 'system'
    });

    return {
      success: true,
      message: `Adquirido com sucesso: ${item.name}`,
      newState: state
    };
  }

  // Customize/Equip cosmetic items
  async equipCosmetic(userId: string, category: 'base' | 'accessory' | 'background' | 'title', itemId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const state = await this.repository.getUserState(userId);
    
    // Safety check - verify item ownership
    const defaultItems = ['neutral', 'none', 'slate', 'Iniciante'];
    const isOwned = state.inventory.includes(itemId) || defaultItems.includes(itemId);
    
    if (!isOwned) {
      return { success: false, message: 'Não possuis este item no teu inventário.' };
    }

    if (category === 'base') state.avatar.base = itemId;
    if (category === 'accessory') state.avatar.accessory = itemId;
    if (category === 'background') state.avatar.background = itemId;
    if (category === 'title') state.avatar.title = itemId;

    await this.repository.saveUserState(state);
    return { success: true, message: 'Visual personalizado atualizado!' };
  }

  // Audits badges eligibility
  private async checkAndAwardBadges(state: UserGamificationState): Promise<string[]> {
    const badges = this.repository.getBadges();
    const unlockedNow: string[] = [];

    for (const badge of badges) {
      if (state.badges.includes(badge.id)) continue;

      let eligible = false;
      if (badge.criteriaType === 'streak' && state.streak >= badge.requiredValue) eligible = true;
      if (badge.criteriaType === 'xp' && state.xp >= badge.requiredValue) eligible = true;
      if (badge.criteriaType === 'coins' && state.coins >= badge.requiredValue) eligible = true;
      
      // Quiz & pronunciation metrics mapped dynamically
      if (badge.criteriaType === 'quiz' && (state.achievementsProgress['quiz_conqueror'] || 0) >= badge.requiredValue) eligible = true;
      if (badge.criteriaType === 'pronunciation' && (state.achievementsProgress['pronunciation_pro'] || 0) >= badge.requiredValue) eligible = true;

      if (eligible) {
        state.badges.push(badge.id);
        unlockedNow.push(badge.id);
        
        await notificationService.notifyUser(state.userId, {
          title: `🏅 Medalha Conquistada: ${badge.name}`,
          message: badge.description,
          type: 'achievement'
        });
      }
    }

    return unlockedNow;
  }

  // Handles incrementing and checking achievement rules
  private async incrementAchievementProgress(
    state: UserGamificationState, 
    achievementId: string, 
    incrementBy: number
  ): Promise<string[]> {
    const achList = this.repository.getAchievements();
    const ach = achList.find(a => a.id === achievementId);
    if (!ach) return [];

    const currentProg = state.achievementsProgress[achievementId] || 0;
    const newProg = currentProg + incrementBy;
    state.achievementsProgress[achievementId] = newProg;

    const unlocked: string[] = [];

    // If milestone crossed first time, award milestone coins and XP
    if (currentProg < ach.targetValue && newProg >= ach.targetValue) {
      unlocked.push(achievementId);
      state.coins += ach.rewardCoins;
      state.xp += ach.rewardXp;
      
      await notificationService.notifyUser(state.userId, {
        title: `🏆 Conquista Cruzada: ${ach.name}!`,
        message: `${ach.description} +${ach.rewardXp} XP e +${ach.rewardCoins} Moedas!`,
        type: 'achievement'
      });
    }

    return unlocked;
  }

  // Get active challenges list
  async getChallenges(userId: string): Promise<GamificationChallenge[]> {
    return await this.repository.getChallenges(userId);
  }

  // Get active leaderboards
  async getLeaderboard(userId: string, league: 'bronze' | 'silver' | 'gold' | 'diamond' = 'bronze') {
    return await this.repository.getLeaderboard(userId, league);
  }
}

export const gamificationService = new GamificationService();
export default gamificationService;
