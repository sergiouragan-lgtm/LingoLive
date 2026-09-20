import { Router } from 'express';
import { advancedBIIntegrationService } from '../services/advanced-bi-integrations.service';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.post('/connect-platform', requireAuth, async (req, res) => {
  try {
    const { platform, name, apiKey, instanceUrl } = req.body;
    const connection = await advancedBIIntegrationService.connectAdvancedBIPlatform(
      platform,
      name,
      apiKey,
      instanceUrl
    );
    res.json(connection);
  } catch (error: any) {
    console.error('Error connecting to BI platform:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/dataset-mapping', requireAuth, async (req, res) => {
  try {
    const { sourceCollection, targetDataset, platform, columnMappings, syncFrequency } = req.body;
    const mapping = await advancedBIIntegrationService.createDatasetMapping(
      sourceCollection,
      targetDataset,
      platform,
      columnMappings,
      syncFrequency
    );
    res.json(mapping);
  } catch (error: any) {
    console.error('Error creating dataset mapping:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/publish-dashboard', requireAuth, async (req, res) => {
  try {
    const { platform, dashboardName, dashboardId, accessLevel } = req.body;
    const publishing = await advancedBIIntegrationService.publishDashboard(
      platform,
      dashboardName,
      dashboardId,
      accessLevel
    );
    res.json(publishing);
  } catch (error: any) {
    console.error('Error publishing dashboard:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/embedded-analytics', requireAuth, async (req, res) => {
  try {
    const { containerId, dashboardId, platform, permissionsLevel } = req.body;
    const embedded = await advancedBIIntegrationService.createEmbeddedAnalytics(
      containerId,
      dashboardId,
      platform,
      permissionsLevel
    );
    res.json(embedded);
  } catch (error: any) {
    console.error('Error creating embedded analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/track-dashboard-view/:publishId', requireAuth, async (req, res) => {
  try {
    const { publishId } = req.params;
    await advancedBIIntegrationService.trackDashboardView(publishId);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error tracking dashboard view:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/data-lineage/:datasetId', requireAuth, async (req, res) => {
  try {
    const { datasetId } = req.params;
    const lineage = await advancedBIIntegrationService.getDataLineage(datasetId);
    res.json(lineage);
  } catch (error: any) {
    console.error('Error getting data lineage:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/platforms', requireAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const platforms = await advancedBIIntegrationService.getAdvancedBIPlatforms(
      status as string
    );
    res.json(platforms);
  } catch (error: any) {
    console.error('Error fetching BI platforms:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/published-dashboards', requireAuth, async (req, res) => {
  try {
    const { platform, limit } = req.query;
    const dashboards = await advancedBIIntegrationService.getPublishedDashboards(
      platform as string,
      parseInt(limit as string) || 50
    );
    res.json(dashboards);
  } catch (error: any) {
    console.error('Error fetching published dashboards:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/refresh-embed-token/:embedId', requireAuth, async (req, res) => {
  try {
    const { embedId } = req.params;
    const token = await advancedBIIntegrationService.refreshEmbedToken(embedId);
    res.json({ embedToken: token });
  } catch (error: any) {
    console.error('Error refreshing embed token:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
