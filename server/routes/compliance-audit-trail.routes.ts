import { Router, Request, Response } from 'express';
import { complianceAuditTrailService } from '../services/compliance-audit-trail.service';

const router = Router();

router.post('/logs/create', async (req: Request, res: Response) => {
  try {
    const { action, actor, resource, result } = req.body;
    const log = await complianceAuditTrailService.createAuditLog(action, actor, resource, result);
    res.status(201).json(log);
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});

router.post('/policies/create', async (req: Request, res: Response) => {
  try {
    const { name, standard } = req.body;
    const policy = await complianceAuditTrailService.createCompliancePolicy(name, standard);
    res.status(201).json(policy);
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});

router.post('/violations/report', async (req: Request, res: Response) => {
  try {
    const { policyId, severity, details } = req.body;
    const violation = await complianceAuditTrailService.reportViolation(policyId, severity, details);
    res.status(201).json(violation);
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await complianceAuditTrailService.getComplianceMetrics();
    res.status(200).json(metrics);
  } catch (error) { res.status(500).json({ error: (error as Error).message }); }
});

export default router;
