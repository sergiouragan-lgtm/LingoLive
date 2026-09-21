import { Router, Request, Response } from 'express';
import { complianceMonitoringService } from '../services/compliance-monitoring.service';

const router = Router();

router.post('/requirements/define', async (req: Request, res: Response) => {
  try {
    const { standard, requirement, description, dueDate } = req.body;
    const complianceReq = await complianceMonitoringService.defineComplianceRequirement(
      standard,
      requirement,
      description,
      dueDate ? new Date(dueDate) : undefined
    );
    res.status(201).json(complianceReq);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/controls/implement', async (req: Request, res: Response) => {
  try {
    const { requirementId, control, owner } = req.body;
    const complianceControl = await complianceMonitoringService.implementComplianceControl(
      requirementId,
      control,
      owner
    );
    res.status(201).json(complianceControl);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/inventory/create', async (req: Request, res: Response) => {
  try {
    const { dataType, dataCategory, quantity, location, owner, classification, retentionPeriod } = req.body;
    const inventory = await complianceMonitoringService.createDataInventory(
      dataType,
      dataCategory,
      quantity,
      location,
      owner,
      classification,
      retentionPeriod
    );
    res.status(201).json(inventory);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/assessments/initiate', async (req: Request, res: Response) => {
  try {
    const { standard, assessor } = req.body;
    const assessment = await complianceMonitoringService.conductComplianceAssessment(
      standard,
      assessor
    );
    res.status(201).json(assessment);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/assessments/:assessmentId/complete', async (req: Request, res: Response) => {
  try {
    const { assessmentId } = req.params;
    const { score, findings } = req.body;
    const assessment = await complianceMonitoringService.completeComplianceAssessment(
      assessmentId,
      score,
      findings
    );
    res.status(200).json(assessment);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/incidents/report', async (req: Request, res: Response) => {
  try {
    const { type, severity, affectedRecords, description, dataBreachNotification, regulatoryBody } = req.body;
    const incident = await complianceMonitoringService.reportIncident(
      type,
      severity,
      affectedRecords,
      description,
      dataBreachNotification,
      regulatoryBody
    );
    res.status(201).json(incident);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/agreements/dpa/create', async (req: Request, res: Response) => {
  try {
    const { processor, dataController, dataTypes, processingActivities, expirationDate } = req.body;
    const agreement = await complianceMonitoringService.createDataProcessingAgreement(
      processor,
      dataController,
      dataTypes,
      processingActivities,
      expirationDate ? new Date(expirationDate) : undefined
    );
    res.status(201).json(agreement);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await complianceMonitoringService.getComplianceMetrics();
    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
