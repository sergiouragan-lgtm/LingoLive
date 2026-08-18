export interface Subscription {
  id: string;
  userId: string;
  plan: 'free' | 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'canceled' | 'expired';
  billingCycle: 'monthly' | 'annually';
  nextPayment: string;
}

export interface Transaction {
  id: string;
  payerId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface RevenueShare {
  id: string;
  transactionId: string;
  recipientId: string;
  amount: number;
  status: 'pending' | 'paid';
}

export interface FinancialReport {
  period: string;
  revenue: number;
  costs: number;
  profit: number;
}
