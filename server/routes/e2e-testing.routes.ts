import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { e2eTestingService } from '../services/e2e-testing.service';

const router = Router();

router.post('/test-suites', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, browser, testCount } = req.body;
    const suite = await e2eTestingService.createE2ETestSuite(name, browser, testCount);
    res.json(suite);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/user-journeys', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, description, steps, testData } = req.body;
    const journey = await e2eTestingService.testUserJourney(name, description, steps, testData);
    res.json(journey);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/tests', requireAuth, async (req: Request, res: Response) => {
  try {
    const { suiteId, name, userFlow, assertions, duration, status } = req.body;
    const test = await e2eTestingService.recordE2ETest(suiteId, name, userFlow, assertions, duration, status);
    res.json(test);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/visual-regression', requireAuth, async (req: Request, res: Response) => {
  try {
    const { page, baselineImage, currentImage } = req.body;
    const test = await e2eTestingService.testVisualRegression(page, baselineImage, currentImage);
    res.json(test);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/cross-browser', requireAuth, async (req: Request, res: Response) => {
  try {
    const { testName, browsers } = req.body;
    const test = await e2eTestingService.testCrossBrowser(testName, browsers);
    res.json(test);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/metrics', requireAuth, async (req: Request, res: Response) => {
  try {
    const { totalTests, passedTests, failedTests, flakyTests, avgDuration, browsers } = req.body;
    const metrics = await e2eTestingService.recordE2EMetrics(
      totalTests,
      passedTests,
      failedTests,
      flakyTests,
      avgDuration,
      browsers
    );
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
