import { Response, NextFunction } from "express";
import { SlidingWindowRateLimiter, createSlidingWindowLimiter } from "../../src/services/api/RateLimiter";

/**
 * Creates a rate limiter middleware using the sliding window algorithm.
 */
export function createRateLimiter(options: { windowMs: number; max: number; message: string }) {
  return createSlidingWindowLimiter(options);
}

// Map for tracking WebSocket connection attempts using sliding window
const wsLimiters = new Map<string, SlidingWindowRateLimiter>();

/**
 * Checks WebSocket connection attempts using sliding window rate limiting.
 */
export function checkWsRateLimit(ip: string, uid: string, maxConnections = 10, windowMs = 60000): boolean {
  const limiterKey = `${maxConnections}_${windowMs}`;
  let limiter = wsLimiters.get(limiterKey);
  
  if (!limiter) {
    limiter = new SlidingWindowRateLimiter({
      windowMs,
      max: maxConnections,
      message: "Exceeded connections limit"
    });
    wsLimiters.set(limiterKey, limiter);
  }

  const clientKey = `${ip}_${uid}`;
  const result = limiter.check(clientKey);
  return result.allowed;
}

// Explicit rate limiters as requested
export const chatLimiter = createRateLimiter({
  windowMs: 60000,
  max: 20,
  message: "Excedeu o limite de mensagens do chat (máximo 20 por minuto). Por favor, aguarde um momento."
});

export const mamboLimiter = createRateLimiter({
  windowMs: 60000,
  max: 20,
  message: "Excedeu o limite de mensagens do Mambo Chat (máximo 20 por minuto). Por favor, aguarde um momento."
});

export const feedbackLimiter = createRateLimiter({
  windowMs: 60000,
  max: 10,
  message: "Excedeu o limite de submissão de feedback (máximo 10 por minuto)."
});

export const explainPhraseLimiter = createRateLimiter({
  windowMs: 60000,
  max: 30,
  message: "Excedeu o limite de tradução/explicação (máximo 30 por minuto)."
});

export const quizGenerationLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: "Limite de geração de quizzes atingido. Aguarde antes de criar outro quiz."
});

export const quizSubmissionLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: "Limite de submissões de quiz atingido."
});

export const paymentsLimiter = createRateLimiter({
  windowMs: 60000,
  max: 10,
  message: "Excedeu o limite de tentativas de pagamento/checkout (máximo 10 por minuto)."
});
