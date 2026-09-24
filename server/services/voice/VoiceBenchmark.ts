import { VoiceProvider, VoiceGenerationResult } from "./VoiceProvider";
import { VoiceProviderFactory } from "./VoiceProviderFactory";

/**
 * Comprehensive benchmark suite for voice providers
 * Measures: latency, cost, pronunciation quality, natural interruption, dialect support
 */

export interface BenchmarkResult {
  provider: string;
  testCase: string;
  metrics: {
    latencyMs: number;
    audioSizeBytes: number;
    estimatedCostUSD: number;
    costPerMinute: number;
    audioQualityScore?: number; // 1-10 scale (subjective)
    pronunciationScore?: number; // 1-10 scale
    naturalInterruptionScore?: number; // 1-10 scale
    dialectSupportScore?: number; // 1-10 scale
  };
  timestamp: string;
  success: boolean;
  error?: string;
}

export interface BenchmarkComparison {
  testCases: BenchmarkResult[][];
  summary: {
    providers: Array<{
      name: string;
      avgLatencyMs: number;
      avgCost: number;
      avgQualityScore: number;
      healthStatus: boolean;
    }>;
    winner?: {
      latency: string;
      cost: string;
      quality: string;
      balanced: string;
    };
  };
}

export class VoiceBenchmark {
  /**
   * Standard test cases covering various scenarios
   */
  private static readonly TEST_CASES = {
    SHORT: "Hello, how are you?",
    MEDIUM: "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet.",
    LONG: "Language learning is a fascinating journey that opens doors to new cultures, perspectives, and opportunities. With modern technology, it has become more accessible than ever before. Whether you're learning Portuguese, Spanish, or any other language, consistent practice and immersion are key to success.",
    PORTUGUESE: "Olá, como você está? Aprender um novo idioma é uma jornada fascinante.",
    SPANISH: "Hola, ¿cómo estás? Aprender un nuevo idioma es un viaje fascinante.",
    NUMBERS: "The year is 2024. The temperature is 23.5 degrees. We need 10 to 15 items.",
    PUNCTUATION: "Wait! Are you sure? Yes, definitely. Well... maybe.",
  };

  /**
   * Run benchmarks on all providers with standard test cases
   */
  static async benchmarkAll(): Promise<BenchmarkComparison> {
    const providers = VoiceProviderFactory.getAllProviders();
    const allResults: BenchmarkResult[][] = [];

    console.log("[VoiceBenchmark] Starting comprehensive benchmark...\n");

    for (const [providerType, provider] of providers) {
      const results = await this._benchmarkProvider(provider);
      allResults.push(results);
    }

    return this._compileSummary(allResults);
  }

  /**
   * Benchmark a specific provider
   */
  static async benchmarkProvider(providerType: string): Promise<BenchmarkResult[]> {
    const provider = VoiceProviderFactory.getProvider(providerType as any);
    return this._benchmarkProvider(provider);
  }

  /**
   * Compare two providers side-by-side
   */
  static async compareProviders(
    provider1Type: string,
    provider2Type: string
  ): Promise<BenchmarkComparison> {
    const provider1 = VoiceProviderFactory.getProvider(provider1Type as any);
    const provider2 = VoiceProviderFactory.getProvider(provider2Type as any);

    const results1 = await this._benchmarkProvider(provider1);
    const results2 = await this._benchmarkProvider(provider2);

    return this._compileSummary([results1, results2]);
  }

  /**
   * Test a specific text with all providers
   */
  static async testText(text: string): Promise<BenchmarkResult[]> {
    const providers = VoiceProviderFactory.getAllProviders();
    const results: BenchmarkResult[] = [];

    for (const [_, provider] of providers) {
      const result = await this._testSingleCase(provider, text, "custom");
      results.push(result);
    }

    return results;
  }

