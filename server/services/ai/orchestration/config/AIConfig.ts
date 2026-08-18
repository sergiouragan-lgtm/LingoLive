export interface ModelMetadata {
  id: string;
  provider: "openai" | "google" | "vertex";
  name: string;
  costPer1kInputTokens: number; // in USD
  costPer1kOutputTokens: number; // in USD
  latencyIndex: number; // 1-10 (lower is faster)
  maxContextTokens: number;
}

export interface ProviderConfig {
  enabled: boolean;
  apiKey: string | undefined;
  fallbackProvider?: "openai" | "google" | "vertex";
  weight: number; // Traffic routing preference weight
}

export interface AIOrchestrationConfig {
  providers: {
    openai: ProviderConfig;
    google: ProviderConfig;
    vertex: ProviderConfig;
  };
  models: {
    basic: ModelMetadata;
    complex: ModelMetadata;
    image: ModelMetadata;
  };
  rateLimits: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  retryStrategy: {
    maxAttempts: number;
    initialDelayMs: number;
    backoffFactor: number;
  };
  safety: {
    moderationEnabled: boolean;
    blockSensitiveKeywords: boolean;
    sensitiveKeywords: string[];
  };
}

export const AI_CONFIG: AIOrchestrationConfig = {
  providers: {
    openai: {
      enabled: !!process.env.OPENAI_API_KEY,
      apiKey: process.env.OPENAI_API_KEY,
      fallbackProvider: "google",
      weight: 40,
    },
    google: {
      enabled: !!process.env.GEMINI_API_KEY,
      apiKey: process.env.GEMINI_API_KEY,
      fallbackProvider: "openai",
      weight: 60,
    },
    vertex: {
      enabled: !!process.env.GOOGLE_APPLICATION_CREDENTIALS || !!process.env.GEMINI_API_KEY,
      apiKey: process.env.GEMINI_API_KEY,
      fallbackProvider: "google",
      weight: 0, // Used mostly for enterprise/private cloud deployments
    }
  },
  models: {
    basic: {
      id: "gemini-3.5-flash",
      provider: "google",
      name: "Gemini 3.5 Flash",
      costPer1kInputTokens: 0.000075,
      costPer1kOutputTokens: 0.0003,
      latencyIndex: 2,
      maxContextTokens: 1048576,
    },
    complex: {
      id: "gpt-4o",
      provider: "openai",
      name: "GPT-4o",
      costPer1kInputTokens: 0.005,
      costPer1kOutputTokens: 0.015,
      latencyIndex: 5,
      maxContextTokens: 128000,
    },
    image: {
      id: "gemini-3.1-flash-lite-image",
      provider: "google",
      name: "Gemini Image Generator",
      costPer1kInputTokens: 0,
      costPer1kOutputTokens: 0.03, // Cost per generation flat
      latencyIndex: 6,
      maxContextTokens: 1000,
    }
  },
  rateLimits: {
    requestsPerMinute: 60,
    tokensPerMinute: 40000,
  },
  retryStrategy: {
    maxAttempts: 3,
    initialDelayMs: 1000,
    backoffFactor: 2,
  },
  safety: {
    moderationEnabled: true,
    blockSensitiveKeywords: true,
    sensitiveKeywords: [
      "hacker", "exploit", "ransomware", "cyberwar", "phishing",
      "malware", "virus", "trojan", "illegal", "drugs"
    ]
  }
};
