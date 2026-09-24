import { Router, Request, Response } from "express";
import { VoiceService } from "../services/voice/VoiceService";
import { VoiceBenchmark } from "../services/voice/VoiceBenchmark";
import { VoiceProviderFactory } from "../services/voice/VoiceProviderFactory";

const router = Router();

/**
 * POST /api/voice/generate
 * Generate speech using the active provider
 */
router.post("/generate", async (req: Request, res: Response) => {
  try {
    const { text, language, voiceId } = req.body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ error: "Text is required and must be non-empty" });
    }

    const result = await VoiceService.generateSpeech(text, {
      language,
      voiceId,
    });

    res.set("Content-Type", "audio/mpeg");
    res.set("X-Voice-Provider", result.provider);
    if (result.metrics) {
      res.set("X-Voice-Latency-Ms", String(result.metrics.latencyMs));
      res.set("X-Voice-Cost-Usd", String(result.metrics.estimatedCostUSD));
    }

    res.send(result.audio);
  } catch (error) {
    console.error("[VoiceBenchmark] Generate error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Speech generation failed",
    });
  }
});

/**
 * GET /api/voice/config
 * Get current voice provider configuration
 */
router.get("/config", async (req: Request, res: Response) => {
  try {
    const config = await VoiceService.getConfiguration();
    res.json(config);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get config",
    });
  }
});

/**
 * POST /api/voice/switch-provider
 * Switch the active voice provider
 */
router.post("/switch-provider", async (req: Request, res: Response) => {
  try {
    const { provider } = req.body;

    if (!provider || !["elevenlabs", "gemini-live"].includes(provider)) {
      return res.status(400).json({
        error: "Provider must be 'elevenlabs' or 'gemini-live'",
      });
    }

    VoiceService.switchProvider(provider);
    const config = await VoiceService.getConfiguration();

    res.json({
      message: `Switched to ${provider}`,
      config,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to switch provider",
    });
  }
});

/**
 * POST /api/voice/benchmark-mode
 * Enable/disable benchmark mode for logging metrics
 */
router.post("/benchmark-mode", (req: Request, res: Response) => {
  try {
    const { enabled } = req.body;

    if (typeof enabled !== "boolean") {
      return res.status(400).json({ error: "Enabled must be a boolean" });
    }

    VoiceService.setBenchmarkMode(enabled);

    res.json({
      message: `Benchmark mode ${enabled ? "enabled" : "disabled"}`,
      benchmarkMode: enabled,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to set benchmark mode",
    });
  }
});

/**
 * GET /api/voice/health
 * Health check for active provider
 */
router.get("/health", async (req: Request, res: Response) => {
  try {
    const health = await VoiceService.healthCheck();
    res.json(health);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Health check failed",
    });
  }
});

/**
 * GET /api/voice/voices
 * Get available voices from active provider
 */
router.get("/voices", async (req: Request, res: Response) => {
  try {
    const voices = await VoiceService.getAvailableVoices();
    res.json({ voices });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get voices",
    });
  }
});

/**
 * GET /api/voice/cost/:provider
 * Get estimated cost per minute for a provider
 */
router.get("/cost/:provider", async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;

    if (!["elevenlabs", "gemini-live"].includes(provider)) {
      return res.status(400).json({
        error: "Provider must be 'elevenlabs' or 'gemini-live'",
      });
    }

    const costPerMinute = await VoiceService.getCostPerMinute(provider as any);

    res.json({
      provider,
      costPerMinuteUSD: costPerMinute,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get cost",
    });
  }
});

/**
 * POST /api/voice/benchmark/run
 * Run comprehensive benchmark on all providers
 * Response: detailed comparison with winners in each category
 */
router.post("/benchmark/run", async (req: Request, res: Response) => {
  try {
    console.log("[VoiceBenchmark] Starting full benchmark suite...");
    const startTime = Date.now();

    const results = await VoiceBenchmark.benchmarkAll();

    const duration = Date.now() - startTime;

    res.json({
      results,
      benchmark: {
        duration_ms: duration,
        timestamp: new Date().toISOString(),
        testCaseCount: VoiceBenchmark["TEST_CASES"] ? Object.keys(VoiceBenchmark["TEST_CASES"]).length : 0,
      },
    });
  } catch (error) {
    console.error("[VoiceBenchmark] Benchmark error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Benchmark failed",
    });
  }
});

/**
 * POST /api/voice/benchmark/compare
 * Compare two specific providers
 */
router.post("/benchmark/compare", async (req: Request, res: Response) => {
  try {
    const { provider1, provider2 } = req.body;

    if (!provider1 || !provider2) {
      return res.status(400).json({
        error: "Both provider1 and provider2 are required",
      });
    }

    const results = await VoiceBenchmark.compareProviders(provider1, provider2);

    res.json({
      comparison: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Comparison failed",
    });
  }
});

/**
 * POST /api/voice/benchmark/test-text
 * Test a custom text with all providers
 */
router.post("/benchmark/test-text", async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required" });
    }

    const results = await VoiceBenchmark.testText(text);

    res.json({
      text,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Test failed",
    });
  }
});

export default router;
