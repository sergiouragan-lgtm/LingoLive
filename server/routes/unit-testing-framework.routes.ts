import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { unitTestingFrameworkService } from '../services/unit-testing-framework.service';

const router = Router();

router.post('/test-suites', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, description, testCount } = req.body;
    const suite = await unitTestingFrameworkService.createTestSuite(name, description, testCount);
    res.json(suite);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/unit-tests', requireAuth, async (req: Request, res: Response) => {
  try {
    const { suiteId, name, description, status, duration, assertions, error } = req.body;
    const test = await unitTestingFrameworkService.recordUnitTest(
      suiteId,
      name,
      description,
      status,
      duration,
      assertions,
      error
    );
    res.json(test);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/coverage', requireAuth, async (req: Request, res: Response) => {
  try {
    const { suiteId, coverage, passCount, failCount, skipCount, duration } = req.body;
    const updated = await unitTestingFrameworkService.updateTestSuiteCoverage(
      suiteId,
      coverage,
      passCount,
      failCount,
      skipCount,
      duration
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/mocks', requireAuth, async (req: Request, res: Response) => {
  try {
    const { service, method, returnValue } = req.body;
    const mock = await unitTestingFrameworkService.registerMock(service, method, returnValue);
    res.json(mock);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/mock-calls', requireAuth, async (req: Request, res: Response) => {
  try {
    const { mockId, args, returnValue } = req.body;
    const call = await unitTestingFrameworkService.recordMockCall(mockId, args, returnValue);
    res.json(call);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/suites/:suiteId/coverage', requireAuth, async (req: Request, res: Response) => {
  try {
    const coverage = await unitTestingFrameworkService.getTestSuiteCoverage(req.params.suiteId);
    res.json(coverage);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
