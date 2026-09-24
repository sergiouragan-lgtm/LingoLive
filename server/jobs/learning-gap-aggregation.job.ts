import Queue from 'bull';
import redis from 'redis';
import { learningGapAggregationService } from '../services/learning-gap-aggregation.service';
import { logSecurityEvent } from '../services/security.event.logger';

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

/**
 * Bull queue for learning gap aggregation
 * Runs periodically to aggregate student errors into learning gaps
 */
export const learningGapAggregationQueue = new Queue('learning-gap-aggregation', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  settings: {
    // Remove job after 1 week
    removeOnComplete: { age: 604800 },
    removeOnFail: { age: 1209600 },
  },
});

/**
 * Process the aggregation job
 */
learningGapAggregationQueue.process(async (job) => {
  try {
    console.log('[Learning Gap Aggregation] Starting aggregation job', job.id);

    // Track progress
    job.progress(10);

    const limitUsers = job.data?.limitUsers;
    const stats = await learningGapAggregationService.aggregateAllGaps(limitUsers);

    job.progress(90);

    console.log('[Learning Gap Aggregation] Completed:', stats);
    logSecurityEvent(
      'LEARNING_GAP_JOB_COMPLETED' as any,
      'info' as any,
      `Job completed: ${stats.gapsCreated} gaps, ${stats.usersAffected} users, ${stats.executionTimeMs}ms`
    );

    job.progress(100);
    return { success: true, stats };
  } catch (error) {
    console.error('[Learning Gap Aggregation] Error:', error);
    logSecurityEvent(
      'LEARNING_GAP_JOB_FAILED' as any,
      'error' as any,
      `Job failed: ${(error as Error).message}`
    );
    throw error;
  }
});

/**
 * Job completion handler
 */
learningGapAggregationQueue.on('completed', (job, result) => {
  console.log(`[Learning Gap Aggregation] Job ${job.id} completed:`, result);
});

/**
 * Job failure handler
 */
learningGapAggregationQueue.on('failed', (job, err) => {
  console.error(`[Learning Gap Aggregation] Job ${job.id} failed:`, err.message);
});

/**
 * Repeat configuration - runs every 6 hours
 */
export async function scheduleAggregationJob(): Promise<void> {
  try {
    // Remove existing jobs to avoid duplicates
    await learningGapAggregationQueue.clean(0, 'active');
    await learningGapAggregationQueue.clean(0, 'wait');

    // Add recurring job every 6 hours
    await learningGapAggregationQueue.add(
      { limitUsers: undefined },
      {
        repeat: {
          cron: '0 */6 * * *', // Every 6 hours
        },
        jobId: 'aggregation-recurring',
        removeOnComplete: true,
      }
    );

    console.log('[Learning Gap Aggregation] Scheduled recurring job (every 6 hours)');
  } catch (error) {
    console.error('[Learning Gap Aggregation] Failed to schedule:', error);
    throw error;
  }
}

/**
 * Trigger immediate aggregation (manual or for testing)
 */
export async function triggerAggregationNow(limitUsers?: number): Promise<any> {
  try {
    const job = await learningGapAggregationQueue.add(
      { limitUsers },
      {
        priority: 10, // Higher priority for manual triggers
        timeout: 60000, // 60 second timeout
      }
    );

    console.log('[Learning Gap Aggregation] Manual aggregation triggered, job ID:', job.id);
    return job;
  } catch (error) {
    console.error('[Learning Gap Aggregation] Failed to trigger:', error);
    throw error;
  }
}

/**
 * Get queue stats
 */
export async function getAggregationQueueStats(): Promise<any> {
  try {
    const counts = await learningGapAggregationQueue.getJobCounts();
    const latestJobs = await learningGapAggregationQueue.getLatestCompleted(5);

    return {
      counts,
      latestJobs: latestJobs.map(job => ({
        id: job.id,
        state: job._state,
        progress: job.progress(),
        finishedOn: job.finishedOn,
        failedReason: job.failedReason,
      })),
    };
  } catch (error) {
    console.error('[Learning Gap Aggregation] Error fetching stats:', error);
    throw error;
  }
}
