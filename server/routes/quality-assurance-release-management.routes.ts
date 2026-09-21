import { Router, Request, Response } from 'express';
import { qualityAssuranceReleaseManagementService } from '../services/quality-assurance-release-management.service';

const router = Router();

router.post('/testcases/create', async (req: Request, res: Response) => {
  try {
    const { name, description, steps, expectedResult, priority } = req.body;
    const testCase = await qualityAssuranceReleaseManagementService.createTestCase(
      name,
      description,
      steps,
      expectedResult,
      priority
    );
    res.status(201).json(testCase);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/testsuites/create', async (req: Request, res: Response) => {
  try {
    const { name, testCases, automationLevel } = req.body;
    const suite = await qualityAssuranceReleaseManagementService.createTestSuite(
      name,
      testCases,
      automationLevel
    );
    res.status(201).json(suite);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/bugs/report', async (req: Request, res: Response) => {
  try {
    const { title, description, severity, reportedBy, assignedTo } = req.body;
    const bug = await qualityAssuranceReleaseManagementService.reportBug(
      title,
      description,
      severity,
      reportedBy,
      assignedTo
    );
    res.status(201).json(bug);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/releases/create', async (req: Request, res: Response) => {
  try {
    const { versionNumber, releaseDate, features, bugFixes, releaseNotes } = req.body;
    const version = await qualityAssuranceReleaseManagementService.createReleaseVersion(
      versionNumber,
      new Date(releaseDate),
      features,
      bugFixes,
      releaseNotes
    );
    res.status(201).json(version);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/checklists/create', async (req: Request, res: Response) => {
  try {
    const { versionId, items } = req.body;
    const checklist = await qualityAssuranceReleaseManagementService.createReleaseChecklist(
      versionId,
      items
    );
    res.status(201).json(checklist);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/regression/create', async (req: Request, res: Response) => {
  try {
    const { name, versionId, affectedModules, testData } = req.body;
    const test = await qualityAssuranceReleaseManagementService.createRegressionTest(
      name,
      versionId,
      affectedModules,
      testData
    );
    res.status(201).json(test);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const metrics = await qualityAssuranceReleaseManagementService.getReleaseMetrics({ start: startDate, end: endDate });
    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
