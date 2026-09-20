import Stripe from 'stripe';
import { dbAdmin } from '../config/firebaseAdmin';
import { logger } from '../utils/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export interface SubscriptionPlan {
  id: string;
  name: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  intervalCount: number;
  trialDays?: number;
  features: string[];
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  stripeSubscriptionId: string;
  status: 'active' | 'paused' | 'cancelled' | 'past_due' | 'incomplete';
  billingCycle: 'monthly' | 'yearly';
  currentPeriodStart: number;
  currentPeriodEnd: number;
  nextBillingDate: number;
  pausedAt?: number;
  cancelledAt?: number;
  metadata: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export class SubscriptionManager {
  /**
   * Create a new subscription for a user
   */
  async createSubscription(
    userId: string,
    planId: string,
    stripeCustomerId: string,
    billingCycle: 'monthly' | 'yearly'
  ): Promise<Subscription> {
    try {
      const plan = await this.getPlan(planId);
      if (!plan) {
        throw new Error(`Plan ${planId} not found`);
      }

      const stripePriceId = billingCycle === 'yearly' ? plan.yearlyStripePriceId : plan.monthlyStripePriceId;

      // Create Stripe subscription
      const stripeSubscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: stripePriceId }],
        trial_period_days: plan.trialDays || 0,
        expand: ['latest_invoice.payment_intent'],
        metadata: { userId, planId },
      });

      // Store in Firestore
      const subscription: Subscription = {
        id: `sub_${Date.now()}`,
        userId,
        planId,
        stripeSubscriptionId: stripeSubscription.id,
        status: (stripeSubscription.status as any) || 'active',
        billingCycle,
        currentPeriodStart: stripeSubscription.current_period_start,
        currentPeriodEnd: stripeSubscription.current_period_end,
        nextBillingDate: stripeSubscription.current_period_end,
        metadata: { stripeSubscriptionId: stripeSubscription.id },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await db.collection('subscriptions').doc(subscription.id).set(subscription);

      // Update user document with active subscription
      await db.collection('users').doc(userId).update({
        activeSubscription: {
          planId,
          subscriptionId: subscription.id,
          expiresAt: subscription.nextBillingDate,
          status: subscription.status,
        },
      });

      logger.info(`Subscription created: ${subscription.id} for user ${userId}`);
      return subscription;
    } catch (error) {
      logger.error(`Failed to create subscription for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Pause an active subscription
   */
  async pauseSubscription(subscriptionId: string): Promise<Subscription> {
    try {
      const sub = await this.getSubscription(subscriptionId);
      if (!sub) {
        throw new Error(`Subscription ${subscriptionId} not found`);
      }

      // Pause Stripe subscription
      await stripe.subscriptions.update(sub.stripeSubscriptionId, {
        pause_collection: {
          behavior: 'mark_uncollectible',
        },
      });

      // Update Firestore
      const now = Date.now();
      const updated = {
        ...sub,
        status: 'paused' as const,
        pausedAt: now,
        updatedAt: now,
      };

      await db.collection('subscriptions').doc(subscriptionId).update({
        status: updated.status,
        pausedAt: updated.pausedAt,
        updatedAt: updated.updatedAt,
      });

      logger.info(`Subscription paused: ${subscriptionId}`);
      return updated;
    } catch (error) {
      logger.error(`Failed to pause subscription ${subscriptionId}:`, error);
      throw error;
    }
  }

  /**
   * Resume a paused subscription
   */
  async resumeSubscription(subscriptionId: string): Promise<Subscription> {
    try {
      const sub = await this.getSubscription(subscriptionId);
      if (!sub) {
        throw new Error(`Subscription ${subscriptionId} not found`);
      }

      if (sub.status !== 'paused') {
        throw new Error(`Cannot resume subscription in ${sub.status} status`);
      }

      // Resume Stripe subscription
      await stripe.subscriptions.update(sub.stripeSubscriptionId, {
        pause_collection: {},
      });

      // Update Firestore
      const now = Date.now();
      const updated = {
        ...sub,
        status: 'active' as const,
        pausedAt: undefined,
        updatedAt: now,
      };

      await db.collection('subscriptions').doc(subscriptionId).update({
        status: updated.status,
        pausedAt: null,
        updatedAt: updated.updatedAt,
      });

      logger.info(`Subscription resumed: ${subscriptionId}`);
      return updated;
    } catch (error) {
      logger.error(`Failed to resume subscription ${subscriptionId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel a subscription with optional refund
   */
  async cancelSubscription(
    subscriptionId: string,
    refundReason?: string
  ): Promise<Subscription> {
    try {
      const sub = await this.getSubscription(subscriptionId);
      if (!sub) {
        throw new Error(`Subscription ${subscriptionId} not found`);
      }

      if (sub.status === 'cancelled') {
        throw new Error(`Subscription already cancelled`);
      }

      // Cancel Stripe subscription
      await stripe.subscriptions.del(sub.stripeSubscriptionId);

      // Update Firestore
      const now = Date.now();
      const updated = {
        ...sub,
        status: 'cancelled' as const,
        cancelledAt: now,
        updatedAt: now,
      };

      await db.collection('subscriptions').doc(subscriptionId).update({
        status: updated.status,
        cancelledAt: updated.cancelledAt,
        updatedAt: updated.updatedAt,
        cancelReason: refundReason,
      });

      // Clear active subscription from user
      await db.collection('users').doc(sub.userId).update({
        activeSubscription: null,
      });

      logger.info(`Subscription cancelled: ${subscriptionId}. Reason: ${refundReason}`);
      return updated;
    } catch (error) {
      logger.error(`Failed to cancel subscription ${subscriptionId}:`, error);
      throw error;
    }
  }

  /**
   * Get a single subscription by ID
   */
  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    try {
      const doc = await db.collection('subscriptions').doc(subscriptionId).get();
      return doc.exists ? (doc.data() as Subscription) : null;
    } catch (error) {
      logger.error(`Failed to fetch subscription ${subscriptionId}:`, error);
      return null;
    }
  }

  /**
   * List all subscriptions for a user
   */
  async listSubscriptionsForUser(userId: string): Promise<Subscription[]> {
    try {
      const snapshot = await db
        .collection('subscriptions')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map((doc) => doc.data() as Subscription);
    } catch (error) {
      logger.error(`Failed to list subscriptions for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get the active subscription for a user
   */
  async getActiveSubscription(userId: string): Promise<Subscription | null> {
    try {
      const snapshot = await db
        .collection('subscriptions')
        .where('userId', '==', userId)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      return snapshot.empty ? null : (snapshot.docs[0].data() as Subscription);
    } catch (error) {
      logger.error(`Failed to fetch active subscription for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          await this.syncStripeSubscription(subscription);
          break;
        }
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          await this.syncStripeSubscription(subscription);
          break;
        }
        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          await this.handlePaymentFailed(invoice);
          break;
        }
        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          await this.handlePaymentSucceeded(invoice);
          break;
        }
        default:
          logger.info(`Unhandled Stripe event: ${event.type}`);
      }
    } catch (error) {
      logger.error(`Error handling Stripe webhook:`, error);
      throw error;
    }
  }

  /**
   * Sync Stripe subscription state to Firestore
   */
  private async syncStripeSubscription(stripeSubscription: Stripe.Subscription): Promise<void> {
    try {
      const snapshot = await db
        .collection('subscriptions')
        .where('stripeSubscriptionId', '==', stripeSubscription.id)
        .limit(1)
        .get();

      if (snapshot.empty) {
        logger.warn(`No subscription found for Stripe ID: ${stripeSubscription.id}`);
        return;
      }

      const docId = snapshot.docs[0].id;
      const status = stripeSubscription.status as Subscription['status'];

      await db.collection('subscriptions').doc(docId).update({
        status,
        currentPeriodStart: stripeSubscription.current_period_start,
        currentPeriodEnd: stripeSubscription.current_period_end,
        nextBillingDate: stripeSubscription.current_period_end,
        updatedAt: Date.now(),
      });

      logger.info(`Synced subscription ${docId} status: ${status}`);
    } catch (error) {
      logger.error(`Failed to sync Stripe subscription:`, error);
      throw error;
    }
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    try {
      if (!invoice.subscription) {
        return;
      }

      const subscriptionId = typeof invoice.subscription === 'string'
        ? invoice.subscription
        : invoice.subscription.id;

      const snapshot = await db
        .collection('subscriptions')
        .where('stripeSubscriptionId', '==', subscriptionId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return;
      }

      const docId = snapshot.docs[0].id;
      const doc = snapshot.docs[0].data() as Subscription;

      await db.collection('subscriptions').doc(docId).update({
        status: 'past_due',
        updatedAt: Date.now(),
      });

      // TODO: Send email notification to user about failed payment
      logger.warn(`Payment failed for subscription ${docId}`);
    } catch (error) {
      logger.error(`Failed to handle payment failure:`, error);
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    try {
      if (!invoice.subscription) {
        return;
      }

      const subscriptionId = typeof invoice.subscription === 'string'
        ? invoice.subscription
        : invoice.subscription.id;

      const snapshot = await db
        .collection('subscriptions')
        .where('stripeSubscriptionId', '==', subscriptionId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return;
      }

      const docId = snapshot.docs[0].id;

      await db.collection('subscriptions').doc(docId).update({
        status: 'active',
        updatedAt: Date.now(),
      });

      logger.info(`Payment succeeded for subscription ${docId}`);
    } catch (error) {
      logger.error(`Failed to handle payment success:`, error);
    }
  }

  /**
   * Get a plan configuration (would be stored in Firestore or config)
   */
  private async getPlan(
    planId: string
  ): Promise<any> {
    const plans: Record<string, any> = {
      starter: {
        id: 'starter',
        name: 'Starter',
        monthlyStripePriceId: process.env.STRIPE_PRICE_STARTER_MONTHLY,
        yearlyStripePriceId: process.env.STRIPE_PRICE_STARTER_YEARLY,
        trialDays: 7,
      },
      professional: {
        id: 'professional',
        name: 'Professional',
        monthlyStripePriceId: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY,
        yearlyStripePriceId: process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY,
        trialDays: 14,
      },
      enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        monthlyStripePriceId: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
        yearlyStripePriceId: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY,
        trialDays: 30,
      },
    };

    return plans[planId] || null;
  }
}

export const subscriptionManager = new SubscriptionManager();
