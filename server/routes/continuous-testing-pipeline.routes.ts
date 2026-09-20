import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { continuousTestingPipelineService } from '../services/continuous-testing-pipeline.service';

const router = Router();

router.post('/pipeline-configs', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, stages, concurrency, timeout } = req.body;
    const config = await continuousTestingPipelineService.createPipelineConfig(
      name,
      stages,
      concurrency,
      timeout
    );
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/pipeline-runs', requireAuth, async (req: Request, res: Response) => {
  try {
    const { configId, commitSha } = req.body;
    const run = await continuousTestingPipelineService.executePipelineRun(configId, commitSha);
    res.json(run);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/test-runs', requireAuth, async (req: Request, res: Response) => {
  try {
    const { commitSha, branch, unitTests, integrationTests, e2eTests, performanceTests } = req.body;
    const run = await continuousTestingPipelineService.recordTestRun(
      commitSha,
      branch,
      unitTests,
      integrationTests,
      e2eTests,
      performanceTests
    );
    res.json(run);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/detect-flaky-tests', requireAuth, async (req: Request, res: Response) => {
  try {
    const { runId } = req.body;
    const reports = await continuousTestingPipelineService.detectFlakyTests(runId);
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/test-reports', requireAuth, async (req: Request, res: Response) => {
  try {
    const { runId } = req.body;
    const report = await continuousTestingPipelineService.generateTestReport(runId);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/optimize-parallelization', requireAuth, async (req: Request, res: Response) => {
  try {
    const { runId, batchSize, totalTests } = req.body;
    const optimization = await continuousTestingPipelineService.optimizeTestParallelization(
      runId,
      batchSize,
      totalTests
    );
    res.json(optimization);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/pipeline-runs/:pipelineRunId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const run = await continuousTestingPipelineService.completePipelineRun(req.params.pipelineRunId, status);
    res.json(run);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
