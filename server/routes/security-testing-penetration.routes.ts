import { Router, Request, Response } from 'express';
import { securityTestingPenetrationService } from '../services/security-testing-penetration.service';

const router = Router();

router.post('/penetration-tests/create', async (req: Request, res: Response) => {
  try {
    const { name, scope, tester, severity } = req.body;
    const pentest = await securityTestingPenetrationService.createPenetrationTest(
      name,
      scope,
      tester,
      severity
    );
    res.status(201).json(pentest);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/test-suites/create', async (req: Request, res: Response) => {
  try {
    const { name, testType, tests } = req.body;
    const suite = await securityTestingPenetrationService.createSecurityTestSuite(
      name,
      testType,
      tests
    );
    res.status(201).json(suite);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/results/record', async (req: Request, res: Response) => {
  try {
    const { testId, suiteId, status, duration, vulnerabilitiesFound, details } = req.body;
    const result = await securityTestingPenetrationService.recordTestResult(
      testId,
      suiteId,
      status,
      duration,
      vulnerabilitiesFound,
      details
    );
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/vulnerability-scans/execute', async (req: Request, res: Response) => {
  try {
    const { scanType, target } = req.body;
    const scan = await securityTestingPenetrationService.executeVulnerabilityScanning(
      scanType,
      target
    );
    res.status(201).json(scan);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/scans/:scanId/complete', async (req: Request, res: Response) => {
  try {
    const { scanId } = req.params;
    const { vulnerabilitiesDiscovered, criticalCount, highCount, mediumCount, lowCount } = req.body;
    const completed = await securityTestingPenetrationService.completeScan(
      scanId,
      vulnerabilitiesDiscovered,
      criticalCount,
      highCount,
      mediumCount,
      lowCount
    );
    res.status(200).json(completed);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/reports/generate', async (req: Request, res: Response) => {
  try {
    const { reportType, generatedBy, summary, findings, recommendations, overallRiskScore } = req.body;
    const report = await securityTestingPenetrationService.generateSecurityReport(
      reportType,
      generatedBy,
      summary,
      findings,
      recommendations,
      overallRiskScore
    );
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/reports/:reportId/finalize', async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const finalized = await securityTestingPenetrationService.finalizeSecurityReport(reportId);
    res.status(200).json(finalized);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const metrics = await securityTestingPenetrationService.getSecurityTestingMetrics({ start: startDate, end: endDate });
    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
