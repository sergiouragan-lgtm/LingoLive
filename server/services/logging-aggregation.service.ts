import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface LogEntry {
  logId: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  context: Record<string, any>;
  timestamp: Date;
  service: string;
  userId?: string;
  sessionId?: string;
  traceId?: string;
  duration?: number; // milliseconds
}

export interface LogQuery {
  queryId: string;
  filters: LogFilter[];
  sortBy: 'timestamp' | 'level';
  limit: number;
  offset: number;
}

export interface LogFilter {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'greaterThan' | 'lessThan';
  value: any;
}

export interface LogIndex {
  indexId: string;
  name: string;
  fields: string[];
  createdAt: Date;
  totalLogsIndexed: number;
  size: number; // bytes
}

export interface LogRetentionPolicy {
  policyId: string;
  name: string;
  retentionDays: number;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  archiveAfterDays?: number;
  deleteAfterDays: number;
  active: boolean;
  createdAt: Date;
}

export interface LogAggregation {
  aggregationId: string;
  timeRange: { start: Date; end: Date };
  levelCounts: Record<string, number>;
  serviceCounts: Record<string, number>;
  totalLogs: number;
  uniqueUsers: number;
  uniqueSessions: number;
}

export interface LogSearchResult {
  resultId: string;
  query: string;
  matchCount: number;
  entries: LogEntry[];
  searchTime: number; // milliseconds
  executedAt: Date;
}

class LoggingAggregationService {
  private db = getFirestore();

  async createLogEntry(
    level: 'debug' | 'info' | 'warn' | 'error' | 'fatal',
    message: string,
    service: string,
    context: Record<string, any>,
    userId?: string,
    sessionId?: string,
    traceId?: string,
    duration?: number
  ): Promise<LogEntry> {
    try {
      const logId = `log_${Date.now()}`;

      const entry: LogEntry = {
        logId,
        level,
        message,
        context,
        timestamp: new Date(),
        service,
        userId,
        sessionId,
        traceId,
        duration,
      };

      await this.db.collection('logs').doc(logId).set(entry);

      logSecurityEvent('LOG_ENTRY_CREATED' as any, level as any, 'Log entry created', {
        logId,
        level,
        service,
        message,
      });

      return entry;
    } catch (error) {
      logSecurityEvent('LOG_ENTRY_CREATION_FAILED' as any, 'error' as any, 'Failed to create log entry', {
        service,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async searchLogs(
    query: string,
    filters?: LogFilter[],
    limit: number = 100
  ): Promise<LogSearchResult> {
    try {
      const resultId = `search_${Date.now()}`;
      const startTime = Date.now();

      let queryRef = this.db.collection('logs') as any;

      if (filters && filters.length > 0) {
        for (const filter of filters) {
          queryRef = queryRef.where(filter.field, this.mapOperator(filter.operator), filter.value);
        }
      }

      const snapshot = await queryRef.limit(limit).get();
      const entries = snapshot.docs.map((doc) => doc.data() as LogEntry);

      const searchTime = Date.now() - startTime;

      const result: LogSearchResult = {
        resultId,
        query,
        matchCount: entries.length,
        entries,
        searchTime,
        executedAt: new Date(),
      };

      logSecurityEvent('LOG_SEARCH_EXECUTED' as any, 'info' as any, 'Log search executed', {
        resultId,
        query,
        matchCount: entries.length,
        searchTime,
      });

      return result;
    } catch (error) {
      logSecurityEvent('LOG_SEARCH_FAILED' as any, 'error' as any, 'Failed to search logs', {
        query,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async createLogIndex(
    name: string,
    fields: string[]
  ): Promise<LogIndex> {
    try {
      const indexId = `index_${Date.now()}`;

      const index: LogIndex = {
        indexId,
        name,
        fields,
        createdAt: new Date(),
        totalLogsIndexed: 0,
        size: 0,
      };

      await this.db.collection('log_indexes').doc(indexId).set(index);

      logSecurityEvent('LOG_INDEX_CREATED' as any, 'info' as any, 'Log index created', {
        indexId,
        name,
        fields: fields.length,
      });

      return index;
    } catch (error) {
      logSecurityEvent('LOG_INDEX_CREATION_FAILED' as any, 'error' as any, 'Failed to create log index', {
        name,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async defineRetentionPolicy(
    name: string,
    retentionDays: number,
    level: 'debug' | 'info' | 'warn' | 'error' | 'fatal',
    deleteAfterDays: number,
    archiveAfterDays?: number
  ): Promise<LogRetentionPolicy> {
    try {
      const policyId = `policy_${Date.now()}`;

      const policy: LogRetentionPolicy = {
        policyId,
        name,
        retentionDays,
        level,
        archiveAfterDays,
        deleteAfterDays,
        active: true,
        createdAt: new Date(),
      };

      await this.db.collection('log_retention_policies').doc(policyId).set(policy);

      logSecurityEvent('LOG_RETENTION_POLICY_DEFINED' as any, 'info' as any, 'Log retention policy defined', {
        policyId,
        name,
        retentionDays,
        level,
      });

      return policy;
    } catch (error) {
      logSecurityEvent('LOG_RETENTION_POLICY_DEFINITION_FAILED' as any, 'error' as any, 'Failed to define log retention policy', {
        name,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async aggregateLogs(
    startTime: Date,
    endTime: Date
  ): Promise<LogAggregation> {
    try {
      const aggregationId = `agg_${Date.now()}`;

      const snapshot = await this.db.collection('logs')
        .where('timestamp', '>=', startTime)
        .where('timestamp', '<=', endTime)
        .get();

      const logs = snapshot.docs.map((doc) => doc.data() as LogEntry);

      const levelCounts: Record<string, number> = {};
      const serviceCounts: Record<string, number> = {};
      const userIds = new Set<string>();
      const sessionIds = new Set<string>();

      for (const log of logs) {
        levelCounts[log.level] = (levelCounts[log.level] || 0) + 1;
        serviceCounts[log.service] = (serviceCounts[log.service] || 0) + 1;
        if (log.userId) userIds.add(log.userId);
        if (log.sessionId) sessionIds.add(log.sessionId);
      }

      const aggregation: LogAggregation = {
        aggregationId,
        timeRange: { start: startTime, end: endTime },
        levelCounts,
        serviceCounts,
        totalLogs: logs.length,
        uniqueUsers: userIds.size,
        uniqueSessions: sessionIds.size,
      };

      await this.db.collection('log_aggregations').doc(aggregationId).set(aggregation);

      logSecurityEvent('LOGS_AGGREGATED' as any, 'info' as any, 'Logs aggregated', {
        aggregationId,
        totalLogs: logs.length,
        uniqueUsers: userIds.size,
      });

      return aggregation;
    } catch (error) {
      logSecurityEvent('LOG_AGGREGATION_FAILED' as any, 'error' as any, 'Failed to aggregate logs', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private mapOperator(operator: string): string {
    const operatorMap: Record<string, string> = {
      'equals': '==',
      'contains': 'array-contains',
      'startsWith': '>=',
      'greaterThan': '>',
      'lessThan': '<',
    };
    return operatorMap[operator] || '==';
  }
}

export const loggingAggregationService = new LoggingAggregationService();
