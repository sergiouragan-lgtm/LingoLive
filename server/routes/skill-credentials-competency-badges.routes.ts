import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { skillCredentialsCompetencyBadgesService } from '../services/skill-credentials-competency-badges.service';

const router = Router();

router.post('/create-credential', requireAuth, async (req: any, res) => {
  try {
    const { skillId, skillName, skillCategory, description, level, verificationMethod } = req.body;

    const credential = await skillCredentialsCompetencyBadgesService.createSkillCredential(
      skillId,
      skillName,
      skillCategory,
      description,
      level,
      verificationMethod
    );

    res.json({ success: true, credential });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/create-badge', requireAuth, async (req: any, res) => {
  try {
    const {
      badgeName,
      competencyId,
      competencyName,
      competencyType,
      badgeImageUrl,
      criteria,
      difficultyLevel,
      prerequisites,
      pointValue,
    } = req.body;

    const badge = await skillCredentialsCompetencyBadgesService.createCompetencyBadge(
      badgeName,
      competencyId,
      competencyName,
      competencyType,
      badgeImageUrl,
      criteria,
      difficultyLevel,
      prerequisites,
      pointValue
    );

    res.json({ success: true, badge });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/profile/:userId', requireAuth, async (req: any, res) => {
  try {
    const { userId } = req.params;

    const profile = await skillCredentialsCompetencyBadgesService.buildUserCompetencyProfile(userId);

    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/award/:userId/:badgeId', requireAuth, async (req: any, res) => {
  try {
    const { userId, badgeId } = req.params;
    const { evidenceDocuments } = req.body;

    const completion = await skillCredentialsCompetencyBadgesService.awardCompetencyBadge(userId, badgeId, evidenceDocuments);

    res.json({ success: true, completion });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/verify/:credentialId', requireAuth, async (req: any, res) => {
  try {
    const { credentialId } = req.params;
    const { proficiencyScore } = req.body;

    const verified = await skillCredentialsCompetencyBadgesService.verifySkillCompetency(credentialId, proficiencyScore);

    res.json({ success: true, credential: verified });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/endorse/:credentialId', requireAuth, async (req: any, res) => {
  try {
    const { credentialId } = req.params;
    const { endorserId } = req.body;

    const endorsed = await skillCredentialsCompetencyBadgesService.endorseSkillCredential(credentialId, endorserId);

    res.json({ success: true, credential: endorsed });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/report/:userId', requireAuth, async (req: any, res) => {
  try {
    const { userId } = req.params;

    const report = await skillCredentialsCompetencyBadgesService.generateSkillCompetencyReport(userId);

    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
