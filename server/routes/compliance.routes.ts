import express from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { complianceService } from '../services/compliance.service';

const router = express.Router();

/**
 * @swagger
 * /api/compliance/data-export:
 *   post:
 *     summary: Request GDPR data export
 *     tags:
 *       - Compliance
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data export requested
 */
router.post('/data-export', requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;

  const dataExport = await complianceService.requestDataExport(userId);
  res.json(dataExport);
});

/**
 * @swagger
 * /api/compliance/delete-account:
 *   post:
 *     summary: Request account deletion
 *     tags:
 *       - Compliance
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Deletion request submitted
 */
router.post('/delete-account', requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  const { reason = 'No reason provided' } = req.body;

  await complianceService.requestAccountDeletion(userId, reason);
  res.json({ success: true, message: 'Deletion request submitted. Account will be deleted in 30 days.' });
});

/**
 * @swagger
 * /api/compliance/audit-log:
 *   get:
 *     summary: Get audit log entries
 *     tags:
 *       - Compliance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: limit
 *         in: query
 *         type: number
 *       - name: offset
 *         in: query
 *         type: number
 *     responses:
 *       200:
 *         description: Audit log entries
 */
router.get('/audit-log', requireAuth, async (req: any, res) => {
  const { limit = 100, offset = 0 } = req.query;

  const log = await complianceService.getAuditLog(parseInt(limit), parseInt(offset));
  res.json(log);
});

/**
 * @swagger
 * /api/compliance/report:
 *   get:
 *     summary: Get compliance report
 *     tags:
 *       - Compliance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: startDate
 *         in: query
 *         type: string
 *       - name: endDate
 *         in: query
 *         type: string
 *     responses:
 *       200:
 *         description: Compliance report
 */
router.get('/report', requireAuth, async (req: any, res) => {
  const { startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate = new Date() } = req.query;

  const report = await complianceService.getComplianceReport(
    new Date(startDate),
    new Date(endDate)
  );
  res.json(report);
});

/**
 * @swagger
 * /api/compliance/data-summary:
 *   get:
 *     summary: Get user data summary
 *     tags:
 *       - Compliance
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data summary for authenticated user
 */
router.get('/data-summary', requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;

  const summary = await complianceService.getUserDataSummary(userId);
  res.json(summary);
});

/**
 * @swagger
 * /api/compliance/data-integrity:
 *   get:
 *     summary: Verify user data integrity
 *     tags:
 *       - Compliance
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Data integrity check results
 */
router.get('/data-integrity', requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;

  const integrity = await complianceService.verifyDataIntegrity(userId);
  res.json(integrity);
});

export default router;
