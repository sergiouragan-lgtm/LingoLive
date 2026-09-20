import { Router } from 'express';
import { analyticsDashboardService } from '../services/analytics-dashboard.service';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.get('/student-insight/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const insight = await analyticsDashboardService.getStudentInsight(userId);
    res.json(insight);
  } catch (error: any) {
    console.error('Error getting student insight:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/teacher-dashboard/:teacherId', requireAuth, async (req, res) => {
  try {
    const { teacherId } = req.params;
    const dashboard = await analyticsDashboardService.getTeacherDashboard(teacherId);
    res.json(dashboard);
  } catch (error: any) {
    console.error('Error getting teacher dashboard:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/parent-portal/:parentId/:childId', requireAuth, async (req, res) => {
  try {
    const { parentId, childId } = req.params;
    const portal = await analyticsDashboardService.getParentPortal(parentId, childId);
    res.json(portal);
  } catch (error: any) {
    console.error('Error getting parent portal:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/learner-insight/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const insight = await analyticsDashboardService.getLearnerInsight(userId);
    res.json(insight);
  } catch (error: any) {
    console.error('Error getting learner insight:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/performance/:userId/:period', requireAuth, async (req, res) => {
  try {
    const { userId, period } = req.params;
    const analytics = await analyticsDashboardService.getPerformanceAnalytics(
      userId,
      period as 'daily' | 'weekly' | 'monthly'
    );
    res.json(analytics);
  } catch (error: any) {
    console.error('Error getting performance analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/custom-report/generate', requireAuth, async (req, res) => {
  try {
    const { generatedBy, title, filters, metrics } = req.body;
    const report = await analyticsDashboardService.generateCustomReport(
      generatedBy,
      title,
      filters,
      metrics
    );
    res.json(report);
  } catch (error: any) {
    console.error('Error generating custom report:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/export/:userId/:format', requireAuth, async (req, res) => {
  try {
    const { userId, format } = req.params;
    const { data, filename } = await analyticsDashboardService.exportData(
      userId,
      format as 'csv' | 'json'
    );

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
    } else {
      res.setHeader('Content-Type', 'application/json');
    }
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(data);
  } catch (error: any) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
