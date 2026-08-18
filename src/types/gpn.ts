export interface Partner {
  id: string;
  name: string;
  type: 'school' | 'university' | 'company' | 'government';
  country: string;
  status: 'active' | 'inactive';
  certificationLevel: 'registered' | 'verified' | 'certified' | 'strategic';
  createdAt: string;
}

export interface PartnerContract {
  id: string;
  partnerId: string;
  plan: 'basic' | 'pro' | 'strategic';
  revenueShare: number;
  startDate: string;
  endDate?: string;
  status: 'active' | 'expired';
}

export interface PartnerPerformance {
  partnerId: string;
  students: number;
  engagement: number;
  revenue: number;
  qualityScore: number;
  updatedAt: string;
}
