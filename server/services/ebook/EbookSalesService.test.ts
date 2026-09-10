import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getStripeClient: vi.fn(),
  safeSetDoc: vi.fn(),
}));

vi.mock("../../config/stripe", () => ({
  getStripeClient: mocks.getStripeClient,
}));

vi.mock("../../config/env", () => ({
  appBaseUrl: "https://lingolive.example",
  ENABLE_SANDBOX_FALLBACK: false,
}));

vi.mock("../firestoreSafe.service", () => ({
  safeAddDoc: vi.fn(),
  safeSetDoc: mocks.safeSetDoc,
  safeGetDoc: vi.fn(),
  safeQueryDocs: vi.fn(),
}));

import { createEbookCheckoutSession } from "./EbookSalesService";

describe("EbookSalesService payment safety", () => {
  beforeEach(() => {
    mocks.getStripeClient.mockReset();
    mocks.safeSetDoc.mockReset();
    mocks.getStripeClient.mockReturnValue(null);
  });

  it("fails closed without Stripe when the sandbox fallback is disabled", async () => {
    await expect(
      createEbookCheckoutSession(
        "ebook-1",
        "Business English",
        9.99,
        "student-1",
        "student@example.com",
        "Student",
      ),
    ).rejects.toThrow("payment sandbox fallback is disabled");

    expect(mocks.safeSetDoc).not.toHaveBeenCalled();
  });
});
