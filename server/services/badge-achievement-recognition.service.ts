import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface Badge {
  badgeId: string;
  badgeName: string;
  badgeType: 'achievement' | 'milestone' | 'skill' | 'participation' | 'excellence';
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  requirements: BadgeRequirement[];
  pointValue: number;
  createdAt: Date;
}

export interface BadgeRequirement {
  requirementId: string;
  requirementType: 'assessment-score' | 'completion-count' | 'streak' | 'time-spent' | 'participation';
  threshold: number;
  criteria: string;
}

export interface UserBadge {
  userBadgeId: string;
  userId: string;
  badgeId: string;
  badgeName: string;
  earnedAt: Date;
  evidenceData: Record<string, any>;
  verificationStatus: 'pending' | 'verified' | 'revoked';
  displayOrder: number;
}

export interface BadgeProgress {
  progressId: string;
  userId: string;
  badgeId: string;
  badgeName: string;
  currentProgress: number;
  targetProgress: number;
  progressPercentage: number;
  estimatedEarnDate?: Date;
  lastUpdated: Date;
}

export interface BadgeLeaderboard {
  leaderboardId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'alltime';
  rankings: LeaderboardEntry[];
  generatedAt: Date;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  badgeCount: number;
  totalPoints: number;
  raretyScore: number;
}

class BadgeAchievementRecognitionService {
  private db = getFirestore();

