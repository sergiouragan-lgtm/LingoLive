import { Router, Request, Response } from 'express';
import { enterpriseB2BIntegrationService } from '../services/enterprise-b2b-integration.service';

const router = Router();

router.post('/organizations/create', async (req: Request, res: Response) => {
  try {
    const { name, type, domain } = req.body;
    const organization = await enterpriseB2BIntegrationService.createOrganization(
      name,
      type,
      domain
    );
    res.status(201).json(organization);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/team-members/add', async (req: Request, res: Response) => {
  try {
    const { organizationId, userId, role, permissions } = req.body;
    const member = await enterpriseB2BIntegrationService.addTeamMember(
      organizationId,
      userId,
      role,
      permissions
    );
    res.status(201).json(member);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/sso/configure', async (req: Request, res: Response) => {
  try {
    const { organizationId, provider, providerUrl, clientId } = req.body;
    const sso = await enterpriseB2BIntegrationService.configureSSOIntegration(
      organizationId,
      provider,
      providerUrl,
      clientId
    );
    res.status(201).json(sso);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/branding/setup', async (req: Request, res: Response) => {
  try {
    const { organizationId, logoUrl, primaryColor, secondaryColor, companyName, supportEmail, customDomain } = req.body;
    const branding = await enterpriseB2BIntegrationService.setupCustomBranding(
      organizationId,
      logoUrl,
      primaryColor,
      secondaryColor,
      companyName,
      supportEmail,
      customDomain
    );
    res.status(201).json(branding);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/whitelabel/deploy', async (req: Request, res: Response) => {
  try {
    const { organizationId, subdomain, branding, features, customDomain } = req.body;
    const deployment = await enterpriseB2BIntegrationService.deployWhiteLabel(
      organizationId,
      subdomain,
      branding,
      features,
      customDomain
    );
    res.status(201).json(deployment);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/api-contracts/create', async (req: Request, res: Response) => {
  try {
    const { organizationId, rateLimitPerMinute, rateLimitPerDay, allowedEndpoints, slaTier, supportLevel } = req.body;
    const contract = await enterpriseB2BIntegrationService.createEnterpriseAPIContract(
      organizationId,
      rateLimitPerMinute,
      rateLimitPerDay,
      allowedEndpoints,
      slaTier,
      supportLevel
    );
    res.status(201).json(contract);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/sla/manage', async (req: Request, res: Response) => {
  try {
    const { contractId, uptime, responseTime, supportResponseTime, incidentResolution, penalties } = req.body;
    const sla = await enterpriseB2BIntegrationService.manageSLA(
      contractId,
      uptime,
      responseTime,
      supportResponseTime,
      incidentResolution,
      penalties
    );
    res.status(201).json(sla);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/support/assign', async (req: Request, res: Response) => {
  try {
    const { organizationId, accountManager, supportEmail, supportPhone, businessHours, escalationPath } = req.body;
    const support = await enterpriseB2BIntegrationService.assignDedicatedSupport(
      organizationId,
      accountManager,
      supportEmail,
      supportPhone,
      businessHours,
      escalationPath
    );
    res.status(201).json(support);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const metrics = await enterpriseB2BIntegrationService.getEnterpriseMetrics({ start: startDate, end: endDate });
    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
