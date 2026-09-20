import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface Achievement {
  achievementId: string;
  userId: string;
  badgeType: 'milestone' | 'streak' | 'mastery' | 'social' | 'time_based';
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  pointsAwarded: number;
  unlockedAt: Date;
  progress?: number; // 0-100 for in-progress achievements
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  rank: number;
  totalPoints: number;
  weeklyPoints?: number;
  achievements: number;
  streakDays: number;
  lastActivityDate: Date;
}

export interface StreakData {
  userId: string;
  concept: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  streakStartDate: Date;
  pointsThisStreak: number;
}

export interface RewardTransaction {
  transactionId: string;
  userId: string;
  points: number;
  reason: 'lesson_completion' | 'quiz_success' | 'streak_bonus' | 'achievement' | 'challenge_win';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ProgressMilestone {
  milestoneId: string;
  userId: string;
  type: 'level_up' | 'skill_mastery' | 'total_points' | 'achievements_unlocked';
  threshold: number;
  currentValue: number;
  reachedAt?: Date;
  rewardPoints: number;
}

export interface UserEngagementProfile {
  userId: string;
  totalPoints: number;
  achievementCount: number;
  currentLevel: number; // 1-100
  nextLevelThreshold: number;
  totalStreakDays: number;
  engagementScore: number; // 0-100
  badges: Achievement[];
  lastEngagementDate: Date;
}

class GamificationEngagementService {
  private db: FirebaseFirestore.Firestore;
  private leaderboardCache: Map<string, any> = new Map();

  constructor() {
    this.db = getFirestore();
    this.scheduleLeaderboardUpdate();
  }

  public async unlockAchievement(
    userId: string,
    badgeType: string,
    title: string,
    pointsAwarded: number
  ): Promise<Achievement> {
    try {
      const achievementId = `achievement-${userId}-${Date.now()}`;
      const achievement: Achievement = {
        achievementId,
        userId,
        badgeType: badgeType as any,
        title,
        description: `Earned ${title}`,
        icon: this.getBadgeIcon(badgeType),
        rarity: this.calculateRarity(pointsAwarded),
        pointsAwarded,
        unlockedAt: new Date(),
      };

      await this.db.collection('achievements').doc(achievementId).set(achievement);
      await this.awardPoints(userId, pointsAwarded, 'achievement', { badgeType, title });

      logSecurityEvent('ACHIEVEMENT_UNLOCKED' as any, 'info' as any, `Achievement unlocked: ${title}`, { userId, badgeType });
      return achievement;
    } catch (error) {
      logSecurityEvent('ACHIEVEMENT_UNLOCK_FAILED' as any, 'error' as any, `Achievement unlock failed`, { userId });
      throw error;
    }
  }

  public async getLeaderboard(
    scope: 'global' | 'weekly' | 'friends',
    userId?: string,
    limit: number = 100
  ): Promise<LeaderboardEntry[]> {
    try {
      const cacheKey = `leaderboard-${scope}-${userId || 'all'}`;
      if (this.leaderboardCache.has(cacheKey)) {
        return this.leaderboardCache.get(cacheKey);
      }

      let query = this.db.collection('user_engagement_profiles').orderBy('totalPoints', 'desc').limit(limit);

      if (scope === 'weekly') {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        query = query.where('lastEngagementDate', '>=', weekAgo);
      }

      const snapshot = await query.get();
      const leaderboard: LeaderboardEntry[] = snapshot.docs.map((doc, idx) => {
        const data = doc.data() as any;
        return {
          userId: data.userId,
          username: data.username || 'Anonymous',
          rank: idx + 1,
          totalPoints: data.totalPoints,
          weeklyPoints: scope === 'weekly' ? data.weeklyPoints : undefined,
          achievements: data.achievementCount,
          streakDays: data.totalStreakDays,
          lastActivityDate: data.lastEngagementDate,
        };
      });

      this.leaderboardCache.set(cacheKey, leaderboard);
      return leaderboard;
    } catch (error) {
      logSecurityEvent('LEADERBOARD_FETCH_FAILED' as any, 'error' as any, `Failed to fetch leaderboard`, { scope });
      throw error;
    }
  }

