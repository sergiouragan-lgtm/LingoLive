import { Router, Request, Response } from 'express';
import { advancedSecretsManagementService } from '../services/advanced-secrets-management.service';

const router = Router();

router.post('/vaults/create', async (req: Request, res: Response) => {
  try {
    const { name, provider } = req.body;
    const vault = await advancedSecretsManagementService.createVault(name, provider);
    res.status(201).json(vault);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/secrets/store', async (req: Request, res: Response) => {
  try {
    const { vaultId, name, encrypted, rotationPolicy } = req.body;
    const secret = await advancedSecretsManagementService.storeSecret(vaultId, name, encrypted, rotationPolicy);
    res.status(201).json(secret);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/keys/rotate', async (req: Request, res: Response) => {
  try {
    const { algorithm } = req.body;
    const key = await advancedSecretsManagementService.rotateEncryptionKey(algorithm);
    res.status(201).json(key);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await advancedSecretsManagementService.getSecretsMetrics();
    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
