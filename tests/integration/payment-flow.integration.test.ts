/**
 * Integration Tests: Complete Payment Flow
 * Tests the entire Stripe payment workflow from checkout to subscription
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import axios from "axios";
import { getFirestore } from "firebase/firestore";
import { initializeApp } from "firebase/app";

// Firebase config for tests
const firebaseConfig = {
  apiKey: "AIzaSyCOr2KeJzfQjjd1_-W7-n9P7e1i3C7-fGI",
  authDomain: "lingolive-ia-f5778.firebaseapp.com",
  projectId: "lingolive-ia-f5778",
  storageBucket: "lingolive-ia-f5778.appspot.com",
  messagingSenderId: "898797589156",
  appId: "1:898797589156:web:4c74f9d04f9f3a6a63f8ca"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const API_BASE = process.env.API_BASE || "http://localhost:3000";
const TEST_USER_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = "Test@12345";

describe("Complete Payment Flow Integration", () => {
  let userId: string = `test-user-${Date.now()}`;
  let stripeCustomerId: string;
  let sessionId: string;
  let authToken: string = "test-auth-token-" + Date.now();

  beforeAll(async () => {
    // Use mock auth token for integration testing
    console.log(`✅ Test user ID: ${userId}`);
    console.log(`✅ Mock auth token: ${authToken}`);
  });

  afterAll(async () => {
    console.log(`✅ Test complete for user: ${userId}`);
  });

  describe("1. Checkout Session Creation", () => {
    it("should create a Stripe checkout session", async () => {
      const response = await axios.post(
        `${API_BASE}/api/payment/checkout`,
        {
          planId: "family_monthly",
          priceAmount: 19.99,
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
        expect(error.response.data.error).toMatch(/invalid|inválido/i);
      }
    });

    it("should reject unauthenticated requests", async () => {
      try {
        await axios.post(`${API_BASE}/api/payment/checkout`, {
          planId: "family_monthly",
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
            metadata: { planId: "family_monthly" },
            amount_total: 1999,
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
            amount_due: 1999,
            attempt_count: 1,
            metadata: { userId, planId: "family_monthly" },
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
        `${API_BASE}/api/payment/subscription/details`,
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
            metadata: { planId: "family_monthly" },
            amount_total: 1999,
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
