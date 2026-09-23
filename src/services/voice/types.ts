/**
 * VoiceTutor Provider Types
 * Defines the interface for voice conversation providers (ASR/TTS)
 */

export interface VoiceTutorSessionConfig {
  language: string;
  dialect?: string;
  proficiency?: string;
  userId?: string;
  region?: string;
}

export interface VoiceTutorResponse {
  transcribedText: string;
  confidence: number;
  feedback?: string;
  timestamp: number;
}

export interface VoiceTutorMetrics {
  latencyMs: number;
  costUsd?: number;
  qualityScore?: number;
  provider: string;
}

export interface VoiceTutorSessionMetrics {
  sessionId: string;
  startTime: number;
  endTime?: number;
  totalLatencyMs: number;
  interruptCount?: number;
  estimatedCostUsd?: number;
  qualityScores: number[];
}

export interface VoiceTutorProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  startSession(config: VoiceTutorSessionConfig): Promise<string>;
  processAudio(sessionId: string, audioBlob: Blob): Promise<VoiceTutorResponse>;
  endSession(sessionId: string): Promise<VoiceTutorSessionMetrics>;
  getMetrics(sessionId: string): Promise<VoiceTutorMetrics>;
}
