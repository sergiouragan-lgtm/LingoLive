import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { testDocumentationBestPracticesService } from '../services/test-documentation-best-practices.service';

const router = Router();

router.post('/guidelines', requireAuth, async (req: Request, res: Response) => {
  try {
    const { category, title, description, bestPractices, antiPatterns } = req.body;
    const guideline = await testDocumentationBestPracticesService.createTestingGuideline(
      category,
      title,
      description,
      bestPractices,
      antiPatterns
    );
    res.json(guideline);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/guidelines', requireAuth, async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const guidelines = await testDocumentationBestPracticesService.getTestingGuidelines(category);
    res.json(guidelines);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/test-data-management', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, description, dataType, scope, schema } = req.body;
    const management = await testDocumentationBestPracticesService.defineTestDataManagement(
      name,
      description,
      dataType,
      scope,
      schema
    );
    res.json(management);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/mock-stub-strategies', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, description, targetModule, mockType, useCases } = req.body;
    const strategy = await testDocumentationBestPracticesService.defineMockStubStrategy(
      name,
      description,
      targetModule,
      mockType,
      useCases
    );
    res.json(strategy);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/playbooks', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, category, description, targetAudience, difficultyLevel } = req.body;
    const playbook = await testDocumentationBestPracticesService.createTestingPlaybook(
      name,
      category,
      description,
      targetAudience,
      difficultyLevel
    );
    res.json(playbook);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/playbooks', requireAuth, async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const playbooks = await testDocumentationBestPracticesService.getTestingPlaybooks(category);
    res.json(playbooks);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/testing-standards', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, description, category, rules, enforcementLevel } = req.body;
    const standard = await testDocumentationBestPracticesService.defineTestingStandard(
      name,
      description,
      category,
      rules,
      enforcementLevel
    );
    res.json(standard);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/documentation-templates', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, type, sections, format } = req.body;
    const template = await testDocumentationBestPracticesService.createDocumentationTemplate(
      name,
      type,
      sections,
      format
    );
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
