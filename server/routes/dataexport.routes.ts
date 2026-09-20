import express from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { dataExportService, DataType, ExportFormat } from '../services/dataexport.service';

const router = express.Router();

/**
 * @swagger
 * /api/data-export/request:
 *   post:
 *     summary: Request data export
 *     tags:
 *       - Data Export
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               format:
 *                 type: string
 *                 enum: [json, csv]
 *               dataTypes:
 *                 type: array
 *     responses:
 *       201:
 *         description: Export request created
 */
router.post('/request', requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  const { format = 'json', dataTypes = ['all'] } = req.body;

  if (!['json', 'csv'].includes(format)) {
    return res.status(400).json({ error: 'Invalid format' });
  }

  const request = await dataExportService.requestExport(userId, format as ExportFormat, dataTypes as DataType[]);
  res.status(201).json(request);
});

/**
 * @swagger
 * /api/data-export/{exportId}:
 *   get:
 *     summary: Get export request status
 *     tags:
 *       - Data Export
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Export request details
 */
router.get('/:exportId', requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  const { exportId } = req.params;

  const request = await dataExportService.getExportRequest(exportId);

  if (!request) {
    return res.status(404).json({ error: 'Export not found' });
  }

  // Only allow user to view their own exports
  if (request.userId !== userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.json(request);
});

/**
 * @swagger
 * /api/data-export/history:
 *   get:
 *     summary: Get user's export requests
 *     tags:
 *       - Data Export
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of export requests
 */
router.get('/', requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  const { limit = 50 } = req.query;

  const exports = await dataExportService.getUserExports(userId, parseInt(limit as string));
  res.json(exports);
});

/**
 * @swagger
 * /api/data-export/delete:
 *   post:
 *     summary: Request account data deletion (GDPR Right to Be Forgotten)
 *     tags:
 *       - Data Export
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deletion request submitted
 */
router.post('/delete', requireAuth, async (req: any, res) => {
  const userId = req.user?.uid;
  const { confirmPassword } = req.body;

  if (!confirmPassword) {
    return res.status(400).json({ error: 'Password confirmation required' });
  }

  try {
    await dataExportService.deleteUserData(userId);

    res.json({
      success: true,
      message: 'Your account and all associated data have been permanently deleted',
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete user data' });
  }
});

/**
 * @swagger
 * /api/data-export/stats:
 *   get:
 *     summary: Get data export statistics
 *     tags:
 *       - Data Export
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Export statistics
 */
router.get('/stats', requireAuth, async (req: any, res) => {
  const stats = await dataExportService.getStats();
  res.json(stats);
});

export default router;
