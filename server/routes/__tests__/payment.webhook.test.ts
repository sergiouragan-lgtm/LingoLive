import { describe, it, expect, beforeEach, vi } from "vitest";
import { StripeService } from "../../services/stripe.service";
import { PaymentEngineService } from "../../services/paymentEngine.service";
import Stripe from "stripe";

// Mock Stripe & PaymentEngine
vi.mock("../../services/paymentEngine.service");
vi.mock("../../config/stripe");

describe("Stripe Webhook Integration", () => {
  const mockUserId = "test-user-123";
  const mockPlanId = "pro_monthly";
  const mockCustomerId = "cus_test123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkout.session.completed", () => {
    it("should process successful checkout and grant access", async () => {
      const mockEvent = {
        id: "evt_1234567890",
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test123",
            client_reference_id: mockUserId,
            metadata: { planId: mockPlanId },
            payment_intent: "pi_test123",
            customer: mockCustomerId,
            amount_total: 99900, // $99.99
            currency: "usd",
          },
        },
      };

      vi.spyOn(PaymentEngineService, "handlePaymentSuccess").mockResolvedValue(undefined);
      vi.spyOn(PaymentEngineService, "acquireEventLock").mockResolvedValue({ acquired: true });

      const result = await StripeService.handleWebhookEvent(mockEvent);

      expect(result.received).toBe(true);
      expect(PaymentEngineService.handlePaymentSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          planId: mockPlanId,
          provider: "stripe",
        })
      );
    });

    it("should reject unknown plan ID", async () => {
      const mockEvent = {
        id: "evt_invalid_plan",
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_invalid",
            client_reference_id: mockUserId,
            metadata: { planId: "invalid_plan" },
            amount_total: 99900,
            currency: "usd",
          },
        },
      };

      vi.spyOn(PaymentEngineService, "acquireEventLock").mockResolvedValue({ acquired: true });
      vi.spyOn(PaymentEngineService, "recordPayment").mockResolvedValue(undefined);

      const result = await StripeService.handleWebhookEvent(mockEvent);

      expect(result.error).toBe("UNKNOWN_PLAN_ID");
    });

    it("should handle idempotent duplicate events", async () => {
      const eventId = "evt_duplicate_12345";
      const mockEvent = {
        id: eventId,
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_duplicate",
            client_reference_id: mockUserId,
            metadata: { planId: mockPlanId },
            payment_intent: "pi_duplicate",
            amount_total: 99900,
            currency: "usd",
          },
        },
      };

      // First call acquires lock
      vi.spyOn(PaymentEngineService, "acquireEventLock")
        .mockResolvedValueOnce({ acquired: true })
        .mockResolvedValueOnce({ acquired: false, status: "processed" });

      vi.spyOn(PaymentEngineService, "handlePaymentSuccess").mockResolvedValue(undefined);

      // First event
      const result1 = await StripeService.handleWebhookEvent(mockEvent);
      expect(result1.received).toBe(true);

      // Duplicate event
      const result2 = await StripeService.handleWebhookEvent(mockEvent);
      expect(result2.idempotent).toBe(true);
    });
  });

  describe("invoice.payment_failed", () => {
    it("should record failed payment and notify user", async () => {
      const mockEvent = {
        id: "evt_invoice_fail",
        type: "invoice.payment_failed",
        data: {
          object: {
            id: "in_test123",
            customer: mockCustomerId,
            subscription: "sub_test123",
            amount_due: 99900,
            currency: "usd",
            attempt_count: 1,
            next_payment_attempt: Math.floor(Date.now() / 1000) + 86400 * 3, // 3 days
            metadata: { userId: mockUserId, planId: mockPlanId },
          },
        },
      };

      vi.spyOn(PaymentEngineService, "acquireEventLock").mockResolvedValue({ acquired: true });
      vi.spyOn(PaymentEngineService, "handlePaymentFailure").mockResolvedValue(undefined);

      const result = await StripeService.handleWebhookEvent(mockEvent);

      expect(result.received).toBe(true);
      expect(PaymentEngineService.handlePaymentFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          reason: expect.stringContaining("Payment failed"),
          attemptCount: 1,
        })
      );
    });
  });

  describe("invoice.paid", () => {
    it("should process subscription renewal", async () => {
      const mockEvent = {
        id: "evt_invoice_paid",
        type: "invoice.paid",
        data: {
          object: {
            id: "in_renewal123",
            customer: mockCustomerId,
            subscription: "sub_test123",
            amount_paid: 99900,
            currency: "usd",
            period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
            lines: {
              data: [{ metadata: { userId: mockUserId, planId: mockPlanId } }],
            },
            metadata: { userId: mockUserId, planId: mockPlanId },
          },
        },
      };

      vi.spyOn(PaymentEngineService, "acquireEventLock").mockResolvedValue({ acquired: true });
      vi.spyOn(PaymentEngineService, "handleSubscriptionRenewal").mockResolvedValue(undefined);

      const result = await StripeService.handleWebhookEvent(mockEvent);

      expect(result.received).toBe(true);
      expect(PaymentEngineService.handleSubscriptionRenewal).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          planId: mockPlanId,
          paidUntil: expect.any(String),
        })
      );
    });
  });

  describe("customer.subscription.updated", () => {
    it("should handle plan upgrade", async () => {
      const mockEvent = {
        id: "evt_sub_updated",
        type: "customer.subscription.updated",
        data: {
          object: {
            id: "sub_upgraded",
            customer: mockCustomerId,
            status: "active",
            cancel_at_period_end: false,
            metadata: { userId: mockUserId },
          },
        },
      };

      vi.spyOn(PaymentEngineService, "acquireEventLock").mockResolvedValue({ acquired: true });
      vi.spyOn(PaymentEngineService, "reactivateSubscription").mockResolvedValue(undefined);

      const result = await StripeService.handleWebhookEvent(mockEvent);

      expect(result.received).toBe(true);
      expect(PaymentEngineService.reactivateSubscription).toHaveBeenCalledWith(mockUserId);
    });

    it("should handle subscription cancellation", async () => {
      const mockEvent = {
        id: "evt_sub_cancel",
        type: "customer.subscription.updated",
        data: {
          object: {
            id: "sub_cancelled",
            customer: mockCustomerId,
            status: "canceled",
            current_period_end: Math.floor(Date.now() / 1000),
            metadata: { userId: mockUserId },
          },
        },
      };

      vi.spyOn(PaymentEngineService, "acquireEventLock").mockResolvedValue({ acquired: true });
      vi.spyOn(PaymentEngineService, "cancelSubscription").mockResolvedValue(undefined);

      const result = await StripeService.handleWebhookEvent(mockEvent);

      expect(result.received).toBe(true);
      expect(PaymentEngineService.cancelSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          reason: expect.stringContaining("canceled"),
        })
      );
    });
  });

  describe("customer.subscription.deleted", () => {
    it("should revoke access when subscription is deleted", async () => {
      const mockEvent = {
        id: "evt_sub_deleted",
        type: "customer.subscription.deleted",
        data: {
          object: {
            id: "sub_deleted",
            customer: mockCustomerId,
            current_period_end: Math.floor(Date.now() / 1000),
            metadata: { userId: mockUserId },
          },
        },
      };

      vi.spyOn(PaymentEngineService, "acquireEventLock").mockResolvedValue({ acquired: true });
      vi.spyOn(PaymentEngineService, "cancelSubscription").mockResolvedValue(undefined);

      const result = await StripeService.handleWebhookEvent(mockEvent);

      expect(result.received).toBe(true);
      expect(PaymentEngineService.cancelSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          reason: "Subscription deleted by Stripe webhook",
        })
      );
    });
  });

  describe("charge.dispute.created", () => {
    it("should flag chargeback and notify admins", async () => {
      const mockEvent = {
        id: "evt_dispute_created",
        type: "charge.dispute.created",
        data: {
          object: {
            id: "ch_dispute123",
            customer: mockCustomerId,
            amount: 99900,
            currency: "usd",
            reason: "fraudulent",
            metadata: { userId: mockUserId, planId: mockPlanId },
          },
        },
      };

      vi.spyOn(PaymentEngineService, "acquireEventLock").mockResolvedValue({ acquired: true });
      vi.spyOn(PaymentEngineService, "recordPayment").mockResolvedValue(undefined);

      const result = await StripeService.handleWebhookEvent(mockEvent);

      expect(result.received).toBe(true);
      expect(PaymentEngineService.recordPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "disputed",
          requiresReview: true,
        })
      );
    });
  });

  describe("charge.refunded", () => {
    it("should process refund and update subscription", async () => {
      const mockEvent = {
        id: "evt_refunded",
        type: "charge.refunded",
        data: {
          object: {
            id: "ch_refunded123",
            customer: mockCustomerId,
            amount: 99900,
            amount_refunded: 99900,
            currency: "usd",
            refunded: true,
            metadata: { userId: mockUserId, planId: mockPlanId },
          },
        },
      };

      vi.spyOn(PaymentEngineService, "acquireEventLock").mockResolvedValue({ acquired: true });
      vi.spyOn(PaymentEngineService, "recordPayment").mockResolvedValue(undefined);

      const result = await StripeService.handleWebhookEvent(mockEvent);

      expect(result.received).toBe(true);
      expect(PaymentEngineService.recordPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "refunded",
          amount: -999.99,
        })
      );
    });
  });

  describe("payment_intent.payment_failed", () => {
    it("should handle payment intent failure", async () => {
      const mockEvent = {
        id: "evt_pi_failed",
        type: "payment_intent.payment_failed",
        data: {
          object: {
            id: "pi_failed123",
            customer: mockCustomerId,
            amount: 99900,
            currency: "usd",
            last_payment_error: {
              code: "card_declined",
              message: "Your card was declined",
            },
            metadata: { userId: mockUserId, planId: mockPlanId },
          },
        },
      };

      vi.spyOn(PaymentEngineService, "acquireEventLock").mockResolvedValue({ acquired: true });
      vi.spyOn(PaymentEngineService, "handlePaymentFailure").mockResolvedValue(undefined);

      const result = await StripeService.handleWebhookEvent(mockEvent);

      expect(result.received).toBe(true);
      expect(PaymentEngineService.handlePaymentFailure).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          reason: "Your card was declined",
        })
      );
    });
  });

  describe("Error Handling", () => {
    it("should throw on webhook processing error", async () => {
      const mockEvent = {
        id: "evt_error",
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_error",
            client_reference_id: mockUserId,
            metadata: { planId: mockPlanId },
          },
        },
      };

      vi.spyOn(PaymentEngineService, "acquireEventLock").mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(StripeService.handleWebhookEvent(mockEvent)).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("should handle missing userId gracefully", async () => {
      const mockEvent = {
        id: "evt_no_user",
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_no_user",
            // No client_reference_id or metadata
            amount_total: 99900,
            currency: "usd",
          },
        },
      };

      vi.spyOn(PaymentEngineService, "acquireEventLock").mockResolvedValue({ acquired: true });
      vi.spyOn(PaymentEngineService, "markEventProcessed").mockResolvedValue(undefined);

      const result = await StripeService.handleWebhookEvent(mockEvent);

      expect(result.received).toBe(true);
      expect(PaymentEngineService.markEventProcessed).toHaveBeenCalledWith(
        expect.any(String),
        "stripe",
        "checkout.session.completed",
        expect.objectContaining({ warning: "missing_userId" })
      );
    });
  });
});
