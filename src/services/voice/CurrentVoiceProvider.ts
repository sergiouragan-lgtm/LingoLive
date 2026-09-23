import { auth } from '../../firebase';
import { WhisperService } from '../audio/whisper';
import {
  VoiceTutorProvider,
  VoiceTutorSessionConfig,
  VoiceTutorResponse,
  VoiceTutorMetrics,
  VoiceTutorSessionMetrics
} from './types';

interface SessionState {
  config: VoiceTutorSessionConfig;
  startTime: number;
  latencies: number[];
  costs: number[];
}

export class CurrentVoiceProvider implements VoiceTutorProvider {
  name = 'current-whisper';
  private sessions = new Map<string, SessionState>();
  private sessionCounter = 0;

  async isAvailable(): Promise<boolean> {
    return auth.currentUser !== null;
  }

  async startSession(config: VoiceTutorSessionConfig): Promise<string> {
    const sessionId = `session_${Date.now()}_${++this.sessionCounter}`;
    this.sessions.set(sessionId, {
      config,
      startTime: Date.now(),
      latencies: [],
      costs: []
    });
    return sessionId;
  }

  async processAudio(sessionId: string, audioBlob: Blob): Promise<VoiceTutorResponse> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const startTime = Date.now();

    try {
      const transcribedText = await WhisperService.transcribe(
        audioBlob,
        session.config.language
      );

      const latencyMs = Date.now() - startTime;
      const costUsd = this.estimateCost(audioBlob.size);

      session.latencies.push(latencyMs);
      session.costs.push(costUsd);

      return {
        transcribedText,
        confidence: 0.95,
        timestamp: Date.now()
      };
    } catch (error) {
      throw new Error(`Failed to process audio: ${error}`);
    }
  }

  async endSession(sessionId: string): Promise<VoiceTutorSessionMetrics> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const endTime = Date.now();
    const totalLatencyMs = session.latencies.reduce((a, b) => a + b, 0);
    const estimatedCostUsd = session.costs.reduce((a, b) => a + b, 0);

    this.sessions.delete(sessionId);

    return {
      sessionId,
      startTime: session.startTime,
      endTime,
      totalLatencyMs,
      estimatedCostUsd,
      qualityScores: []
    };
  }

  async getMetrics(sessionId: string): Promise<VoiceTutorMetrics> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const avgLatency = session.latencies.length > 0
      ? session.latencies.reduce((a, b) => a + b, 0) / session.latencies.length
      : 0;

    return {
      latencyMs: avgLatency,
      costUsd: session.costs.reduce((a, b) => a + b, 0),
      provider: this.name
    };
  }

  private estimateCost(audioSizeBytes: number): number {
    // Current Whisper: ~$0.00006 per minute audio
    // Rough estimate: 1 minute ≈ 1.2MB
    const estimatedMinutes = audioSizeBytes / (1.2 * 1024 * 1024);
    return estimatedMinutes * 0.00006;
  }
}
