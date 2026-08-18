export interface MarketplaceItem {
  id: string;
  type: 'course' | 'program' | 'certification';
  creatorId: string;
  title: string;
  category: string;
  language: string;
  price: number;
  rating: number;
  status: 'active' | 'draft' | 'archived';
}

export interface Partner {
  id: string;
  organization: string;
  verificationStatus: 'unverified' | 'verified' | 'premium';
  revenueShare: number;
}

export interface Transaction {
  id: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  commission: number;
}
