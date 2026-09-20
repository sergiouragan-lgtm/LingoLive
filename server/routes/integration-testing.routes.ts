import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { integrationTestingService } from '../services/integration-testing.service';

const router = Router();

router.post('/test-suites', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, description, services } = req.body;
    const suite = await integrationTestingService.createIntegrationTestSuite(name, description, services);
    res.json(suite);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/api-tests', requireAuth, async (req: Request, res: Response) => {
  try {
    const { endpoint, method, requestBody, expectedStatusCode } = req.body;
    const test = await integrationTestingService.testAPIEndpoint(
      endpoint,
      method,
      requestBody,
      expectedStatusCode
    );
    res.json(test);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/database-tests', requireAuth, async (req: Request, res: Response) => {
  try {
    const { collection, operation, testData } = req.body;
    const test = await integrationTestingService.testDatabaseOperation(collection, operation, testData);
    res.json(test);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/auth-flow-tests', requireAuth, async (req: Request, res: Response) => {
  try {
    const { flowType, testData } = req.body;
    const test = await integrationTestingService.testAuthenticationFlow(flowType, testData);
    res.json(test);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/external-mocks', requireAuth, async (req: Request, res: Response) => {
  try {
    const { service, endpoint, mockResponse } = req.body;
    const mock = await integrationTestingService.setupExternalServiceMock(service, endpoint, mockResponse);
    res.json(mock);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/record', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, description, services, assertions, duration, status } = req.body;
    const test = await integrationTestingService.recordIntegrationTest(
      name,
      description,
      services,
      assertions,
      duration,
      status
    );
    res.json(test);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/test-suites/:suiteId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { passedTests, failedTests, duration, coverage } = req.body;
    const updated = await integrationTestingService.updateIntegrationTestSuite(
      req.params.suiteId,
      passedTests,
      failedTests,
      duration,
      coverage
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
