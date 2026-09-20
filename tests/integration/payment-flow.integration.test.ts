/**
 * Integration Tests: Complete Payment Flow
 * Tests the entire Stripe payment workflow from checkout to subscription
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import axios from "axios";
import { auth, db } from "../../src/firebase";

const API_BASE = process.env.API_BASE || "http://localhost:3000";
const TEST_USER_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = "Test@12345";

describe("Complete Payment Flow Integration", () => {
  let userId: string;
  let stripeCustomerId: string;
  let sessionId: string;
  let authToken: string;

  beforeAll(async () => {
    // Create test user
    console.log("Creating test user...");
    const userCredential = await auth.createUserWithEmailAndPassword(
      TEST_USER_EMAIL,
      TEST_PASSWORD
    );
    userId = userCredential.user.uid;
    authToken = await userCredential.user.getIdToken();

    // Create user profile
    await db.collection("users").doc(userId).set({
      email: TEST_USER_EMAIL,
      displayName: "Test User",
      createdAt: new Date(),
      subscriptionStatus: "free",
    });

    console.log(`✅ Test user created: ${userId}`);
  });

  afterAll(async () => {
    // Cleanup: Delete test user
    if (userId) {
      await db.collection("users").doc(userId).delete();
      console.log(`✅ Test user deleted: ${userId}`);
    }
  });

  describe("1. Checkout Session Creation", () => {
    it("should create a Stripe checkout session", async () => {
      const response = await axios.post(
        `${API_BASE}/api/payment/checkout`,
        {
          planId: "pro_monthly",
          priceAmount: 99.99,
          currency: "usd",
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("sessionId");
      expect(response.data).toHaveProperty("clientSecret");

      sessionId = response.data.sessionId;
      console.log(`✅ Checkout session created: ${sessionId}`);
    });

    it("should reject invalid plan ID", async () => {
      try {
        await axios.post(
          `${API_BASE}/api/payment/checkout`,
          {
            planId: "invalid_plan",
            priceAmount: 99.99,
            currency: "usd",
          },
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );
        throw new Error("Should have thrown error");
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.error).toContain("Invalid plan");
      }
    });

    it("should reject unauthenticated requests", async () => {
      try {
        await axios.post(`${API_BASE}/api/payment/checkout`, {
          planId: "pro_monthly",
        });
        throw new Error("Should have thrown error");
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe("2. Webhook Processing", () => {
    it("should handle checkout.session.completed webhook", async () => {
      // Simulate Stripe webhook
      const webhookPayload = {
        id: `evt_${Date.now()}`,
        type: "checkout.session.completed",
        data: {
          object: {
            id: sessionId,
            client_reference_id: userId,
            customer: `cus_${Date.now()}`,
            payment_intent: `pi_${Date.now()}`,
            metadata: { planId: "pro_monthly" },
            amount_total: 9999,
            currency: "usd",
          },
        },
      };

      const response = await axios.post(
        `${API_BASE}/api/payment/webhook`,
        webhookPayload,
        {
          headers: {
            "stripe-signature": "test_signature",
            "content-type": "application/json",
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.received).toBe(true);

      // Verify user subscription updated
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for processing
      const userDoc = await db.collection("users").doc(userId).get();
      expect(userDoc.data()?.subscriptionStatus).toBe("active");

      console.log(`✅ Webhook processed successfully`);
    });

    it("should handle invoice.payment_failed webhook", async () => {
      const webhookPayload = {
        id: `evt_fail_${Date.now()}`,
        type: "invoice.payment_failed",
        data: {
          object: {
            id: `in_${Date.now()}`,
            customer: `cus_${Date.now()}`,
            amount_due: 9999,
            attempt_count: 1,
            metadata: { userId, planId: "pro_monthly" },
          },
        },
      };

      const response = await axios.post(
        `${API_BASE}/api/payment/webhook`,
        webhookPayload,
        {
          headers: { "stripe-signature": "test_signature" },
        }
      );

      expect(response.status).toBe(200);
      console.log(`✅ Payment failure webhook handled`);
    });
  });

  describe("3. Subscription Management", () => {
    it("should retrieve subscription details", async () => {
      const response = await axios.get(
        `${API_BASE}/api/payment/subscription`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("subscriptionStatus");
      expect(response.data).toHaveProperty("planId");
      console.log(`✅ Subscription details retrieved`);
    });

    it("should handle subscription cancellation", async () => {
      const response = await axios.post(
        `${API_BASE}/api/payment/subscription/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);

      // Verify status updated
      const userDoc = await db.collection("users").doc(userId).get();
      expect(userDoc.data()?.subscriptionStatus).not.toBe("active");
      console.log(`✅ Subscription cancelled`);
    });
  });

  describe("4. Idempotency", () => {
    it("should handle duplicate webhook events", async () => {
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
            metadata: { planId: "pro_monthly" },
            amount_total: 9999,
          },
        },
      };

      // Send same event twice
      const response1 = await axios.post(
        `${API_BASE}/api/payment/webhook`,
        payload,
        { headers: { "stripe-signature": "test_sig" } }
      );

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const response2 = await axios.post(
        `${API_BASE}/api/payment/webhook`,
        payload,
        { headers: { "stripe-signature": "test_sig" } }
      );

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response2.data.idempotent).toBe(true);

      console.log(`✅ Idempotency validated`);
    });
  });
});
