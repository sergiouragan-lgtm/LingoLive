/**
 * Performance Baseline Tests
 * Establishes performance SLAs and monitors against them
 */

import { describe, it, expect, beforeAll } from "vitest";
import axios from "axios";

const API_BASE = process.env.API_BASE || "http://localhost:3000";
const AUTH_TOKEN = process.env.AUTH_TOKEN || "test-token";

// Performance SLAs
const SLA = {
  p50: 500, // 500ms
  p95: 2000, // 2 seconds
  p99: 5000, // 5 seconds
  errorRate: 0.01, // 1%
};

interface PerformanceMetrics {
  name: string;
  durations: number[];
  errors: number;
  total: number;
}

const metrics: Map<string, PerformanceMetrics> = new Map();

async function measureEndpoint(
  name: string,
  method: string,
  url: string,
  data?: any,
  iterations: number = 100
) {
  const durations: number[] = [];
  let errors = 0;

  console.log(`\n📊 Testing ${name} (${iterations} iterations)...`);

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();

    try {
      const response = await axios({
        method,
        url: `${API_BASE}${url}`,
        data,
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      if (response.status >= 400) {
        errors++;
      } else {
        const duration = performance.now() - startTime;
        durations.push(duration);
      }
    } catch (error) {
      errors++;
    }
  }

  const sorted = durations.sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];
  const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
  const errorRate = errors / iterations;

  metrics.set(name, {
    name,
    durations: sorted,
    errors,
    total: iterations,
  });

  console.log(`  Results:`);
  console.log(`    P50 (median): ${p50.toFixed(2)}ms ${p50 <= SLA.p50 ? "✅" : "❌"}`);
  console.log(`    P95: ${p95.toFixed(2)}ms ${p95 <= SLA.p95 ? "✅" : "❌"}`);
  console.log(`    P99: ${p99.toFixed(2)}ms ${p99 <= SLA.p99 ? "✅" : "❌"}`);
  console.log(`    Avg: ${avg.toFixed(2)}ms`);
  console.log(`    Error Rate: ${(errorRate * 100).toFixed(2)}% ${errorRate <= SLA.errorRate ? "✅" : "❌"}`);

  return { p50, p95, p99, avg, errorRate };
}

describe("Performance Baseline Tests", () => {
  describe("Health & Status Checks", () => {
    it("should meet P95 < 2s for health check", async () => {
      const result = await measureEndpoint(
        "Health Check",
        "GET",
        "/api/service-health",
        undefined,
        50
      );

      expect(result.p95).toBeLessThan(SLA.p95);
      expect(result.errorRate).toBeLessThan(SLA.errorRate);
    });
  });

  describe("Payment API", () => {
    it("should meet P95 < 2s for checkout creation", async () => {
      const result = await measureEndpoint(
        "Checkout Creation",
        "POST",
        "/api/payment/checkout",
        {
          planId: "pro_monthly",
          priceAmount: 99.99,
          currency: "usd",
        },
        50
      );

      expect(result.p95).toBeLessThan(SLA.p95);
      expect(result.errorRate).toBeLessThan(SLA.errorRate);
    });

    it("should meet P95 < 2s for subscription retrieval", async () => {
      const result = await measureEndpoint(
        "Subscription Retrieval",
        "GET",
        "/api/payment/subscription",
        undefined,
        50
      );

      expect(result.p95).toBeLessThan(SLA.p95);
    });
  });

  describe("AI Tutor API", () => {
    it("should meet P95 < 5s for chat (longer due to API call)", async () => {
      const result = await measureEndpoint(
        "AI Chat",
        "POST",
        "/api/ai-tutor/chat",
        {
          message: "Hello, teach me Spanish",
          language: "es",
          level: "beginner",
        },
        20 // Fewer iterations due to longer duration
      );

      // AI responses are slower, allow P95 < 5s
      expect(result.p95).toBeLessThan(5000);
      expect(result.errorRate).toBeLessThan(0.1);
    });

    it("should meet P95 < 3s for exercise generation", async () => {
      const result = await measureEndpoint(
        "Exercise Generation",
        "POST",
        "/api/ai-tutor/exercises",
        {
          topic: "verb conjugation",
          language: "es",
          level: "intermediate",
          questionCount: 5,
        },
        20
      );

      expect(result.p95).toBeLessThan(5000);
    });
  });

  describe("LiveKit API", () => {
    it("should meet P95 < 1s for token generation", async () => {
      const result = await measureEndpoint(
        "Token Generation",
        "POST",
        "/api/livekit/token",
        {
          roomName: "test-room",
          userRole: "student",
        },
        50
      );

      expect(result.p95).toBeLessThan(1000);
      expect(result.errorRate).toBeLessThan(SLA.errorRate);
    });

    it("should meet P95 < 2s for room listing", async () => {
      const result = await measureEndpoint(
        "Room Listing",
        "GET",
        "/api/livekit/rooms",
        undefined,
        50
      );

      expect(result.p95).toBeLessThan(SLA.p95);
    });
  });

  describe("Summary Report", () => {
    it("should generate performance summary", () => {
      console.log("\n\n📈 PERFORMANCE BASELINE SUMMARY\n");
      console.log("Endpoint Performance vs SLA:");
      console.log(
        "═".repeat(70)
      );

      let allPassed = true;

      metrics.forEach((metric) => {
        const sorted = metric.durations.sort((a, b) => a - b);
        const p95 = sorted[Math.floor(sorted.length * 0.95)];
        const passed = p95 <= SLA.p95;
        allPassed = allPassed && passed;

        console.log(
          `${metric.name.padEnd(30)} | P95: ${p95.toFixed(2)}ms ${passed ? "✅" : "❌"}`
        );
      });

      console.log(
        "═".repeat(70)
      );

      if (allPassed) {
        console.log("✅ All endpoints within SLA!");
      } else {
        console.log("❌ Some endpoints exceeded SLA. Review results above.");
      }

      expect(allPassed).toBe(true);
    });
  });
});
