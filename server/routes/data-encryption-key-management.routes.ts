import { Router, Request, Response } from 'express';
import { dataEncryptionKeyManagementService } from '../services/data-encryption-key-management.service';

const router = Router();

router.post('/keys/create', async (req: Request, res: Response) => {
  try {
    const { algorithm, keyType, keyUsage, expiresAt } = req.body;
    const key = await dataEncryptionKeyManagementService.createEncryptionKey(
      algorithm,
      keyType,
      keyUsage,
      expiresAt ? new Date(expiresAt) : undefined
    );
    res.status(201).json(key);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/keys/:keyId/rotate', async (req: Request, res: Response) => {
  try {
    const { keyId } = req.params;
    const { newKeyId } = req.body;
    const key = await dataEncryptionKeyManagementService.rotateKey(keyId, newKeyId);
    res.status(200).json(key);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/policies/rotation/define', async (req: Request, res: Response) => {
  try {
    const { keyType, rotationIntervalDays, autoRotate, notifyBeforeDays } = req.body;
    const policy = await dataEncryptionKeyManagementService.defineKeyRotationPolicy(
      keyType,
      rotationIntervalDays,
      autoRotate,
      notifyBeforeDays
    );
    res.status(201).json(policy);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/data/encrypt', async (req: Request, res: Response) => {
  try {
    const { keyId, plaintext, dataType } = req.body;
    const encryptedData = await dataEncryptionKeyManagementService.encryptData(
      keyId,
      plaintext,
      dataType
    );
    res.status(201).json(encryptedData);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/data/classify', async (req: Request, res: Response) => {
  try {
    const { dataType, classification, encryptionRequired, maskingRequired, retentionDays, encryptionKeyId } = req.body;
    const classified = await dataEncryptionKeyManagementService.classifyData(
      dataType,
      classification,
      encryptionRequired,
      maskingRequired,
      retentionDays,
      encryptionKeyId
    );
    res.status(201).json(classified);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/keys/:keyId/usage/log', async (req: Request, res: Response) => {
  try {
    const { keyId } = req.params;
    const { operation, userId, errorMessage } = req.body;
    const log = await dataEncryptionKeyManagementService.logKeyUsage(
      keyId,
      operation,
      userId,
      errorMessage
    );
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/certificates/manage', async (req: Request, res: Response) => {
  try {
    const { certificateName, issuer, validFrom, validUntil, certificateType, thumbprint } = req.body;
    const certificate = await dataEncryptionKeyManagementService.manageCertificate(
      certificateName,
      issuer,
      new Date(validFrom),
      new Date(validUntil),
      certificateType,
      thumbprint
    );
    res.status(201).json(certificate);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/metrics/rotation', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const metrics = await dataEncryptionKeyManagementService.getKeyRotationMetrics({ start: startDate, end: endDate });
    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
