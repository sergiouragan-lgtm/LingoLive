export interface CustomerJourney {
  id: string;
  userId: string;
  stage: 'discovery' | 'onboarding' | 'learning' | 'certified';
  progress: number;
  status: 'active' | 'at-risk' | 'completed';
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  status: 'open' | 'pending' | 'resolved';
  priority: 'low' | 'medium' | 'high';
}

export interface LoyaltyProfile {
  id: string;
  userId: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  nextReward: string;
}