  async createBadge(
    badgeName: string,
    badgeType: 'achievement' | 'milestone' | 'skill' | 'participation' | 'excellence',
    description: string,
    icon: string,
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary',
    requirements: BadgeRequirement[],
    pointValue: number
  ): Promise<Badge> {
    try {
      const badgeId = `badge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const badge: Badge = {
        badgeId,
        badgeName,
        badgeType,
        description,
        icon,
        rarity,
        requirements,
        pointValue,
        createdAt: new Date(),
      };

      await this.db.collection('badges').doc(badgeId).set(badge);

      logSecurityEvent('BADGE_CREATED' as any, 'info' as any, 'Badge created', {
        badgeId,
        badgeName,
        badgeType,
      });

      return badge;
    } catch (error) {
      logSecurityEvent('BADGE_CREATION_FAILED' as any, 'error' as any, 'Failed to create badge', {
        badgeName,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async awardBadgeToUser(userId: string, badgeId: string, evidenceData: Record<string, any>): Promise<UserBadge> {
    try {
      const badgeDoc = await this.db.collection('badges').doc(badgeId).get();
      const badge = badgeDoc.data() as Badge;

      if (!badge) throw new Error('Badge not found');

      const userBadgeId = `user_badge_${userId}_${badgeId}_${Date.now()}`;

      const userBadge: UserBadge = {
        userBadgeId,
        userId,
        badgeId,
        badgeName: badge.badgeName,
        earnedAt: new Date(),
        evidenceData,
        verificationStatus: 'verified',
        displayOrder: 0,
      };

      await this.db.collection('user_badges').doc(userBadgeId).set(userBadge);

      // Update user's badge count and total points
      await this.db
        .collection('users')
        .doc(userId)
        .update({
          badgeCount: (await this.db.collection('user_badges').where('userId', '==', userId).get()).size + 1,
          totalBadgePoints: (await this.getTotalBadgePoints(userId)) + badge.pointValue,
        });

      logSecurityEvent('BADGE_AWARDED' as any, 'info' as any, 'Badge awarded to user', {
        userId,
        badgeId,
        badgeName: badge.badgeName,
      });

      return userBadge;
    } catch (error) {
      logSecurityEvent('BADGE_AWARD_FAILED' as any, 'error' as any, 'Failed to award badge', {
        userId,
        badgeId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async trackBadgeProgress(userId: string, badgeId: string): Promise<BadgeProgress> {
    try {
      const badgeDoc = await this.db.collection('badges').doc(badgeId).get();
      const badge = badgeDoc.data() as Badge;

      if (!badge) throw new Error('Badge not found');

      const progressId = `progress_${userId}_${badgeId}`;

      // Calculate progress based on user's achievement data
      const currentProgress = await this.calculateBadgeProgress(userId, badge);
      const targetProgress = badge.requirements[0]?.threshold || 100;
      const progressPercentage = (currentProgress / targetProgress) * 100;

      const estimatedEarnDate =
        progressPercentage < 100
          ? new Date(Date.now() + (100 - progressPercentage) * 24 * 60 * 60 * 1000)
          : undefined;

      const progress: BadgeProgress = {
        progressId,
        userId,
        badgeId,
        badgeName: badge.badgeName,
        currentProgress,
        targetProgress,
        progressPercentage,
        estimatedEarnDate,
        lastUpdated: new Date(),
      };

      await this.db.collection('badge_progress').doc(progressId).set(progress);

      logSecurityEvent('PROGRESS_TRACKED' as any, 'info' as any, 'Badge progress tracked', {
        userId,
        badgeId,
        progressPercentage,
      });

      return progress;
    } catch (error) {
      logSecurityEvent('PROGRESS_TRACKING_FAILED' as any, 'error' as any, 'Failed to track progress', {
        userId,
        badgeId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    try {
      const query = await this.db
        .collection('user_badges')
        .where('userId', '==', userId)
        .orderBy('earnedAt', 'desc')
        .get();

      return query.docs.map((doc) => doc.data() as UserBadge);
    } catch (error) {
      logSecurityEvent('BADGE_RETRIEVAL_FAILED' as any, 'error' as any, 'Failed to retrieve user badges', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async generateBadgeLeaderboard(period: 'daily' | 'weekly' | 'monthly' | 'alltime'): Promise<BadgeLeaderboard> {
    try {
      const leaderboardId = `leaderboard_${period}_${Date.now()}`;

      // Get all users with badge data
      const usersQuery = await this.db.collection('users').limit(100).get();

      const rankings: LeaderboardEntry[] = [];

      for (const userDoc of usersQuery.docs) {
        const userData = userDoc.data() as any;
        const badgesQuery = await this.db
          .collection('user_badges')
          .where('userId', '==', userDoc.id)
          .get();

        const badges = badgesQuery.docs.map((doc) => doc.data() as UserBadge);

        const raretyScore = this.calculateRarityScore(badges);

        rankings.push({
          rank: 0,
          userId: userDoc.id,
          userName: userData.displayName || 'Anonymous',
          badgeCount: badges.length,
          totalPoints: userData.totalBadgePoints || 0,
          raretyScore,
        });
      }

      // Sort by total points and rarity
      rankings.sort((a, b) => {
        const pointDiff = b.totalPoints - a.totalPoints;
        if (pointDiff !== 0) return pointDiff;
        return b.raretyScore - a.raretyScore;
      });

      // Assign ranks
      rankings.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      const leaderboard: BadgeLeaderboard = {
        leaderboardId,
        period,
        rankings: rankings.slice(0, 100),
        generatedAt: new Date(),
      };

      await this.db.collection('badge_leaderboards').doc(leaderboardId).set(leaderboard);

      logSecurityEvent('LEADERBOARD_GENERATED' as any, 'info' as any, 'Badge leaderboard generated', {
        period,
        topUserCount: rankings.length,
      });

      return leaderboard;
    } catch (error) {
      logSecurityEvent('LEADERBOARD_GENERATION_FAILED' as any, 'error' as any, 'Failed to generate leaderboard', {
        period,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async revokeBadge(userBadgeId: string, reason: string): Promise<UserBadge> {
    try {
      const userBadgeDoc = await this.db.collection('user_badges').doc(userBadgeId).get();
      const userBadge = userBadgeDoc.data() as UserBadge;

      userBadge.verificationStatus = 'revoked';

      await this.db.collection('user_badges').doc(userBadgeId).update({
        verificationStatus: 'revoked',
      });

      logSecurityEvent('BADGE_REVOKED' as any, 'info' as any, 'Badge revoked', {
        userBadgeId,
        userId: userBadge.userId,
        reason,
      });

      return userBadge;
    } catch (error) {
      logSecurityEvent('BADGE_REVOCATION_FAILED' as any, 'error' as any, 'Failed to revoke badge', {
        userBadgeId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private async calculateBadgeProgress(userId: string, badge: Badge): Promise<number> {
    const firstRequirement = badge.requirements[0];
    if (!firstRequirement) return 0;

    // Simple progress calculation based on requirement type
    switch (firstRequirement.requirementType) {
      case 'assessment-score':
        return 75; // Placeholder
      case 'completion-count':
        return 3; // Placeholder
      case 'streak':
        return 5; // Placeholder
      case 'time-spent':
        return 50; // hours
      case 'participation':
        return 10; // interactions
      default:
        return 0;
    }
  }

  private async getTotalBadgePoints(userId: string): Promise<number> {
    const badgesQuery = await this.db.collection('user_badges').where('userId', '==', userId).get();

    let totalPoints = 0;

    for (const badgeDoc of badgesQuery.docs) {
      const userBadge = badgeDoc.data() as UserBadge;
      const badge = await this.db.collection('badges').doc(userBadge.badgeId).get();

      if (badge.exists) {
        totalPoints += (badge.data() as Badge).pointValue;
      }
    }

    return totalPoints;
  }

  private calculateRarityScore(badges: UserBadge[]): number {
    const rarityWeights = {
      common: 1,
      uncommon: 2,
      rare: 5,
      epic: 10,
      legendary: 25,
    };

    let score = 0;

    badges.forEach((badge) => {
      const rarity = badge.badgeName.toLowerCase().includes('legendary')
        ? 'legendary'
        : badge.badgeName.toLowerCase().includes('epic')
          ? 'epic'
          : badge.badgeName.toLowerCase().includes('rare')
            ? 'rare'
            : badge.badgeName.toLowerCase().includes('uncommon')
              ? 'uncommon'
              : 'common';

      score += rarityWeights[rarity as keyof typeof rarityWeights] || 1;
    });

    return score;
  }
}

export const badgeAchievementRecognitionService = new BadgeAchievementRecognitionService();
