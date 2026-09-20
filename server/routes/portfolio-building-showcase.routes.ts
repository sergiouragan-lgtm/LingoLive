import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { portfolioBuildingShowcaseService } from '../services/portfolio-building-showcase.service';

const router = Router();

router.post('/create', requireAuth, async (req: any, res) => {
  try {
    const { userId, portfolioTitle, description, portfolioType } = req.body;

    const portfolio = await portfolioBuildingShowcaseService.createPortfolio(userId, portfolioTitle, description, portfolioType);

    res.json({ success: true, portfolio });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/:portfolioId/project', requireAuth, async (req: any, res) => {
  try {
    const { portfolioId } = req.params;
    const { projectName, description, category, images, skillsApplied } = req.body;

    const portfolio = await portfolioBuildingShowcaseService.addProjectToPortfolio(
      portfolioId,
      projectName,
      description,
      category,
      images,
      skillsApplied
    );

    res.json({ success: true, portfolio });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/:portfolioId/achievement', requireAuth, async (req: any, res) => {
  try {
    const { portfolioId } = req.params;
    const { title, description, category, badgeUrl, issuer } = req.body;

    const portfolio = await portfolioBuildingShowcaseService.addAchievementToPortfolio(
      portfolioId,
      title,
      description,
      category,
      badgeUrl,
      issuer
    );

    res.json({ success: true, portfolio });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/:portfolioId/skill', requireAuth, async (req: any, res) => {
  try {
    const { portfolioId } = req.params;
    const { skillName, proficiencyLevel, yearsOfExperience } = req.body;

    const portfolio = await portfolioBuildingShowcaseService.addSkillShowcaseToPortfolio(
      portfolioId,
      skillName,
      proficiencyLevel,
      yearsOfExperience
    );

    res.json({ success: true, portfolio });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/:portfolioId/testimonial', requireAuth, async (req: any, res) => {
  try {
    const { portfolioId } = req.params;
    const { fromUserId, fromUserName, fromUserRole, content, rating } = req.body;

    const portfolio = await portfolioBuildingShowcaseService.addTestimonialToPortfolio(
      portfolioId,
      fromUserId,
      fromUserName,
      fromUserRole,
      content,
      rating
    );

    res.json({ success: true, portfolio });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/:portfolioId/theme/:themeId', requireAuth, async (req: any, res) => {
  try {
    const { portfolioId, themeId } = req.params;

    const theme = await portfolioBuildingShowcaseService.applyPortfolioTheme(portfolioId, themeId);

    res.json({ success: true, theme });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/:portfolioId/share', requireAuth, async (req: any, res) => {
  try {
    const { portfolioId } = req.params;
    const { shareType, sharedWith, expiryDays } = req.body;

    const share = await portfolioBuildingShowcaseService.sharePortfolio(portfolioId, shareType, sharedWith, expiryDays);

    res.json({ success: true, share });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/:portfolioId/visibility', requireAuth, async (req: any, res) => {
  try {
    const { portfolioId } = req.params;
    const { visibility } = req.body;

    const portfolio = await portfolioBuildingShowcaseService.updatePortfolioVisibility(portfolioId, visibility);

    res.json({ success: true, portfolio });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:portfolioId/analytics', requireAuth, async (req: any, res) => {
  try {
    const { portfolioId } = req.params;

    const analytics = await portfolioBuildingShowcaseService.getPortfolioAnalytics(portfolioId);

    res.json({ success: true, analytics });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/:portfolioId/view', async (req: any, res) => {
  try {
    const { portfolioId } = req.params;
    const { visitorId, deviceType } = req.body;

    const view = await portfolioBuildingShowcaseService.recordPortfolioView(portfolioId, visitorId, deviceType);

    res.json({ success: true, view });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
