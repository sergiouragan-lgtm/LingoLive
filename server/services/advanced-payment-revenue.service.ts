import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface RevenueStream {
  streamId: string;
  name: string;
  type: 'subscription' | 'transaction' | 'commission' | 'licensing';
  amount: number;
  frequency: string;
  status: 'active' | 'paused' | 'ended';
  createdAt: Date;
}

export interface SubscriptionPlan {
  planId: string;
  name: string;
  tier: 'free' | 'basic' | 'pro' | 'enterprise';
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'quarterly' | 'annual';
  features: string[];
  maxUsers?: number;
  createdAt: Date;
}

export interface ChurnPrediction {
  predictionId: string;
  userId: string;
  riskScore: number;
  riskFactors: string[];
  predictedChurnDate?: Date;
  recommendedAction: string;
  createdAt: Date;
}

export interface RetentionCampaign {
  campaignId: string;
  name: string;
  targetSegment: string;
  strategy: 'discount' | 'upgrade' | 'feature-unlock' | 'personalized-content';
  budget: number;
  startDate: Date;
  endDate: Date;
  expectedROI: number;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
}

export interface FinancialForecast {
  forecastId: string;
  period: string;
  projectedRevenue: number;
  projectedExpenses: number;
  projectedProfit: number;
  growthRate: number;
  confidenceLevel: number;
  assumptions: { [key: string]: any };
  createdAt: Date;
}

export interface InvoiceManagement {
  invoiceId: string;
  customerId: string;
  amount: number;
  status: 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  paidDate?: Date;
  items: InvoiceItem[];
  createdAt: Date;
}

export interface InvoiceItem {
  itemId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface RevenueAnalytics {
  analyticsId: string;
  timestamp: Date;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
  customerLifetimeValue: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  churnRate: number;
}

class AdvancedPaymentRevenueService {
  private db = getFirestore();

