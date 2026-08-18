export type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'NOTICE' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'FATAL';

export interface LogMetadata {
  timestamp: string;
  requestId: string;
  correlationId?: string;
  traceId?: string;
  sessionId?: string;
  tenantId?: string;
  userId?: string;
  module: string;
  component: string;
  environment: string;
  version: string;
  severity: LogLevel;
  operation: string;
  executionTimeMs?: number;
  status?: string;
  device?: string;
  country?: string;
  language?: string;
}

export interface LogEntry {
  message: string;
  metadata: LogMetadata;
  context?: Record<string, any>;
}
