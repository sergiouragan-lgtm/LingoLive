import { Router, Request, Response } from 'express';
import { advancedIntegrationEcosystemService } from '../services/advanced-integration-ecosystem.service';

const router = Router();

router.post('/marketplace/publish', async (req: Request, res: Response) => {
  try {
    const { name, description, publisher, category, version, apiVersion } = req.body;
    const app = await advancedIntegrationEcosystemService.publishMarketplaceApp(
      name,
      description,
      publisher,
      category,
      version,
      apiVersion
    );
    res.status(201).json(app);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/partners/integrate', async (req: Request, res: Response) => {
  try {
    const { partnerName, type, webhookUrl, authType, events } = req.body;
    const integration = await advancedIntegrationEcosystemService.configurePartnerIntegration(
      partnerName,
      type,
      webhookUrl,
      authType,
      events
    );
    res.status(201).json(integration);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/webhooks/configure', async (req: Request, res: Response) => {
  try {
    const { organizationId, event, endpoint, headers, retryPolicy } = req.body;
    const webhook = await advancedIntegrationEcosystemService.configureWebhook(
      organizationId,
      event,
      endpoint,
      headers,
      retryPolicy
    );
    res.status(201).json(webhook);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/templates/create', async (req: Request, res: Response) => {
  try {
    const { name, description, category, code, documentation, examplePayload } = req.body;
    const template = await advancedIntegrationEcosystemService.createIntegrationTemplate(
      name,
      description,
      category,
      code,
      documentation,
      examplePayload
    );
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/plugins/register', async (req: Request, res: Response) => {
  try {
    const { name, version, hooks, permissions } = req.body;
    const plugin = await advancedIntegrationEcosystemService.registerPlugin(
      name,
      version,
      hooks,
      permissions
    );
    res.status(201).json(plugin);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/third-party/add', async (req: Request, res: Response) => {
  try {
    const { name, appUrl, category, developer, permissions } = req.body;
    const app = await advancedIntegrationEcosystemService.addThirdPartyApp(
      name,
      appUrl,
      category,
      developer,
      permissions
    );
    res.status(201).json(app);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const metrics = await advancedIntegrationEcosystemService.getIntegrationMetrics({ start: startDate, end: endDate });
    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
