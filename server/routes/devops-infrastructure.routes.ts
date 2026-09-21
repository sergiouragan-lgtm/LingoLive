import { Router, Request, Response } from 'express';
import { devOpsInfrastructureService } from '../services/devops-infrastructure.service';

const router = Router();

router.post('/clusters/create', async (req: Request, res: Response) => {
  try {
    const { name, region, nodeCount, kubernetesVersion } = req.body;
    const cluster = await devOpsInfrastructureService.createKubernetesCluster(
      name,
      region,
      nodeCount,
      kubernetesVersion
    );
    res.status(201).json(cluster);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/deployments/create', async (req: Request, res: Response) => {
  try {
    const { clusterId, appName, replicas, imageVersion, cpuRequest, memoryRequest } = req.body;
    const deployment = await devOpsInfrastructureService.deployApplication(
      clusterId,
      appName,
      replicas,
      imageVersion,
      cpuRequest,
      memoryRequest
    );
    res.status(201).json(deployment);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/autoscaling/configure', async (req: Request, res: Response) => {
  try {
    const { deploymentId, minReplicas, maxReplicas, targetCPU, targetMemory, scaleDownDelay, scaleUpDelay } = req.body;
    const policy = await devOpsInfrastructureService.configureAutoScaling(
      deploymentId,
      minReplicas,
      maxReplicas,
      targetCPU,
      targetMemory,
      scaleDownDelay,
      scaleUpDelay
    );
    res.status(201).json(policy);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/multiregion/setup', async (req: Request, res: Response) => {
  try {
    const { appName, regions, loadBalancingStrategy, failoverEnabled } = req.body;
    const deployment = await devOpsInfrastructureService.setupMultiRegionDeployment(
      appName,
      regions,
      loadBalancingStrategy,
      failoverEnabled
    );
    res.status(201).json(deployment);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/replication/configure', async (req: Request, res: Response) => {
  try {
    const { sourceRegion, targetRegions, replicationType } = req.body;
    const replication = await devOpsInfrastructureService.configureDatabaseReplication(
      sourceRegion,
      targetRegions,
      replicationType
    );
    res.status(201).json(replication);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/backup/configure', async (req: Request, res: Response) => {
  try {
    const { databaseName, schedule, retentionDays, encryptionEnabled, storageLocation } = req.body;
    const backup = await devOpsInfrastructureService.configureBackup(
      databaseName,
      schedule,
      retentionDays,
      encryptionEnabled,
      storageLocation
    );
    res.status(201).json(backup);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/disaster-recovery/create', async (req: Request, res: Response) => {
  try {
    const { name, rtoMinutes, rpoMinutes, primaryRegion, secondaryRegion, testSchedule } = req.body;
    const plan = await devOpsInfrastructureService.createDisasterRecoveryPlan(
      name,
      rtoMinutes,
      rpoMinutes,
      primaryRegion,
      secondaryRegion,
      testSchedule
    );
    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const metrics = await devOpsInfrastructureService.getInfrastructureMetrics({ start: startDate, end: endDate });
    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
