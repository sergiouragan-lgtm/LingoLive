import { Router, Request, Response } from 'express';
import { advancedDataGovernanceService } from '../services/advanced-data-governance.service';

const router = Router();

router.post('/policies/create', async (req: Request, res: Response) => {
  try {
    const { name, description, dataClassifications, retentionPeriod, encryptionRequired, accessControl } = req.body;
    const policy = await advancedDataGovernanceService.createDataPolicy(
      name,
      description,
      dataClassifications,
      retentionPeriod,
      encryptionRequired,
      accessControl
    );
    res.status(201).json(policy);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/classification/define', async (req: Request, res: Response) => {
  try {
    const { level, description, handlingRules, minimumEncryption } = req.body;
    const classification = await advancedDataGovernanceService.defineDataClassification(
      level,
      description,
      handlingRules,
      minimumEncryption
    );
    res.status(201).json(classification);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/compliance/audit', async (req: Request, res: Response) => {
  try {
    const { auditType, scope, findings } = req.body;
    const audit = await advancedDataGovernanceService.conductComplianceAudit(
      auditType,
      scope,
      findings
    );
    res.status(201).json(audit);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/quality/rule', async (req: Request, res: Response) => {
  try {
    const { name, dataSource, validationLogic, threshold, alertOnFailure } = req.body;
    const rule = await advancedDataGovernanceService.createDataQualityRule(
      name,
      dataSource,
      validationLogic,
      threshold,
      alertOnFailure
    );
    res.status(201).json(rule);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/vault/setup', async (req: Request, res: Response) => {
  try {
    const { name, dataClassification, encryptionAlgorithm } = req.body;
    const vault = await advancedDataGovernanceService.setupPrivacyVault(
      name,
      dataClassification,
      encryptionAlgorithm
    );
    res.status(201).json(vault);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/vault/access-log', async (req: Request, res: Response) => {
  try {
    const { vaultId, userId, action, ipAddress } = req.body;
    const vault = await advancedDataGovernanceService.logAccessEvent(
      vaultId,
      userId,
      action,
      ipAddress
    );
    res.status(201).json(vault);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const metrics = await advancedDataGovernanceService.getDataGovernanceMetrics({ start: startDate, end: endDate });
    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
