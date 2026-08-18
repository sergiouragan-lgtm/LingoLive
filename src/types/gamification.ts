export interface AvatarEquipment {
  base: string; // 'neutral', 'explorer', 'scholar', 'wizard', 'champion'
  accessory?: string; // 'none', 'glasses', 'headphones', 'crown', 'cap'
  background?: string; // 'slate', 'cosmic', 'sunset', 'emerald', 'royal'
  title?: string; // 'Iniciante', 'Poliglota', 'Mestre de Voz', 'Lenda'
}

export interface UserGamificationState {
  userId: string;
  xp: number;
  level: number;
  coins: number;
  streak: number;
  lastActiveDate: string | null; // YYYY-MM-DD
  avatar: AvatarEquipment;
  inventory: string[]; // List of itemIds bought from the store
  badges: string[]; // List of badgeIds unlocked
  completedChallenges: string[]; // List of challengeIds completed today/this week
  achievementsProgress: { [key: string]: number }; // achievementId -> currentProgress
  league: 'bronze' | 'silver' | 'gold' | 'diamond';
}

export interface BadgeRule {
  id: string;
  name: string;
  description: string;
  iconName: string; // Lucide icon identifier
  color: string; // Tailwind class colors
  criteriaType: 'streak' | 'xp' | 'quiz' | 'pronunciation' | 'exams' | 'coins';
  requiredValue: number;
}

export interface GamificationAchievement {
  id: string;
  name: string;
  description: string;
  iconName: string;
  category: 'learning' | 'social' | 'consistency' | 'performance';
  targetValue: number;
  rewardXp: number;
  rewardCoins: number;
}

export interface GamificationChallenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly';
  targetValue: number;
  currentValue: number;
  metric: 'xp' | 'coins' | 'practice' | 'quiz' | 'pronunciation' | 'streak';
  rewardXp: number;
  rewardCoins: number;
  completed: boolean;
}

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  category: 'avatar_skin' | 'avatar_accessory' | 'avatar_bg' | 'title' | 'booster' | 'streak_freeze';
  iconName: string;
  unlockedAtXp?: number;
}

export interface LeaderboardUser {
  userId: string;
  name: string;
  level: number;
  xpThisWeek: number;
  totalXp: number;
  streak: number;
  avatar: AvatarEquipment;
  rank: number;
  isCurrentUser?: boolean;
}
