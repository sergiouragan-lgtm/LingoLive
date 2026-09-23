import { auth } from '../../firebase';
import {
  VoiceTutorProvider,
  VoiceTutorSessionConfig,
  VoiceTutorResponse,
  VoiceTutorMetrics,
  VoiceTutorSessionMetrics
} from './types';

interface GPTLiveSession {
  config: VoiceTutorSessionConfig;
  startTime: number;
  latencies: number[];
  costs: number[];
  interruptCount: number;
}

/**
 * ChatGPT Live-1 Adapter
 *
 * Spike Phase: Isolated implementation for technical validation
 * - Validates latency (target: <300ms P95 vs current ~150ms)
 * - Measures WER across regional dialects
 * - Estimates cost per minute
 * - Prototypes full-duplex interrupt handling
 *
 * NOT production-ready. Used only for spike metrics collection.
 */
export class GPTLiveAdapter implements VoiceTutorProvider {
  name = 'gpt-live-1-spike';
  private sessions = new Map<string, GPTLiveSession>();
  private sessionCounter = 0;
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;
  }

  async isAvailable(): Promise<boolean> {
    // Spike phase: available if API key is configured
    return !!(this.apiKey && auth.currentUser);
  }

  async startSession(config: VoiceTutorSessionConfig): Promise<string> {
    if (!(await this.isAvailable())) {
      throw new Error('GPTLiveAdapter not available: missing API key or user');
    }

    const sessionId = `gpt-live_${Date.now()}_${++this.sessionCounter}`;
    this.sessions.set(sessionId, {
      config,
      startTime: Date.now(),
      latencies: [],
      costs: [],
      interruptCount: 0
    });

    // TODO: Initialize GPT Live-1 session via OpenAI API
    // POST /v1/realtime/sessions (OpenAI Live API)
    console.log(`[GPTLiveAdapter] Session started: ${sessionId}`);

    return sessionId;
  }

  async processAudio(sessionId: string, audioBlob: Blob): Promise<VoiceTutorResponse> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const startTime = Date.now();

    try {
      // Spike TODO: Send audio to GPT Live-1 endpoint
      // Full-duplex WebSocket connection expected
      // Target latency: <300ms (including network)

      const transcribedText = await this.mockTranscribeWithGPTLive(
        audioBlob,
        session.config
      );

      const latencyMs = Date.now() - startTime;
      const costUsd = this.estimateCost(audioBlob.size);

      session.latencies.push(latencyMs);
      session.costs.push(costUsd);

      return {
        transcribedText,
        confidence: 0.93,
        timestamp: Date.now()
      };
    } catch (error) {
      throw new Error(`Failed to process audio with GPT Live: ${error}`);
    }
  }

  async endSession(sessionId: string): Promise<VoiceTutorSessionMetrics> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const endTime = Date.now();
    const totalLatencyMs = session.latencies.reduce((a, b) => a + b, 0);
    const estimatedCostUsd = session.costs.reduce((a, b) => a + b, 0);

    // TODO: Close GPT Live-1 session via OpenAI API
    console.log(`[GPTLiveAdapter] Session ended: ${sessionId}`);

    this.sessions.delete(sessionId);

    return {
      sessionId,
      startTime: session.startTime,
      endTime,
      totalLatencyMs,
      estimatedCostUsd,
      interruptCount: session.interruptCount,
      qualityScores: []
    };
  }

  async getMetrics(sessionId: string): Promise<VoiceTutorMetrics> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const avgLatency = session.latencies.length > 0
      ? session.latencies.reduce((a, b) => a + b, 0) / session.latencies.length
      : 0;

    const p95Latency = this.calculateP95(session.latencies);

    return {
      latencyMs: avgLatency,
      costUsd: session.costs.reduce((a, b) => a + b, 0),
      provider: this.name
    };
  }

  /**
   * SPIKE METRIC: Validate P95 latency
   * Current (Whisper): ~150ms
   * GPT Live target: <300ms
   */
  private calculateP95(latencies: number[]): number {
    if (latencies.length === 0) return 0;
    const sorted = [...latencies].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * 0.95) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Mock transcription for spike phase
   * Replaces actual GPT Live-1 call during development
   */
  private async mockTranscribeWithGPTLive(
    audioBlob: Blob,
    config: VoiceTutorSessionConfig
  ): Promise<string> {
    // Simulate network latency: 150-300ms
    const simulatedLatency = Math.random() * 150 + 150;
    await new Promise(resolve => setTimeout(resolve, simulatedLatency));

    // Mock response (would be actual transcription from GPT Live-1)
    return `[MOCK] Transcribed audio (${config.language}, dialect: ${config.dialect || 'standard'})`;
  }

  /**
   * SPIKE METRIC: Estimate cost per minute
   * OpenAI Live: ~$0.00015 per input token (estimated)
   * vs Whisper: ~$0.00006 per minute
   * Ratio: ~2.5x current solution
   */
  private estimateCost(audioSizeBytes: number): number {
    // Rough estimation: 1 minute ≈ 1.2MB = 1000-1500 tokens
    const estimatedMinutes = audioSizeBytes / (1.2 * 1024 * 1024);
    const estimatedTokens = estimatedMinutes * 1200;
    return estimatedTokens * 0.00015;
  }
}
