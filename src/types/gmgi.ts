export interface MarketingCampaign {
  id: string;
  name: string;
  channel: string;
  targetAudience: string;
  budget: number;
  status: 'active' | 'draft' | 'completed';
}

export interface CustomerSegment {
  id: string;
  type: 'student' | 'school' | 'enterprise';
  behavior: string;
  preferences: string[];
}

export interface GrowthExperiment {
  id: string;
  hypothesis: string;
  winner: 'variantA' | 'variantB' | 'none';
  status: 'running' | 'completed';
}
