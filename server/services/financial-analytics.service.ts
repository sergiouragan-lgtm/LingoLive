import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface RevenueMetrics {
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  grossRevenue: number;
  netRevenue: number;
  revenueGrowth: number; // percentage
  churnRate: number; // percentage
}

export interface CohortMetrics {
  cohortMonth: string;
  cohortSize: number;
  monthZeroRevenue: number;
  monthZeroRetention: number;
  lifetimeValue: number;
}

export interface CustomerAcquisitionCost {
  month: string;
  totalAcquisitionCost: number;
  newCustomers: number;
  cacPerCustomer: number;
  cacPaybackMonths: number;
}

export interface SubscriptionAnalytics {
  totalActive: number;
  activeByPlan: Record<string, number>;
  totalMonthlyRevenue: number;
  revenueByPlan: Record<string, number>;
  avgRevenuePerUser: number;
}

class FinancialAnalyticsService {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = getFirestore();
  }

  public async calculateRevenueMetrics(month?: Date): Promise<RevenueMetrics> {
    try {
      const date = month || new Date();
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const subscriptions = await this.db
        .collection('subscriptions')
        .where('status', '==', 'active')
        .get();

      const payments = await this.db
        .collection('payments')
        .where('timestamp', '>=', monthStart)
        .where('timestamp', '<=', monthEnd)
        .where('status', '==', 'completed')
        .get();

      // Calculate MRR from active subscriptions
      const mrr = subscriptions.docs.reduce((sum, doc) => {
        const monthlyPrice = this.getMonthlyPrice(doc.data().tier || 'free');
        return sum + monthlyPrice;
      }, 0);

      const arr = mrr * 12;

      const grossRevenue = payments.docs.reduce((sum, doc) => {
        return sum + (doc.data().amount || 0);
      }, 0);

      const netRevenue = grossRevenue * 0.85; // Assuming 15% processing fees

      // Calculate month-over-month growth
      const lastMonthStart = new Date(
        date.getFullYear(),
        date.getMonth() - 1,
        1
      );
      const lastMonthEnd = new Date(date.getFullYear(), date.getMonth(), 0);

      const lastMonthPayments = await this.db
        .collection('payments')
        .where('timestamp', '>=', lastMonthStart)
        .where('timestamp', '<=', lastMonthEnd)
        .where('status', '==', 'completed')
        .get();

      const lastMonthRevenue = lastMonthPayments.docs.reduce((sum, doc) => {
        return sum + (doc.data().amount || 0);
      }, 0);

      const revenueGrowth =
        lastMonthRevenue > 0
          ? ((grossRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
          : 0;

      // Calculate churn rate
      const activeSubscriptions = subscriptions.size;
      const cancelledThisMonth = await this.db
        .collection('subscriptions')
        .where('status', '==', 'cancelled')
        .where('cancelledAt', '>=', monthStart)
        .where('cancelledAt', '<=', monthEnd)
        .get();

      const churnRate =
        activeSubscriptions > 0
          ? (cancelledThisMonth.size / activeSubscriptions) * 100
          : 0;

      return {
        mrr,
        arr,
        grossRevenue,
        netRevenue,
        revenueGrowth,
        churnRate,
      };
    } catch (error: any) {
      console.error('Error calculating revenue metrics:', error);
      throw error;
    }
  }

  public async getCohortAnalysis(cohortMonth: string): Promise<CohortMetrics> {
    try {
      const snapshot = await this.db
        .collection('cohorts')
        .doc(cohortMonth)
        .get();

      if (!snapshot.exists) {
        return {
          cohortMonth,
          cohortSize: 0,
          monthZeroRevenue: 0,
          monthZeroRetention: 0,
          lifetimeValue: 0,
        };
      }

      const data = snapshot.data() as any;

      return {
        cohortMonth,
        cohortSize: data.cohortSize || 0,
        monthZeroRevenue: data.monthZeroRevenue || 0,
        monthZeroRetention: data.monthZeroRetention || 0,
        lifetimeValue: data.lifetimeValue || 0,
      };
    } catch (error: any) {
      console.error('Error analyzing cohort:', error);
      return {
        cohortMonth,
        cohortSize: 0,
        monthZeroRevenue: 0,
        monthZeroRetention: 0,
        lifetimeValue: 0,
      };
    }
  }

  public async calculateCustomerAcquisitionCost(month: Date): Promise<CustomerAcquisitionCost> {
    try {
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      const marketingExpenses = await this.db
        .collection('marketing_expenses')
        .where('timestamp', '>=', monthStart)
        .where('timestamp', '<=', monthEnd)
        .get();

      const totalAcquisitionCost = marketingExpenses.docs.reduce((sum, doc) => {
        return sum + (doc.data().amount || 0);
      }, 0);

      const newSubscriptions = await this.db
        .collection('subscriptions')
        .where('createdAt', '>=', monthStart)
        .where('createdAt', '<=', monthEnd)
        .get();

      const newCustomers = newSubscriptions.size;
      const cacPerCustomer = newCustomers > 0 ? totalAcquisitionCost / newCustomers : 0;

      // Calculate payback months
      const avgMonthlyRevenue = newSubscriptions.docs.reduce((sum, doc) => {
        const monthlyPrice = this.getMonthlyPrice(doc.data().tier || 'free');
        return sum + monthlyPrice;
      }, 0) / Math.max(1, newCustomers);

      const cacPaybackMonths =
        avgMonthlyRevenue > 0 ? cacPerCustomer / avgMonthlyRevenue : 0;

      return {
        month: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`,
        totalAcquisitionCost,
        newCustomers,
        cacPerCustomer,
        cacPaybackMonths,
      };
    } catch (error: any) {
      console.error('Error calculating CAC:', error);
      throw error;
    }
  }

  public async getSubscriptionAnalytics(): Promise<SubscriptionAnalytics> {
    try {
      const subscriptions = await this.db
        .collection('subscriptions')
        .where('status', '==', 'active')
        .get();

      const totalActive = subscriptions.size;
      const activeByPlan: Record<string, number> = {};
      const revenueByPlan: Record<string, number> = {};

      subscriptions.docs.forEach((doc) => {
        const tier = doc.data().tier || 'free';
        activeByPlan[tier] = (activeByPlan[tier] || 0) + 1;
        const monthlyPrice = this.getMonthlyPrice(tier);
        revenueByPlan[tier] = (revenueByPlan[tier] || 0) + monthlyPrice;
      });

      const totalMonthlyRevenue = Object.values(revenueByPlan).reduce((a, b) => a + b, 0);
      const avgRevenuePerUser = totalActive > 0 ? totalMonthlyRevenue / totalActive : 0;

      return {
        totalActive,
        activeByPlan,
        totalMonthlyRevenue,
        revenueByPlan,
        avgRevenuePerUser,
      };
    } catch (error: any) {
      console.error('Error getting subscription analytics:', error);
      return {
        totalActive: 0,
        activeByPlan: {},
        totalMonthlyRevenue: 0,
        revenueByPlan: {},
        avgRevenuePerUser: 0,
      };
    }
  }

  public async getLifetimeValueMetrics(): Promise<{
    avgLTV: number;
    medianLTV: number;
    ltvByPlan: Record<string, number>;
  }> {
    try {
      const metrics = await this.db
        .collection('engagement_metrics')
        .get();

      const ltvValues = metrics.docs.map((doc) => doc.data().estimatedLTV || 0);

      if (ltvValues.length === 0) {
        return {
          avgLTV: 0,
          medianLTV: 0,
          ltvByPlan: {},
        };
      }

      const avgLTV = ltvValues.reduce((a, b) => a + b, 0) / ltvValues.length;
      const sortedLTV = ltvValues.sort((a, b) => a - b);
      const medianLTV =
        sortedLTV.length % 2 === 0
          ? (sortedLTV[sortedLTV.length / 2 - 1] + sortedLTV[sortedLTV.length / 2]) / 2
          : sortedLTV[Math.floor(sortedLTV.length / 2)];

      const ltvByPlan: Record<string, number> = {};
      const subscriptions = await this.db
        .collection('subscriptions')
        .where('status', '==', 'active')
        .get();

      subscriptions.docs.forEach((doc) => {
        const plan = doc.data().tier || 'free';
        const ltv = doc.data().estimatedLTV || 0;
        ltvByPlan[plan] = (ltvByPlan[plan] || 0) + ltv;
      });

      return {
        avgLTV,
        medianLTV,
        ltvByPlan,
      };
    } catch (error: any) {
      console.error('Error getting LTV metrics:', error);
      return {
        avgLTV: 0,
        medianLTV: 0,
        ltvByPlan: {},
      };
    }
  }

  public async trackFinancialEvent(
    eventType: string,
    userId: string,
    amount: number,
    details: Record<string, any>
  ): Promise<void> {
    try {
      await this.db
        .collection('financial_events')
        .add({
          eventType,
          userId,
          amount,
          details,
          timestamp: new Date(),
        });

      logSecurityEvent(
        'FINANCIAL_EVENT' as any,
        'info' as any,
        `Financial event: ${eventType}`,
        { userId, amount },
        details
      );
    } catch (error: any) {
      console.error('Error tracking financial event:', error);
    }
  }

  private getMonthlyPrice(tier: string): number {
    const prices: Record<string, number> = {
      free: 0,
      starter: 9.99,
      professional: 29.99,
      enterprise: 99.99,
    };
    return prices[tier] || 0;
  }
}

export const financialAnalyticsService = new FinancialAnalyticsService();
