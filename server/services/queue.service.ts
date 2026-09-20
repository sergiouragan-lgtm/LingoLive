import Queue from 'bull';
import { createClient } from 'redis';

export enum JobType {
  SEND_EMAIL = 'send_email',
  GENERATE_REPORT = 'generate_report',
  EXPORT_DATA = 'export_data',
  BATCH_NOTIFICATION = 'batch_notification',
  PROCESS_PAYMENT = 'process_payment',
  GENERATE_CERTIFICATE = 'generate_certificate',
  SYNC_ANALYTICS = 'sync_analytics',
  CLEANUP_CACHE = 'cleanup_cache',
}

export interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  variables?: Record<string, any>;
  userId?: string;
}

export interface ReportJobData {
  userId: string;
  reportType: 'student_progress' | 'class_analytics' | 'revenue' | 'engagement';
  format: 'pdf' | 'csv' | 'json';
  dateRange?: { start: string; end: string };
}

export interface ExportJobData {
  userId: string;
  dataType: 'ebooks' | 'notes' | 'progress' | 'certificates';
  format: 'csv' | 'pdf' | 'json';
}

export interface BatchNotificationJobData {
  userIds: string[];
  title: string;
  message: string;
  type: 'achievement' | 'milestone' | 'promotion' | 'maintenance';
  metadata?: Record<string, any>;
}

export interface ProcessPaymentJobData {
  paymentId: string;
  userId: string;
  amount: number;
  currency: string;
  method: 'stripe' | 'paypal';
}

export interface CertificateJobData {
  userId: string;
  courseId: string;
  certificateType: 'completion' | 'achievement' | 'milestone';
}

export interface AnalyticsSyncJobData {
  sessionId?: string;
  batchSize?: number;
}

export interface CleanupJobData {
  type: 'old_sessions' | 'temp_files' | 'failed_jobs' | 'expired_tokens';
  olderThan?: number;
}

class QueueManager {
  private redisConnection: any;
  private queues: Map<JobType, Queue.Queue> = new Map();
  private queueConfig = {
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: {
        age: 3600, // Keep completed jobs for 1 hour
      },
      removeOnFail: {
        age: 86400, // Keep failed jobs for 24 hours
      },
    },
  };

  constructor() {
    this.initializeRedis();
    this.initializeQueues();
    this.setupEventHandlers();
  }

  private initializeRedis(): void {
    // Using Bull's built-in Redis connection management
    // Will attempt to connect to localhost:6379 by default
    console.log('Queue manager initialized (using Bull Redis client)');
  }

  private initializeQueues(): void {
    Object.values(JobType).forEach((jobType) => {
      const queue = new Queue(jobType, {
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
        },
        ...this.queueConfig,
      });

      this.queues.set(jobType as JobType, queue);

      queue.on('error', (err) => {
        console.error(`Queue ${jobType} error:`, err);
      });

      queue.on('completed', (job) => {
        console.log(`[${jobType}] Job ${job.id} completed`, {
          duration: job.finishedOn - job.processedOn,
        });
      });

      queue.on('failed', (job, err) => {
        console.error(`[${jobType}] Job ${job.id} failed:`, err.message);
      });
    });
  }

  private setupEventHandlers(): void {
    this.queues.forEach((queue) => {
      queue.on('error', (error) => {
        console.error(`Queue error in ${queue.name}:`, error);
      });

      queue.on('waiting', (jobId) => {
        console.log(`Job ${jobId} is waiting to be processed`);
      });

      queue.on('active', (job) => {
        console.log(`Job ${job.id} is now active`);
      });
    });
  }

  public async addJob<T>(
    jobType: JobType,
    data: T,
    options?: Queue.JobOptions
  ): Promise<Queue.Job<T>> {
    const queue = this.getQueue(jobType);
    return queue.add(data, {
      ...this.queueConfig.defaultJobOptions,
      ...options,
    });
  }

  public async addDelayedJob<T>(
    jobType: JobType,
    data: T,
    delayMs: number
  ): Promise<Queue.Job<T>> {
    const queue = this.getQueue(jobType);
    return queue.add(data, {
      ...this.queueConfig.defaultJobOptions,
      delay: delayMs,
    });
  }

  public async addScheduledJob<T>(
    jobType: JobType,
    data: T,
    cronExpression: string
  ): Promise<Queue.Job<T>> {
    const queue = this.getQueue(jobType);
    return queue.add(data, {
      ...this.queueConfig.defaultJobOptions,
      repeat: {
        cron: cronExpression,
      },
    });
  }

  public async addBulkJobs<T>(
    jobType: JobType,
    dataArray: T[]
  ): Promise<Queue.Job<T>[]> {
    const queue = this.getQueue(jobType);
    const jobs = dataArray.map((data) => ({
      name: jobType,
      data,
      opts: this.queueConfig.defaultJobOptions,
    }));

    const result = await queue.addBulk(jobs);
    return result as any;
  }

  public getQueue(jobType: JobType): Queue.Queue {
    const queue = this.queues.get(jobType);
    if (!queue) {
      throw new Error(`Queue ${jobType} not initialized`);
    }
    return queue;
  }

  public async getJobStats(jobType: JobType): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const queue = this.getQueue(jobType);
    return {
      waiting: await queue.count(),
      active: await queue.getActiveCount(),
      completed: await queue.getCompletedCount(),
      failed: await queue.getFailedCount(),
      delayed: await queue.getDelayedCount(),
    };
  }

  public async getJob(jobType: JobType, jobId: string | number): Promise<Queue.Job | undefined> {
    const queue = this.getQueue(jobType);
    return queue.getJob(jobId);
  }

  public async retryJob(jobType: JobType, jobId: string | number): Promise<Queue.Job | undefined> {
    const queue = this.getQueue(jobType);
    const job = await queue.getJob(jobId);
    if (job) {
      await job.retry();
    }
    return job;
  }

  public async cancelJob(jobType: JobType, jobId: string | number): Promise<void> {
    const queue = this.getQueue(jobType);
    const job = await queue.getJob(jobId);
    if (job) {
      await job.remove();
    }
  }

  public async pauseQueue(jobType: JobType): Promise<void> {
    const queue = this.getQueue(jobType);
    await queue.pause();
  }

  public async resumeQueue(jobType: JobType): Promise<void> {
    const queue = this.getQueue(jobType);
    await queue.resume();
  }

  public async clearQueue(jobType: JobType): Promise<number> {
    const queue = this.getQueue(jobType);
    const result = await queue.clean(0, 'completed');
    return Array.isArray(result) ? result.length : (result as any);
  }

  public registerProcessor(
    jobType: JobType,
    processor: (job: Queue.Job) => Promise<any>,
    concurrency?: number
  ): void {
    const queue = this.getQueue(jobType);
    queue.process(concurrency || 5, processor);
  }

  public async shutdown(): Promise<void> {
    for (const queue of this.queues.values()) {
      await queue.close();
    }
    console.log('Queue manager shutdown complete');
  }

  public getQueueStatus(): Map<JobType, Promise<any>> {
    const status = new Map();
    this.queues.forEach((queue, jobType) => {
      status.set(jobType, this.getJobStats(jobType));
    });
    return status;
  }
}

export const queueManager = new QueueManager();
