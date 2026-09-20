import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export type SubscriptionTier = 'free' | 'pro' | 'premium';

export interface Subscription {
  userId: string;
  tier: SubscriptionTier;
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
  status: 'active' | 'cancelled' | 'past_due' | 'expired';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PricingPlan {
  tier: SubscriptionTier;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
}

class PaymentService {
  private db: Firestore;
  private pricingPlans: Map<SubscriptionTier, PricingPlan> = new Map();

  constructor() {
    this.db = getFirestore();
    this.initializePricingPlans();
  }

  private initializePricingPlans(): void {
    this.pricingPlans.set('free', {
      tier: 'free',
      name: 'Free',
      price: 0,
      currency: 'USD',
      interval: 'month',
      features: [
        '5 lessons per month',
        'Basic vocabulary learning',
        'Community forums',
        'Mobile app access',
      ],
    });

    this.pricingPlans.set('pro', {
      tier: 'pro',
      name: 'Pro',
      price: 9.99,
      currency: 'USD',
      interval: 'month',
      features: [
        'Unlimited lessons',
        'Advanced vocabulary library',
        'AI-powered tutoring',
        'Offline downloads',
        'Progress tracking',
        'Priority support',
      ],
    });

    this.pricingPlans.set('premium', {
      tier: 'premium',
      name: 'Premium',
      price: 24.99,
      currency: 'USD',
      interval: 'month',
      features: [
        'Everything in Pro',
        'Live group classes',
        'One-on-one tutoring',
        'Custom learning paths',
        'Certification programs',
        'Corporate training options',
      ],
    });
  }

  public async createSubscription(
    userId: string,
    tier: SubscriptionTier,
    stripeCustomerId: string,
    stripeSubscriptionId?: string
  ): Promise<Subscription> {
    try {
      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const subscription: Subscription = {
        userId,
        tier,
        stripeCustomerId,
        stripeSubscriptionId,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: endOfMonth,
        createdAt: now,
        updatedAt: now,
      };

      await this.db.collection('subscriptions').doc(userId).set(subscription);

      logSecurityEvent(
        'SUBSCRIPTION_CREATED' as any,
        'info' as any,
        `Subscription created for user ${userId}: ${tier}`,
        { userId },
        { tier, stripeSubscriptionId }
      );

      return subscription;
    } catch (error: any) {
      logSecurityEvent(
        'SUBSCRIPTION_CREATE_FAILED' as any,
        'warning' as any,
        `Failed to create subscription: ${error.message}`,
        { userId },
        { error: error.message }
      );
      throw error;
    }
  }

  public async updateSubscription(userId: string, tier: SubscriptionTier): Promise<Subscription> {
    try {
      const doc = await this.db.collection('subscriptions').doc(userId).get();

      if (!doc.exists) {
        throw new Error('Subscription not found');
      }

      const subscription = doc.data() as Subscription;
      subscription.tier = tier;
      subscription.updatedAt = new Date();

      await this.db.collection('subscriptions').doc(userId).update(subscription);

      logSecurityEvent(
        'SUBSCRIPTION_UPDATED' as any,
        'info' as any,
        `Subscription updated for user ${userId} to tier: ${tier}`,
        { userId },
        { tier }
      );

      return subscription;
    } catch (error: any) {
      logSecurityEvent(
        'SUBSCRIPTION_UPDATE_FAILED' as any,
        'warning' as any,
        `Failed to update subscription: ${error.message}`,
        { userId },
        { error: error.message }
      );
      throw error;
    }
  }

  public async cancelSubscription(userId: string): Promise<void> {
    try {
      const now = new Date();

      await this.db.collection('subscriptions').doc(userId).update({
        status: 'cancelled',
        cancelledAt: now,
        updatedAt: now,
      });

      logSecurityEvent(
        'SUBSCRIPTION_CANCELLED' as any,
        'warning' as any,
        `Subscription cancelled for user ${userId}`,
        { userId },
        {}
      );
    } catch (error: any) {
      logSecurityEvent(
        'SUBSCRIPTION_CANCEL_FAILED' as any,
        'warning' as any,
        `Failed to cancel subscription: ${error.message}`,
        { userId },
        { error: error.message }
      );
      throw error;
    }
  }

  public async getSubscription(userId: string): Promise<Subscription | null> {
    try {
      const doc = await this.db.collection('subscriptions').doc(userId).get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data() as any;
      return {
        ...data,
        currentPeriodStart: data.currentPeriodStart?.toDate() || new Date(),
        currentPeriodEnd: data.currentPeriodEnd?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        cancelledAt: data.cancelledAt?.toDate(),
      };
    } catch (error: any) {
      logSecurityEvent(
        'SUBSCRIPTION_FETCH_FAILED' as any,
        'warning' as any,
        `Failed to fetch subscription: ${error.message}`,
        { userId },
        { error: error.message }
      );
      return null;
    }
  }

  public async getUserTier(userId: string): Promise<SubscriptionTier> {
    try {
      const subscription = await this.getSubscription(userId);
      return subscription?.status === 'active' ? subscription.tier : 'free';
    } catch {
      return 'free';
    }
  }

  public getPricingPlan(tier: SubscriptionTier): PricingPlan | undefined {
    return this.pricingPlans.get(tier);
  }

  public getAllPricingPlans(): PricingPlan[] {
    return Array.from(this.pricingPlans.values());
  }

  public async logPayment(
    userId: string,
    amount: number,
    currency: string,
    status: 'success' | 'failed',
    tier: SubscriptionTier
  ): Promise<void> {
    try {
      await this.db.collection('payment_history').doc().set({
        userId,
        amount,
        currency,
        status,
        tier,
        timestamp: new Date(),
      });

      logSecurityEvent(
        'PAYMENT_PROCESSED' as any,
        'info' as any,
        `Payment ${status} for user ${userId}: ${amount} ${currency}`,
        { userId },
        { amount, tier, status }
      );
    } catch (error: any) {
      console.error('Error logging payment:', error);
    }
  }

  public async getPaymentHistory(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const snapshot = await this.db
        .collection('payment_history')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => ({
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
      }));
    } catch (error: any) {
      console.error('Error fetching payment history:', error);
      return [];
    }
  }
}

export const paymentService = new PaymentService();
