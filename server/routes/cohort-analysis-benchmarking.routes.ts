import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { cohortAnalysisBenchmarkingService } from '../services/cohort-analysis-benchmarking.service';

const router = Router();

router.post('/create-cohort', requireAuth, async (req: any, res) => {
  try {
    const { cohortName, cohortType, userIds, description } = req.body;

    const cohort = await cohortAnalysisBenchmarkingService.createCohort(
      cohortName,
      cohortType,
      userIds,
      description
    );

    res.json({ success: true, cohort });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/analyze/:cohortId', requireAuth, async (req: any, res) => {
  try {
    const { cohortId } = req.params;

    const analysis = await cohortAnalysisBenchmarkingService.analyzeCohortPerformance(cohortId);

    res.json({ success: true, analysis });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/set-benchmarks/:cohortId', requireAuth, async (req: any, res) => {
  try {
    const { cohortId } = req.params;
    const { benchmarks } = req.body;

    const savedBenchmarks = await cohortAnalysisBenchmarkingService.setBenchmarks(cohortId, benchmarks);

    res.json({ success: true, benchmarks: savedBenchmarks });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/compare', requireAuth, async (req: any, res) => {
  try {
    const { cohort1Id, cohort2Id } = req.body;

    const comparison = await cohortAnalysisBenchmarkingService.compareCohorts(cohort1Id, cohort2Id);

    res.json({ success: true, comparison });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/peer-benchmark/:userId/:cohortId', requireAuth, async (req: any, res) => {
  try {
    const { userId, cohortId } = req.params;
    const { category } = req.body;

    const benchmark = await cohortAnalysisBenchmarkingService.calculatePeerBenchmark(userId, cohortId, category);

    res.json({ success: true, benchmark });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/report/:cohortId', requireAuth, async (req: any, res) => {
  try {
    const { cohortId } = req.params;

    const report = await cohortAnalysisBenchmarkingService.generateCohortReport(cohortId);

    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
