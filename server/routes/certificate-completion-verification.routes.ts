import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { certificateCompletionVerificationService } from '../services/certificate-completion-verification.service';

const router = Router();

router.post('/create-template', requireAuth, async (req: any, res) => {
  try {
    const { templateName, courseId, courseName, issuingOrganization, requirementsMet } = req.body;

    const template = await certificateCompletionVerificationService.createCertificateTemplate(
      templateName,
      courseId,
      courseName,
      issuingOrganization,
      requirementsMet
    );

    res.json({ success: true, template });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/issue/:certificateId', requireAuth, async (req: any, res) => {
  try {
    const { certificateId } = req.params;
    const { userId, userName, metadata } = req.body;

    const issuedCert = await certificateCompletionVerificationService.issueCertificateToUser(
      certificateId,
      userId,
      userName,
      metadata
    );

    res.json({ success: true, certificate: issuedCert });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/verify', requireAuth, async (req: any, res) => {
  try {
    const { verificationCode, verifier } = req.body;

    const verification = await certificateCompletionVerificationService.verifyCertificate(verificationCode, verifier);

    res.json({ success: true, verification });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/revoke/:issuedCertificateId', requireAuth, async (req: any, res) => {
  try {
    const { issuedCertificateId } = req.params;
    const { reason } = req.body;

    const revoked = await certificateCompletionVerificationService.revokeCertificate(issuedCertificateId, reason);

    res.json({ success: true, certificate: revoked });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:userId', requireAuth, async (req: any, res) => {
  try {
    const { userId } = req.params;

    const certificates = await certificateCompletionVerificationService.getUserCertificates(userId);

    res.json({ success: true, certificates });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/eligibility/:userId/:certificateId', requireAuth, async (req: any, res) => {
  try {
    const { userId, certificateId } = req.params;

    const eligibility = await certificateCompletionVerificationService.validateCertificateEligibility(userId, certificateId);

    res.json({ success: true, eligibility });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/report/:userId', requireAuth, async (req: any, res) => {
  try {
    const { userId } = req.params;

    const report = await certificateCompletionVerificationService.generateCertificateReport(userId);

    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
