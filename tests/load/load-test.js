/**
 * Load Testing Script (k6)
 * Tests API performance under load
 * 
 * Usage:
 * - Quick test: k6 run tests/load/load-test.js
 * - Full test: k6 run --vus 1000 --duration 5m tests/load/load-test.js
 * - With output: k6 run --out csv=results.csv tests/load/load-test.js
 */

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter, Gauge } from "k6/metrics";

const API_BASE = __ENV.API_BASE || "http://localhost:3000";
const AUTH_TOKEN = __ENV.AUTH_TOKEN || "test-token";

// Custom metrics
const errorRate = new Rate("errors");
const requestDuration = new Trend("request_duration");
const healthCheckSuccesses = new Counter("health_checks_passed");
const activeConnections = new Gauge("active_connections");

export const options = {
  stages: [
    // Gradually ramp up to 100 VUs over 2 minutes
    { duration: "2m", target: 100 },
    // Stay at 100 VUs for 5 minutes
    { duration: "5m", target: 100 },
    // Ramp down to 50 VUs over 1 minute
    { duration: "1m", target: 50 },
    // Ramp down to 0 VUs over 1 minute
    { duration: "1m", target: 0 },
  ],

  // Thresholds define pass/fail criteria
  thresholds: {
    errors: ["rate<0.1"], // Error rate should be < 10%
    request_duration: ["p(95)<3000"], // P95 latency < 3 seconds
    health_checks_passed: ["count>1000"], // At least 1000 health checks
  },

  ext: {
    loadimpact: {
      projectID: 3356484,
      name: "LingoLive API Load Test",
    },
  },
};

// Test scenarios
export default function () {
  const baseUrl = `${API_BASE}/api`;

  group("Health & Status Checks", () => {
    const res = http.get(`${baseUrl}/service-health`);
    
    const success = check(res, {
      "health check status is 200": (r) => r.status === 200,
      "has uptime": (r) => r.json("uptime") !== undefined,
    });

    if (success) {
      healthCheckSuccesses.add(1);
    } else {
      errorRate.add(1);
    }

    requestDuration.add(res.timings.duration);
  });

  group("Payment API", () => {
    // Simulate checkout creation
    const checkoutRes = http.post(
      `${baseUrl}/payment/checkout`,
      JSON.stringify({
        planId: "pro_monthly",
        priceAmount: 99.99,
        currency: "usd",
      }),
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
      }
    );

    const checkoutSuccess = check(checkoutRes, {
      "checkout status is 200": (r) => r.status === 200,
      "checkout has sessionId": (r) => r.json("sessionId") !== undefined,
    });

    if (!checkoutSuccess) {
      errorRate.add(1);
    }
    requestDuration.add(checkoutRes.timings.duration);

    // Get subscription status
    const subRes = http.get(`${baseUrl}/payment/subscription`, {
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
    });

    check(subRes, {
      "subscription status is 200": (r) => r.status === 200,
      "has subscriptionStatus": (r) => r.json("subscriptionStatus") !== undefined,
    });

    requestDuration.add(subRes.timings.duration);
  });

  group("AI Tutor API", () => {
    // Chat request
    const chatRes = http.post(
      `${baseUrl}/ai-tutor/chat`,
      JSON.stringify({
        message: "How do I learn Spanish?",
        language: "es",
        level: "beginner",
      }),
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
      }
    );

    const chatSuccess = check(chatRes, {
      "chat status is 200": (r) => r.status === 200,
      "has response": (r) => r.json("response") !== undefined,
    });

    if (!chatSuccess) {
      errorRate.add(1);
    }
    requestDuration.add(chatRes.timings.duration);

    // Generate exercises
    const exerciseRes = http.post(
      `${baseUrl}/ai-tutor/exercises`,
      JSON.stringify({
        topic: "verb conjugation",
        language: "es",
        level: "intermediate",
        questionCount: 5,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
      }
    );

    check(exerciseRes, {
      "exercises status is 200": (r) => r.status === 200,
      "exercises array not empty": (r) => r.json("exercises").length > 0,
    });

    requestDuration.add(exerciseRes.timings.duration);
  });

  group("LiveKit API", () => {
    // Generate token
    const tokenRes = http.post(
      `${baseUrl}/livekit/token`,
      JSON.stringify({
        roomName: "test-room",
        userRole: "student",
      }),
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
      }
    );

    const tokenSuccess = check(tokenRes, {
      "token status is 200": (r) => r.status === 200,
      "has token": (r) => r.json("token") !== undefined,
    });

    if (!tokenSuccess) {
      errorRate.add(1);
    }
    requestDuration.add(tokenRes.timings.duration);

    // List rooms
    const roomsRes = http.get(`${baseUrl}/livekit/rooms`, {
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
    });

    check(roomsRes, {
      "rooms status is 200": (r) => r.status === 200,
      "has rooms array": (r) => Array.isArray(r.json("rooms")),
    });

    requestDuration.add(roomsRes.timings.duration);
  });

  // Track concurrent connections
  activeConnections.set(__ENV.VU || 1);

  // Random sleep between requests
  sleep(Math.random() * 3);
}

// Teardown function
export function teardown(data) {
  console.log("Load test completed!");
  console.log(`Total errors: ${errorRate.value}`);
  console.log(`P95 latency: ${requestDuration.value.p95}ms`);
}
