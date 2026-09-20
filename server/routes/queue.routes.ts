import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { queueManager, JobType, EmailJobData, ReportJobData, ExportJobData, BatchNotificationJobData } from '../services/queue.service';

const router = Router();

/**
 * @swagger
 * /queue/jobs/email:
 *   post:
 *     summary: Queue an email job
 *     tags:
 *       - Queue
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               to:
 *                 type: string
 *               subject:
 *                 type: string
 *               template:
 *                 type: string
 *               variables:
 *                 type: object
 */
router.post('/jobs/email', requireAuth, async (req: any, res) => {
  try {
    const { to, subject, template, variables } = req.body;

    if (!to || !subject || !template) {
      return res.status(400).json({
        error: 'Missing required fields: to, subject, template',
      });
    }

    const emailData: EmailJobData = {
      to,
      subject,
      template,
      variables,
      userId: req.user?.uid,
    };

    const job = await queueManager.addJob(JobType.SEND_EMAIL, emailData);

    res.json({
      success: true,
      jobId: job.id,
      status: 'queued',
      jobType: JobType.SEND_EMAIL,
    });
  } catch (error: any) {
    console.error('Error queuing email job:', error);
    res.status(500).json({ error: 'Failed to queue email job' });
  }
});

/**
 * @swagger
 * /queue/jobs/report:
 *   post:
 *     summary: Queue a report generation job
 *     tags:
 *       - Queue
 *     security:
 *       - bearerAuth: []
 */
router.post('/jobs/report', requireAuth, async (req: any, res) => {
  try {
    const { reportType, format, dateRange } = req.body;

    if (!reportType || !format) {
      return res.status(400).json({
        error: 'Missing required fields: reportType, format',
      });
    }

    const reportData: ReportJobData = {
      userId: req.user?.uid,
      reportType,
      format,
      dateRange,
    };

    const job = await queueManager.addJob(JobType.GENERATE_REPORT, reportData);

    res.json({
      success: true,
      jobId: job.id,
      status: 'queued',
      jobType: JobType.GENERATE_REPORT,
    });
  } catch (error: any) {
    console.error('Error queuing report job:', error);
    res.status(500).json({ error: 'Failed to queue report job' });
  }
});

/**
 * @swagger
 * /queue/jobs/export:
 *   post:
 *     summary: Queue a data export job
 *     tags:
 *       - Queue
 *     security:
 *       - bearerAuth: []
 */
router.post('/jobs/export', requireAuth, async (req: any, res) => {
  try {
    const { dataType, format } = req.body;

    if (!dataType || !format) {
      return res.status(400).json({
        error: 'Missing required fields: dataType, format',
      });
    }

    const exportData: ExportJobData = {
      userId: req.user?.uid,
      dataType,
      format,
    };

    const job = await queueManager.addJob(JobType.EXPORT_DATA, exportData);

    res.json({
      success: true,
      jobId: job.id,
      status: 'queued',
      jobType: JobType.EXPORT_DATA,
    });
  } catch (error: any) {
    console.error('Error queuing export job:', error);
    res.status(500).json({ error: 'Failed to queue export job' });
  }
});

/**
 * @swagger
 * /queue/jobs/{jobType}/{jobId}:
 *   get:
 *     summary: Get job status
 *     tags:
 *       - Queue
 *     parameters:
 *       - in: path
 *         name: jobType
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/jobs/:jobType/:jobId', requireAuth, async (req: any, res) => {
  try {
    const { jobType, jobId } = req.params;

    if (!Object.values(JobType).includes(jobType)) {
      return res.status(400).json({ error: 'Invalid job type' });
    }

    const job = await queueManager.getJob(jobType as JobType, jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const isCompleted = await job.isCompleted();
    const isFailed = await job.isFailed();
    const isActive = await job.isActive();

    res.json({
      jobId: job.id,
      jobType,
      state: isCompleted ? 'completed' : isFailed ? 'failed' : isActive ? 'active' : 'waiting',
      progress: job.progress(),
      data: job.data,
      result: isCompleted ? job.returnvalue : null,
      failedReason: isFailed ? job.failedReason : null,
      attempts: job.attemptsMade,
      maxAttempts: job.opts.attempts,
    });
  } catch (error: any) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

/**
 * @swagger
 * /queue/stats/{jobType}:
 *   get:
 *     summary: Get queue statistics for job type
 *     tags:
 *       - Queue
 *     parameters:
 *       - in: path
 *         name: jobType
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/stats/:jobType', requireAuth, async (req: any, res) => {
  try {
    const { jobType } = req.params;

    if (!Object.values(JobType).includes(jobType)) {
      return res.status(400).json({ error: 'Invalid job type' });
    }

    const stats = await queueManager.getJobStats(jobType as JobType);

    res.json({
      jobType,
      ...stats,
    });
  } catch (error: any) {
    console.error('Error fetching queue stats:', error);
    res.status(500).json({ error: 'Failed to fetch queue stats' });
  }
});

/**
 * @swagger
 * /queue/stats:
 *   get:
 *     summary: Get statistics for all queues
 *     tags:
 *       - Queue
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', requireAuth, async (req: any, res) => {
  try {
    const allStats: Record<string, any> = {};

    for (const jobType of Object.values(JobType)) {
      allStats[jobType] = await queueManager.getJobStats(jobType as JobType);
    }

    res.json({
      queues: allStats,
      totalPending: Object.values(allStats).reduce(
        (sum: number, stat: any) => sum + stat.waiting + stat.active,
        0
      ),
    });
  } catch (error: any) {
    console.error('Error fetching all queue stats:', error);
    res.status(500).json({ error: 'Failed to fetch queue statistics' });
  }
});

/**
 * @swagger
 * /queue/jobs/{jobType}/{jobId}/retry:
 *   post:
 *     summary: Retry a failed job
 *     tags:
 *       - Queue
 *     security:
 *       - bearerAuth: []
 */
router.post('/jobs/:jobType/:jobId/retry', requireAuth, async (req: any, res) => {
  try {
    const { jobType, jobId } = req.params;

    if (!Object.values(JobType).includes(jobType)) {
      return res.status(400).json({ error: 'Invalid job type' });
    }

    const job = await queueManager.retryJob(jobType as JobType, jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({
      success: true,
      jobId: job.id,
      message: 'Job scheduled for retry',
    });
  } catch (error: any) {
    console.error('Error retrying job:', error);
    res.status(500).json({ error: 'Failed to retry job' });
  }
});

/**
 * @swagger
 * /queue/jobs/{jobType}/{jobId}/cancel:
 *   post:
 *     summary: Cancel a job
 *     tags:
 *       - Queue
 *     security:
 *       - bearerAuth: []
 */
router.post('/jobs/:jobType/:jobId/cancel', requireAuth, async (req: any, res) => {
  try {
    const { jobType, jobId } = req.params;

    if (!Object.values(JobType).includes(jobType)) {
      return res.status(400).json({ error: 'Invalid job type' });
    }

    await queueManager.cancelJob(jobType as JobType, jobId);

    res.json({
      success: true,
      message: 'Job cancelled',
    });
  } catch (error: any) {
    console.error('Error cancelling job:', error);
    res.status(500).json({ error: 'Failed to cancel job' });
  }
});

export default router;
