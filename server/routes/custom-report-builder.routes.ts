import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { customReportBuilderService } from '../services/custom-report-builder.service';

const router = Router();

router.get('/templates', requireAuth, async (req: any, res) => {
  try {
    const templates = await customReportBuilderService.getReportTemplates();

    res.json({ success: true, templates });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/create', requireAuth, async (req: any, res) => {
  try {
    const { userId, reportName, templateId, metrics, filters, dateRange } = req.body;

    const report = await customReportBuilderService.createCustomReport(
      userId,
      reportName,
      templateId,
      metrics,
      filters,
      dateRange
    );

    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/schedule', requireAuth, async (req: any, res) => {
  try {
    const { userId, reportName, templateId, frequency, recipients } = req.body;

    const scheduledReport = await customReportBuilderService.scheduleReport(
      userId,
      reportName,
      templateId,
      frequency,
      recipients
    );

    res.json({ success: true, scheduledReport });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/export/:reportId', requireAuth, async (req: any, res) => {
  try {
    const { reportId } = req.params;
    const { format } = req.body;

    const export_record = await customReportBuilderService.exportReport(reportId, format);

    res.json({ success: true, export: export_record });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/share/:reportId', requireAuth, async (req: any, res) => {
  try {
    const { reportId } = req.params;
    const { sharedBy, sharedWith, shareType } = req.body;

    const share = await customReportBuilderService.shareReport(reportId, sharedBy, sharedWith, shareType);

    res.json({ success: true, share });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/record-view/:reportId', requireAuth, async (req: any, res) => {
  try {
    const { reportId } = req.params;
    const { userId, sectionId } = req.body;

    const analytics = await customReportBuilderService.recordReportView(reportId, userId, sectionId);

    res.json({ success: true, analytics });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/user-reports/:userId', requireAuth, async (req: any, res) => {
  try {
    const { userId } = req.params;

    const reports = await customReportBuilderService.getUserReports(userId);

    res.json({ success: true, reports });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/visibility/:reportId', requireAuth, async (req: any, res) => {
  try {
    const { reportId } = req.params;
    const { visibility } = req.body;

    const report = await customReportBuilderService.updateReportVisibility(reportId, visibility);

    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
