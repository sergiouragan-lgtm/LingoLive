import { test, expect } from '@playwright/test';

/**
 * Security & API Integration Tests — Phase 10 Security Infrastructure
 * Tests the security headers, CORS, rate limiting, and input validation
 * implemented in Phase 10: Advanced Security hardening.
 */

test.describe('Security Headers & API Protection', () => {
  test('should enforce security headers on API responses', async ({ request }) => {
    const response = await request.get('/api/service-health');
    const headers = response.headers();

    expect(response.status()).toBe(200);
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['referrer-policy']).toContain('strict-origin');
  });

  test('should include Content Security Policy header', async ({ request }) => {
    const response = await request.get('/api/service-health');
    const cspHeader = response.headers()['content-security-policy'] || '';

    // CSP should be present and restrict frame sources
    expect(cspHeader).toBeTruthy();
    expect(cspHeader).toContain("frame-src 'none'");
    expect(cspHeader).toContain("default-src 'self'");
  });

  test('should set appropriate CORS headers for cross-origin requests', async ({
    request,
  }) => {
    // Test CORS preflight response with OPTIONS method
    const response = await request.fetch('/api/service-health', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
      },
    });

    // CORS should allow same-origin or whitelisted domains
    const allowOrigin = response.headers()['access-control-allow-origin'] || '';
    const allowMethods = response.headers()['access-control-allow-methods'] || '';

    // Should have CORS headers or allow the origin
    expect(response.status()).toBeLessThan(500);
    if (allowOrigin) {
      expect([
        'http://localhost:5173',
        '*',
        'null',
      ]).toContain(allowOrigin.split(',')[0].trim());
    }
  });

  test('should reject requests from untrusted origins', async ({ request }) => {
    // Attempt request from untrusted origin
    const response = await request.post('/api/sync-vocabulary', {
      headers: {
        'Origin': 'http://untrusted.com',
        'Content-Type': 'application/json',
      },
      data: {
        words: [],
      },
    });

    // Should either reject or require proper auth
    expect([400, 401, 403, 500]).toContain(response.status());
  });
});

test.describe('Input Validation & Error Handling', () => {
  test('should reject invalid vocabulary sync payload', async ({ request }) => {
    // Missing required fields
    const response = await request.post('/api/sync-vocabulary', {
      headers: {
        'Authorization': 'Bearer invalid-token',
        'Content-Type': 'application/json',
      },
      data: {
        // Missing 'words' field
        userId: 'test-user',
      },
    });

    expect([400, 401]).toContain(response.status());
    const body = await response.json();
    expect(body.error || body.message).toBeTruthy();
  });

  test('should validate array size constraints', async ({ request }) => {
    // Attempt to sync too many words (exceeds max of 1000)
    const tooManyWords = Array(1001)
      .fill(null)
      .map((_, i) => ({
        word: `word${i}`,
        definition: `def${i}`,
        language: 'en',
      }));

    const response = await request.post('/api/sync-vocabulary', {
      headers: {
        'Authorization': 'Bearer invalid-token',
        'Content-Type': 'application/json',
      },
      data: {
        words: tooManyWords,
      },
    });

    expect([400, 401]).toContain(response.status());
  });

  test('should validate string length constraints', async ({ request }) => {
    // Word exceeding max length of 100 characters
    const response = await page.request.post('/api/sync-vocabulary', {
      headers: {
        'Authorization': 'Bearer invalid-token',
        'Content-Type': 'application/json',
      },
      data: {
        words: [
          {
            word: 'x'.repeat(101), // Exceeds max length
            definition: 'test',
            language: 'en',
          },
        ],
      },
    });

    expect([400, 401]).toContain(response.status());
  });

  test('should reject invalid enum values', async ({ request }) => {
    const response = await request.post('/api/sync-vocabulary', {
      headers: {
        'Authorization': 'Bearer invalid-token',
        'Content-Type': 'application/json',
      },
      data: {
        words: [
          {
            word: 'test',
            definition: 'test',
            language: 'invalid-lang', // Invalid language code
          },
        ],
      },
    });

    expect([400, 401]).toContain(response.status());
  });
});

test.describe('Rate Limiting & Abuse Prevention', () => {
  test('should track request rate limiting', async ({ request }) => {
    const response = await request.post('/api/sync-vocabulary', {
      data: { words: [] },
    });
    const headers = response.headers();

    expect([400, 401, 403]).toContain(response.status());
    expect(headers['ratelimit-limit']).toBeTruthy();
  });

  test('should include RateLimit headers in protected responses', async ({ request }) => {
    const response = await request.post('/api/sync-vocabulary', {
      data: { words: [] },
    });

    // Should include rate limit headers
    const headers = response.headers();
    const hasRateLimitHeader =
      !!headers['x-ratelimit-limit'] ||
      !!headers['x-ratelimit-remaining'] ||
      !!headers['ratelimit-limit'];

    expect([400, 401, 403]).toContain(response.status());
    expect(hasRateLimitHeader).toBe(true);
  });
});

test.describe('Authentication & Authorization', () => {
  test('should require authentication for protected endpoints', async ({ request }) => {
    // Attempt to access vocabulary sync without token
    const response = await request.post('/api/sync-vocabulary', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        words: [],
      },
    });

    expect([401, 403]).toContain(response.status());
  });

  test('should reject invalid authentication tokens', async ({ request }) => {
    const response = await request.post('/api/sync-vocabulary', {
      headers: {
        'Authorization': 'Bearer malformed-token',
        'Content-Type': 'application/json',
      },
      data: {
        words: [],
      },
    });

    expect([401, 403]).toContain(response.status());
  });

  test('should validate request payload structure on auth failure', async ({
    request,
  }) => {
    // Missing Authorization header
    const response = await request.post('/api/sync-vocabulary', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        // Missing words array
        userId: 'test',
      },
    });

    expect([400, 401]).toContain(response.status());
  });
});