  /**
   * Internal: benchmark single provider against all test cases
   */
  private static async _benchmarkProvider(provider: VoiceProvider): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];
    const costPerMinute = await provider.estimateCostPerMinute();

    console.log(`\n[${provider.name}] Running benchmark tests...`);

    for (const [caseKey, text] of Object.entries(this.TEST_CASES)) {
      const result = await this._testSingleCase(provider, text, caseKey);
      result.metrics.costPerMinute = costPerMinute;
      results.push(result);

      // Log progress
      const status = result.success ? "✓" : "✗";
      console.log(
        `  ${status} ${caseKey.padEnd(15)} | Latency: ${result.metrics.latencyMs}ms | Size: ${result.metrics.audioSizeBytes} bytes | Cost: $${result.metrics.estimatedCostUSD.toFixed(6)}`
      );
    }

    return results;
  }

  /**
   * Internal: test a single text case
   */
  private static async _testSingleCase(
    provider: VoiceProvider,
    text: string,
    testCase: string
  ): Promise<BenchmarkResult> {
    try {
      const result = await provider.generateSpeech(text);

      // Score quality (subjective - would be manual evaluation in production)
      const audioQualityScore = this._estimateQualityScore(result);
      const pronunciationScore = this._estimatePronunciationScore(text, provider);
      const naturalInterruptionScore = this._estimateNaturalInterruptionScore(provider);

      // Detect dialect support based on text language
      const language = this._detectLanguage(text);
      const dialectScore = await provider.supportsLanguage(language) ? 10 : 5;

      return {
        provider: provider.name,
        testCase,
        metrics: {
          latencyMs: result.metrics.latencyMs,
          audioSizeBytes: result.metrics.audioSize,
          estimatedCostUSD: result.metrics.estimatedCost,
          costPerMinute: 0, // Set by caller
          audioQualityScore,
          pronunciationScore,
          naturalInterruptionScore,
          dialectSupportScore: dialectScore,
        },
        timestamp: new Date().toISOString(),
        success: true,
      };
    } catch (error) {
      return {
        provider: provider.name,
        testCase,
        metrics: {
          latencyMs: 0,
          audioSizeBytes: 0,
          estimatedCostUSD: 0,
          costPerMinute: 0,
        },
        timestamp: new Date().toISOString(),
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Compile benchmark summary with winner determination
   */
  private static _compileSummary(allResults: BenchmarkResult[][]): BenchmarkComparison {
    const summary: BenchmarkComparison = {
      testCases: allResults,
      summary: {
        providers: [],
      },
    };

    // Calculate averages per provider
    for (const results of allResults) {
      if (results.length === 0) continue;

      const providerName = results[0].provider;
      const successfulResults = results.filter((r) => r.success);

      if (successfulResults.length === 0) {
        summary.summary.providers.push({
          name: providerName,
          avgLatencyMs: 0,
          avgCost: 0,
          avgQualityScore: 0,
          healthStatus: false,
        });
        continue;
      }

      const avgLatency =
        successfulResults.reduce((sum, r) => sum + r.metrics.latencyMs, 0) /
        successfulResults.length;

      const avgCost =
        successfulResults.reduce((sum, r) => sum + r.metrics.estimatedCostUSD, 0) /
        successfulResults.length;

      const avgQuality =
        successfulResults.reduce((sum, r) => sum + (r.metrics.audioQualityScore || 0), 0) /
        successfulResults.length;

      summary.summary.providers.push({
        name: providerName,
        avgLatencyMs: Math.round(avgLatency),
        avgCost: parseFloat(avgCost.toFixed(6)),
        avgQualityScore: parseFloat(avgQuality.toFixed(1)),
        healthStatus: successfulResults.length === results.length,
      });
    }

    // Determine winners in each category
    if (summary.summary.providers.length > 1) {
      summary.summary.winner = {
        latency: summary.summary.providers.reduce((min, p) =>
          p.avgLatencyMs < min.avgLatencyMs ? p : min
        ).name,
        cost: summary.summary.providers.reduce((min, p) =>
          p.avgCost < min.avgCost ? p : min
        ).name,
        quality: summary.summary.providers.reduce((max, p) =>
          p.avgQualityScore > max.avgQualityScore ? p : max
        ).name,
        balanced: this._determineBalancedWinner(summary.summary.providers),
      };
    }

    return summary;
  }

  /**
   * Utility: estimate quality score (would be manual evaluation)
   */
  private static _estimateQualityScore(result: VoiceGenerationResult): number {
    // Heuristic: larger audio = better quality (more detailed encoding)
    // In production: use human evaluation or speech quality metrics
    const sizeScore = Math.min(10, Math.ceil(result.metrics.audioSize / 2000));
    return sizeScore;
  }

  /**
   * Utility: estimate pronunciation score based on provider
   */
  private static _estimatePronunciationScore(text: string, provider: VoiceProvider): number {
    // Heuristic: ElevenLabs specializes in pronunciation, Gemini is more conversational
    if (provider.name === "ElevenLabs") {
      return 9;
    } else if (provider.name === "Gemini Live") {
      return 8;
    }
    return 7;
  }

  /**
   * Utility: estimate natural interruption support
   */
  private static _estimateNaturalInterruptionScore(provider: VoiceProvider): number {
    // Gemini Live has streaming and natural interruption support
    if (provider.name === "Gemini Live") {
      return 9;
    } else if (provider.name === "ElevenLabs") {
      return 7; // Supports chunked streaming but less natural interruption
    }
    return 5;
  }

  /**
   * Utility: detect language from text
   */
  private static _detectLanguage(text: string): string {
    // Simple heuristic detection
    if (text.includes("português") || text.includes("Português")) return "pt";
    if (text.includes("espanol") || text.includes("Español")) return "es";
    if (/[á-ü]/.test(text) && text.toLowerCase().includes("como")) return "pt";
    return "en";
  }

  /**
   * Utility: determine balanced winner
   */
  private static _determineBalancedWinner(
    providers: Array<{
      name: string;
      avgLatencyMs: number;
      avgCost: number;
      avgQualityScore: number;
    }>
  ): string {
    // Score: lower latency and cost, higher quality
    // Normalize scores 0-1
    const scores = providers.map((p) => {
      const latencyScore = 1 - Math.min(p.avgLatencyMs / 5000, 1); // 5s is max
      const costScore = 1 - Math.min(p.avgCost / 0.01, 1); // $0.01 is max
      const qualityScore = p.avgQualityScore / 10;

      return {
        name: p.name,
        balancedScore: latencyScore * 0.33 + costScore * 0.33 + qualityScore * 0.34,
      };
    });

    return scores.reduce((max, p) => (p.balancedScore > max.balancedScore ? p : max)).name;
  }
}
