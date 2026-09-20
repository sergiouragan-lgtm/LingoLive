import { Router } from 'express';
import { progressDashboardReportingService } from '../services/progress-dashboard-reporting.service';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.get('/dashboard', requireAuth, async (req: any, res) => {
  try {
    const dashboard = await progressDashboardReportingService.buildProgressDashboard(req.user?.uid || '');
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/report/:period', requireAuth, async (req: any, res) => {
  try {
    const report = await progressDashboardReportingService.generateProgressReport(
      req.user?.uid || '',
      req.params.period as 'daily' | 'weekly' | 'monthly'
    );
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/grade-distribution/:period', requireAuth, async (req: any, res) => {
  try {
    const distribution = await progressDashboardReportingService.analyzeGradeDistribution(
      req.user?.uid || '',
      req.params.period as 'daily' | 'weekly' | 'monthly'
    );
    res.json(distribution);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/milestone', requireAuth, async (req: any, res) => {
  try {
    const { milestone } = req.body;
    const record = await progressDashboardReportingService.trackProgressMilestone(req.user?.uid || '', milestone);
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
