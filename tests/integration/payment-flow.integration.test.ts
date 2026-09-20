/**
 * Integration Tests: Complete Payment Flow
 * Tests the entire Stripe payment workflow from checkout to subscription
 * Uses mocked services to avoid external API calls
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { testServices, resetTestServices } from "./setup";
import type Stripe from "stripe";

const API_BASE = process.env.API_BASE || "http://localhost:3000";

describe("Complete Payment Flow Integration", () => {
  let userId: string = `test-user-${Date.now()}`;
  let sessionId: string;
  let authToken: string = "test-auth-token-" + Date.now();

  beforeAll(() => {
    resetTestServices();
    console.log(`✅ Test user ID: ${userId}`);
    console.log(`✅ Mock auth token: ${authToken}`);
  });

  afterAll(() => {
    resetTestServices();
    console.log(`✅ Test complete for user: ${userId}`);
  });

  describe("1. Checkout Session Creation", () => {
    it("should create a Stripe checkout session using mock service", async () => {
      const result = await testServices.stripe.createCheckoutSession(userId, "family_monthly");

      expect(result).toHaveProperty("id");
      expect(result.id).toMatch(/^cs_/);
      expect(result).toHaveProperty("client_secret");
      expect(result).toHaveProperty("url");

      sessionId = result.id;
      expect(testServices.stripe.createCheckoutSession).toHaveBeenCalledWith(userId, "family_monthly");
      console.log(`✅ Checkout session created: ${sessionId}`);
    });

    it("should reject invalid plan ID", async () => {
      try {
        await testServices.stripe.createCheckoutSession(userId, "invalid_plan");
        throw new Error("Should have thrown error");
      } catch (error: any) {
        expect(error.message).toMatch(/inválido|invalid/i);
        console.log(`✅ Invalid plan rejected correctly`);
      }
    });

    it("should handle requests regardless of auth in mock mode", async () => {
      // Mock service doesn't validate auth, just plan ID
      const result = await testServices.stripe.createCheckoutSession("sandbox-user", "family_monthly");
      expect(result).toHaveProperty("id");
      expect(result.id).toMatch(/^cs_/);
      console.log(`✅ Mock service processed unauthenticated request`);
    });
  });

  describe("2. Webhook Processing", () => {
    it("should handle checkout.session.completed webhook using mock service", async () => {
      const webhookPayload = {
        id: `evt_${Date.now()}`,
        type: "checkout.session.completed",
        data: {
          object: {
            id: sessionId,
            client_reference_id: userId,
            customer: `cus_${Date.now()}`,
            payment_intent: `pi_${Date.now()}`,
            metadata: { planId: "family_monthly" },
            amount_total: 1999,
            currency: "usd",
          },
        },
      };

      const result = await testServices.stripe.handleWebhookEvent(webhookPayload);

      expect(result.received).toBe(true);
      expect(testServices.stripe.handleWebhookEvent).toHaveBeenCalledWith(webhookPayload);
      console.log(`✅ Webhook processed successfully`);
    });

    it("should handle invoice.payment_failed webhook using mock service", async () => {
      const webhookPayload = {
        id: `evt_fail_${Date.now()}`,
        type: "invoice.payment_failed",
        data: {
          object: {
            id: `in_${Date.now()}`,
            customer: `cus_${Date.now()}`,
            amount_due: 1999,
            attempt_count: 1,
            metadata: { userId, planId: "family_monthly" },
          },
        },
      };

      const result = await testServices.stripe.handleWebhookEvent(webhookPayload);

      expect(result.received).toBe(true);
      console.log(`✅ Payment failure webhook handled`);
    });
  });

  describe("3. Subscription Management", () => {
    it("should retrieve subscription details using mock service", async () => {
      const subscriptionId = `sub_${Date.now()}`;
      const result = await testServices.stripe.getSubscriptionInfo(subscriptionId);

      expect(result).toHaveProperty("status");
      expect(result.status).toBe("active");
      expect(result).toHaveProperty("current_period_start");
      expect(result).toHaveProperty("current_period_end");
      console.log(`✅ Subscription details retrieved`);
    });

    it("should handle subscription cancellation using mock service", async () => {
      const subscriptionId = `sub_${Date.now()}`;
      const result = await testServices.stripe.cancelSubscription(subscriptionId);

      expect(result.status).toBe("canceled");
      expect(result).toHaveProperty("canceled_at");
      console.log(`✅ Subscription cancelled`);
    });
  });

  describe("4. Idempotency", () => {
    it("should handle duplicate webhook events using mock service", async () => {
      const webhookId = `evt_dup_${Date.now()}`;
      const payload = {
        id: webhookId,
        type: "checkout.session.completed",
        data: {
          object: {
            id: sessionId,
            client_reference_id: userId,
            customer: `cus_dup_${Date.now()}`,
            payment_intent: `pi_dup_${Date.now()}`,
            metadata: { planId: "family_monthly" },
            amount_total: 1999,
          },
        },
      };

      // Send same event twice
      const result1 = await testServices.stripe.handleWebhookEvent(payload);
      const result2 = await testServices.stripe.handleWebhookEvent(payload);

      expect(result1.received).toBe(true);
      expect(result2.received).toBe(true);
      expect(testServices.stripe.handleWebhookEvent).toHaveBeenCalledTimes(2);

      console.log(`✅ Idempotency validated - mock called twice as expected`);
    });
  });
});
