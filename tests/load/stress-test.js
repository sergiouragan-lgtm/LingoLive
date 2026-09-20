/**
 * Stress Testing Script (k6)
 * Pushes API to breaking point to find limits
 * 
 * Usage: k6 run --vus 1000 --duration 10m tests/load/stress-test.js
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const API_BASE = __ENV.API_BASE || "http://localhost:3000";
const AUTH_TOKEN = __ENV.AUTH_TOKEN || "test-token";

const errorRate = new Rate("stress_errors");
const requestDuration = new Trend("stress_latency");

export const options = {
  stages: [
    // Ramp up aggressively
    { duration: "1m", target: 500 },
    { duration: "2m", target: 1000 },
    { duration: "3m", target: 1500 },
    { duration: "2m", target: 1000 },
    { duration: "1m", target: 0 },
  ],

  thresholds: {
    stress_errors: ["rate<0.25"], // Tolerate 25% errors under stress
    stress_latency: ["p(95)<5000"], // P95 < 5 seconds under stress
  },
};

export default function () {
  const baseUrl = `${API_BASE}/api`;

  // Rapid-fire requests to multiple endpoints
  const responses = http.batch([
    ["GET", `${baseUrl}/service-health`],
    [
      "POST",
      `${baseUrl}/payment/checkout`,
      JSON.stringify({ planId: "pro_monthly" }),
      { headers: { "Content-Type": "application/json", Authorization: `Bearer ${AUTH_TOKEN}` } },
    ],
    [
      "POST",
      `${baseUrl}/ai-tutor/chat`,
      JSON.stringify({ message: "Test", language: "en" }),
      { headers: { "Content-Type": "application/json", Authorization: `Bearer ${AUTH_TOKEN}` } },
    ],
    ["GET", `${baseUrl}/livekit/rooms`, { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }],
  ]);

  responses.forEach((res) => {
    const success = check(res, {
      "status < 500": (r) => r.status < 500,
      "response time < 10s": (r) => r.timings.duration < 10000,
    });

    if (!success) {
      errorRate.add(1);
    }
    requestDuration.add(res.timings.duration);
  });

  sleep(0.1);
}