  public async updateStreak(userId: string, concept: string): Promise<StreakData> {
    try {
      const streakId = `streak-${userId}-${concept}`;
      const streakDoc = await this.db.collection('streaks').doc(streakId).get();

      let streak: StreakData;
      const today = new Date().toDateString();
      const lastActivity = streakDoc.exists ? (streakDoc.data() as any).lastActivityDate?.toDate?.().toDateString() : null;

      if (streakDoc.exists && lastActivity === today) {
        return streakDoc.data() as StreakData;
      }

      if (streakDoc.exists && lastActivity === new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()) {
        const existing = streakDoc.data() as StreakData;
        streak = {
          ...existing,
          currentStreak: existing.currentStreak + 1,
          lastActivityDate: new Date(),
          pointsThisStreak: existing.pointsThisStreak + 10,
        };
        if (streak.currentStreak > streak.longestStreak) {
          streak.longestStreak = streak.currentStreak;
        }
      } else {
        streak = {
          userId,
          concept,
          currentStreak: 1,
          longestStreak: streakDoc.exists ? (streakDoc.data() as any).longestStreak : 1,
          lastActivityDate: new Date(),
          streakStartDate: new Date(),
          pointsThisStreak: 10,
        };
      }

      await this.db.collection('streaks').doc(streakId).set(streak);
      await this.awardPoints(userId, 5, 'streak_bonus', { concept });

      return streak;
    } catch (error) {
      logSecurityEvent('STREAK_UPDATE_FAILED' as any, 'error' as any, `Failed to update streak`, { userId, concept });
      throw error;
    }
  }

  public async awardPoints(
    userId: string,
    points: number,
    reason: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const transactionId = `reward-${userId}-${Date.now()}`;
      const transaction: RewardTransaction = {
        transactionId,
        userId,
        points,
        reason: reason as any,
        timestamp: new Date(),
        metadata,
      };

      await this.db.collection('reward_transactions').doc(transactionId).set(transaction);

      const profileRef = this.db.collection('user_engagement_profiles').doc(userId);
      await profileRef.update({
        totalPoints: (await profileRef.get()).data()?.totalPoints + points || points,
        lastEngagementDate: new Date(),
      });

      logSecurityEvent('POINTS_AWARDED' as any, 'info' as any, `Points awarded to user`, { userId, points });
    } catch (error) {
      logSecurityEvent('POINTS_AWARD_FAILED' as any, 'error' as any, `Failed to award points`, { userId });
      throw error;
    }
  }

  public async getEngagementProfile(userId: string): Promise<UserEngagementProfile> {
    try {
      const profileDoc = await this.db.collection('user_engagement_profiles').doc(userId).get();

      if (!profileDoc.exists) {
        const newProfile: UserEngagementProfile = {
          userId,
          totalPoints: 0,
          achievementCount: 0,
          currentLevel: 1,
          nextLevelThreshold: 1000,
          totalStreakDays: 0,
          engagementScore: 0,
          badges: [],
          lastEngagementDate: new Date(),
        };
        await this.db.collection('user_engagement_profiles').doc(userId).set(newProfile);
        return newProfile;
      }

      const profileData = profileDoc.data() as UserEngagementProfile;
      const achievementsSnapshot = await this.db
        .collection('achievements')
        .where('userId', '==', userId)
        .get();

      return {
        ...profileData,
        badges: achievementsSnapshot.docs.map((doc) => doc.data() as Achievement),
      };
    } catch (error) {
      logSecurityEvent('ENGAGEMENT_PROFILE_FETCH_FAILED' as any, 'error' as any, `Failed to fetch engagement profile`, { userId });
      throw error;
    }
  }

  public async checkMilestones(userId: string): Promise<ProgressMilestone[]> {
    try {
      const profileDoc = await this.db.collection('user_engagement_profiles').doc(userId).get();
      const totalPoints = (profileDoc.data() as any)?.totalPoints || 0;
      const milestones: ProgressMilestone[] = [];

      const milestoneThresholds = [100, 500, 1000, 5000, 10000];
      for (const threshold of milestoneThresholds) {
        const milestoneId = `milestone-${userId}-${threshold}`;
        const milestonDoc = await this.db.collection('milestones').doc(milestoneId).get();

        if (!milestonDoc.exists && totalPoints >= threshold) {
          const milestone: ProgressMilestone = {
            milestoneId,
            userId,
            type: 'total_points',
            threshold,
            currentValue: totalPoints,
            reachedAt: new Date(),
            rewardPoints: Math.floor(threshold / 10),
          };
          await this.db.collection('milestones').doc(milestoneId).set(milestone);
          milestones.push(milestone);
        }
      }

      return milestones;
    } catch (error) {
      logSecurityEvent('MILESTONE_CHECK_FAILED' as any, 'error' as any, `Failed to check milestones`, { userId });
      throw error;
    }
  }

  private getBadgeIcon(badgeType: string): string {
    const icons: Record<string, string> = {
      milestone: '🏁',
      streak: '🔥',
      mastery: '⭐',
      social: '👥',
      time_based: '⏰',
    };
    return icons[badgeType] || '🏆';
  }

  private calculateRarity(points: number): 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' {
    if (points >= 500) return 'legendary';
    if (points >= 250) return 'epic';
    if (points >= 100) return 'rare';
    if (points >= 50) return 'uncommon';
    return 'common';
  }

  private scheduleLeaderboardUpdate(): void {
    setInterval(() => {
      this.leaderboardCache.clear();
    }, 60000);
  }
}

export const gamificationEngagementService = new GamificationEngagementService();
