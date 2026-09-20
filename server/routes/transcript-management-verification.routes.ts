import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { transcriptManagementVerificationService } from '../services/transcript-management-verification.service';

const router = Router();

router.post('/create-transcript', requireAuth, async (req: any, res) => {
  try {
    const { userId, userName, institution, programName, grades } = req.body;

    const transcript = await transcriptManagementVerificationService.createAcademicTranscript(
      userId,
      userName,
      institution,
      programName,
      grades
    );

    res.json({ success: true, transcript });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/verify/:transcriptId', requireAuth, async (req: any, res) => {
  try {
    const { transcriptId } = req.params;
    const { verifier } = req.body;

    const verification = await transcriptManagementVerificationService.verifyTranscript(transcriptId, verifier);

    res.json({ success: true, verification });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/record-credential', requireAuth, async (req: any, res) => {
  try {
    const { userId, credentialType, credentialName, issuingBody, verificationURL, expiryDate } = req.body;

    const credential = await transcriptManagementVerificationService.recordCredential(
      userId,
      credentialType,
      credentialName,
      issuingBody,
      verificationURL,
      expiryDate
    );

    res.json({ success: true, credential });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/verify-credential/:credentialId', requireAuth, async (req: any, res) => {
  try {
    const { credentialId } = req.params;

    const verified = await transcriptManagementVerificationService.verifyCredentialAuthenticity(credentialId);

    res.json({ success: true, credential: verified });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/revoke-credential/:credentialId', requireAuth, async (req: any, res) => {
  try {
    const { credentialId } = req.params;
    const { reason } = req.body;

    const revoked = await transcriptManagementVerificationService.revokeCredential(credentialId, reason);

    res.json({ success: true, credential: revoked });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/verification-chain/:credentialId', requireAuth, async (req: any, res) => {
  try {
    const { credentialId } = req.params;
    const { issuerSignature } = req.body;

    const chain = await transcriptManagementVerificationService.createVerificationChain(credentialId, issuerSignature);

    res.json({ success: true, chain });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/export/:transcriptId', requireAuth, async (req: any, res) => {
  try {
    const { transcriptId } = req.params;
    const { format } = req.body;

    const exportRecord = await transcriptManagementVerificationService.exportTranscript(transcriptId, format);

    res.json({ success: true, export: exportRecord });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/archive/:userId', requireAuth, async (req: any, res) => {
  try {
    const { userId } = req.params;

    const archive = await transcriptManagementVerificationService.archiveTranscripts(userId);

    res.json({ success: true, archive });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/history/:userId', requireAuth, async (req: any, res) => {
  try {
    const { userId } = req.params;

    const history = await transcriptManagementVerificationService.getUserTranscriptHistory(userId);

    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
