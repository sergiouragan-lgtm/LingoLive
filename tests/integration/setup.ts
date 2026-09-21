/**
 * Integration Test Setup
 * Provides mocked services for integration tests
 */

import { vi, expect } from "vitest";
import { createMockStripeService } from "../../server/services/__mocks__/stripe.service.mock";
import { createMockOpenAIService } from "../../server/services/__mocks__/openai.service.mock";
import { createMockLiveKitService } from "../../server/services/__mocks__/livekit.service.mock";
import { createMockGCSService } from "../../server/services/__mocks__/gcs.service.mock";

// Global mocking context for integration tests
export const testServices = {
  stripe: createMockStripeService(),
  openai: createMockOpenAIService(),
  livekit: createMockLiveKitService(),
  gcs: createMockGCSService(),
};

// Mock environment variables for integration tests
export const setupTestEnvironment = () => {
  process.env.VITEST = "true";
  process.env.NODE_ENV = "test";
  process.env.API_BASE = "http://localhost:3000";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";
  process.env.OPENAI_API_KEY = "sk-test-key";
  process.env.LIVEKIT_URL = "http://localhost:7880";
  process.env.LIVEKIT_API_KEY = "test-api-key";
  process.env.LIVEKIT_API_SECRET = "test-api-secret";
  process.env.GCS_PROJECT_ID = "test-project";
  process.env.GCS_BUCKET = "test-bucket";
};

// Reset mocks between test runs
export const resetTestServices = () => {
  Object.values(testServices).forEach((service) => {
    Object.values(service).forEach((fn) => {
      if (vi.isMockFunction(fn)) {
        fn.mockClear();
      }
    });
  });
};

// Helper to verify mock was called with expected arguments
export const expectServiceCall = (service: any, method: string, args: any[]) => {
  const mockFn = service[method];
  if (!vi.isMockFunction(mockFn)) {
    throw new Error(`${method} is not a mock function`);
  }
  expect(mockFn).toHaveBeenCalledWith(...args);
};

// Initialize test environment on import
setupTestEnvironment();