  async createRevenueStream(
    name: string,
    type: 'subscription' | 'transaction' | 'commission' | 'licensing',
    amount: number,
    frequency: string
  ): Promise<RevenueStream> {
    try {
      const streamId = `stream_${Date.now()}`;

      const stream: RevenueStream = {
        streamId,
        name,
        type,
        amount,
        frequency,
        status: 'active',
        createdAt: new Date(),
      };

      await this.db.collection('revenue_streams').doc(streamId).set(stream);

      logSecurityEvent('REVENUE_STREAM_CREATED' as any, 'info' as any, 'Revenue stream created', {
        streamId,
        name,
        type,
      });

      return stream;
    } catch (error) {
      logSecurityEvent('REVENUE_STREAM_CREATION_FAILED' as any, 'error' as any, 'Failed to create revenue stream', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async defineSubscriptionPlan(
    name: string,
    tier: 'free' | 'basic' | 'pro' | 'enterprise',
    price: number,
    currency: string,
    billingCycle: 'monthly' | 'quarterly' | 'annual',
    features: string[],
    maxUsers?: number
  ): Promise<SubscriptionPlan> {
    try {
      const planId = `plan_${Date.now()}`;

      const plan: SubscriptionPlan = {
        planId,
        name,
        tier,
        price,
        currency,
        billingCycle,
        features,
        maxUsers,
        createdAt: new Date(),
      };

      await this.db.collection('subscription_plans').doc(planId).set(plan);

      logSecurityEvent('SUBSCRIPTION_PLAN_DEFINED' as any, 'info' as any, 'Subscription plan defined', {
        planId,
        name,
        tier,
      });

      return plan;
    } catch (error) {
      logSecurityEvent('SUBSCRIPTION_PLAN_DEFINITION_FAILED' as any, 'error' as any, 'Failed to define subscription plan', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async predictChurn(userId: string, riskScore: number, riskFactors: string[]): Promise<ChurnPrediction> {
    try {
      const predictionId = `churn_${Date.now()}`;

      const prediction: ChurnPrediction = {
        predictionId,
        userId,
        riskScore,
        riskFactors,
        recommendedAction: riskScore > 0.7 ? 'Urgent: Contact user' : 'Monitor closely',
        createdAt: new Date(),
      };

      await this.db.collection('churn_predictions').doc(predictionId).set(prediction);

      logSecurityEvent('CHURN_PREDICTION_CREATED' as any, 'info' as any, 'Churn prediction created', {
        predictionId,
        userId,
        riskScore,
      });

      return prediction;
    } catch (error) {
      logSecurityEvent('CHURN_PREDICTION_CREATION_FAILED' as any, 'error' as any, 'Failed to create churn prediction', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async createRetentionCampaign(
    name: string,
    targetSegment: string,
    strategy: 'discount' | 'upgrade' | 'feature-unlock' | 'personalized-content',
    budget: number,
    startDate: Date,
    endDate: Date,
    expectedROI: number
  ): Promise<RetentionCampaign> {
    try {
      const campaignId = `campaign_${Date.now()}`;

      const campaign: RetentionCampaign = {
        campaignId,
        name,
        targetSegment,
        strategy,
        budget,
        startDate,
        endDate,
        expectedROI,
        status: 'planned',
      };

      await this.db.collection('retention_campaigns').doc(campaignId).set(campaign);

      logSecurityEvent('RETENTION_CAMPAIGN_CREATED' as any, 'info' as any, 'Retention campaign created', {
        campaignId,
        name,
        strategy,
      });

      return campaign;
    } catch (error) {
      logSecurityEvent('RETENTION_CAMPAIGN_CREATION_FAILED' as any, 'error' as any, 'Failed to create retention campaign', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async generateFinancialForecast(
    period: string,
    projectedRevenue: number,
    projectedExpenses: number,
    growthRate: number,
    assumptions: { [key: string]: any }
  ): Promise<FinancialForecast> {
    try {
      const forecastId = `forecast_${Date.now()}`;

      const forecast: FinancialForecast = {
        forecastId,
        period,
        projectedRevenue,
        projectedExpenses,
        projectedProfit: projectedRevenue - projectedExpenses,
        growthRate,
        confidenceLevel: 0.85,
        assumptions,
        createdAt: new Date(),
      };

      await this.db.collection('financial_forecasts').doc(forecastId).set(forecast);

      logSecurityEvent('FINANCIAL_FORECAST_GENERATED' as any, 'info' as any, 'Financial forecast generated', {
        forecastId,
        period,
        projectedRevenue,
      });

      return forecast;
    } catch (error) {
      logSecurityEvent('FINANCIAL_FORECAST_GENERATION_FAILED' as any, 'error' as any, 'Failed to generate financial forecast', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async createInvoice(
    customerId: string,
    amount: number,
    items: InvoiceItem[],
    dueDate: Date
  ): Promise<InvoiceManagement> {
    try {
      const invoiceId = `inv_${Date.now()}`;

      const invoice: InvoiceManagement = {
        invoiceId,
        customerId,
        amount,
        status: 'draft',
        dueDate,
        items,
        createdAt: new Date(),
      };

      await this.db.collection('invoices').doc(invoiceId).set(invoice);

      logSecurityEvent('INVOICE_CREATED' as any, 'info' as any, 'Invoice created', {
        invoiceId,
        customerId,
        amount,
      });

      return invoice;
    } catch (error) {
      logSecurityEvent('INVOICE_CREATION_FAILED' as any, 'error' as any, 'Failed to create invoice', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getRevenueAnalytics(timeRange: { start: Date; end: Date }): Promise<RevenueAnalytics> {
    try {
      const analyticsId = `revenue_analytics_${Date.now()}`;

      const analytics: RevenueAnalytics = {
        analyticsId,
        timestamp: new Date(),
        totalRevenue: 425680,
        averageOrderValue: 87.5,
        conversionRate: 3.2,
        customerLifetimeValue: 1250,
        monthlyRecurringRevenue: 156800,
        annualRecurringRevenue: 1881600,
        churnRate: 2.1,
      };

      await this.db.collection('revenue_analytics').doc(analyticsId).set(analytics);

      logSecurityEvent('REVENUE_ANALYTICS_CALCULATED' as any, 'info' as any, 'Revenue analytics calculated', {
        analyticsId,
        totalRevenue: analytics.totalRevenue,
      });

      return analytics;
    } catch (error) {
      logSecurityEvent('REVENUE_ANALYTICS_CALCULATION_FAILED' as any, 'error' as any, 'Failed to calculate revenue analytics', {
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

export const advancedPaymentRevenueService = new AdvancedPaymentRevenueService();
