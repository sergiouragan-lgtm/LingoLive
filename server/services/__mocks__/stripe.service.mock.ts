/**
 * Mock Stripe Service
 * Used in integration tests to simulate Stripe API without real calls
 */

import { vi } from "vitest";
import { SERVER_PLANS } from "../../config/plans";

export const createMockStripeService = () => {
  return {
    createCheckoutSession: vi.fn(async (userId: string, planId: string) => {
      const plan = SERVER_PLANS[planId];
      if (!plan) {
        throw new Error("Plano de subscrição inválido.");
      }
      return {
        id: `cs_mock_${Date.now()}`,
        client_secret: `secret_${Date.now()}`,
        url: `https://stripe.mock/checkout/${planId}`,
        payment_intent: `pi_mock_${Date.now()}`,
        customer: `cus_mock_${Date.now()}`,
      };
    }),

    verifyWebhookSignature: vi.fn(async () => true),

    handleWebhookEvent: vi.fn(async (event: any) => {
      return {
        received: true,
        id: event.id,
      };
    }),

    getCustomerInfo: vi.fn(async (customerId: string) => ({
      id: customerId,
      email: "test@example.com",
      created: Date.now() / 1000,
    })),

    getSubscriptionInfo: vi.fn(async (subscriptionId: string) => ({
      id: subscriptionId,
      status: "active",
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
    })),

    cancelSubscription: vi.fn(async (subscriptionId: string) => ({
      id: subscriptionId,
      status: "canceled",
      canceled_at: Math.floor(Date.now() / 1000),
    })),

    createRefund: vi.fn(async (paymentIntentId: string, amount?: number) => ({
      id: `re_mock_${Date.now()}`,
      payment_intent: paymentIntentId,
      amount: amount || 100,
      status: "succeeded",
    })),
  };
};
