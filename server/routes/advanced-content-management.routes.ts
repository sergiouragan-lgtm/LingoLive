import { Router, Request, Response } from 'express';
import { advancedContentManagementService } from '../services/advanced-content-management.service';

const router = Router();

router.post('/items/create', async (req: Request, res: Response) => {
  try {
    const { title, description, type, authorId, tags, categories, metadata } = req.body;
    const content = await advancedContentManagementService.createContentItem(
      title,
      description,
      type,
      authorId,
      tags,
      categories,
      metadata
    );
    res.status(201).json(content);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/templates/create', async (req: Request, res: Response) => {
  try {
    const { name, description, structure, defaultValues, category } = req.body;
    const template = await advancedContentManagementService.createContentTemplate(
      name,
      description,
      structure,
      defaultValues,
      category
    );
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/versions/create', async (req: Request, res: Response) => {
  try {
    const { contentId, content, changedBy, changeDescription } = req.body;
    const version = await advancedContentManagementService.createContentVersion(
      contentId,
      content,
      changedBy,
      changeDescription
    );
    res.status(201).json(version);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/workflows/initiate', async (req: Request, res: Response) => {
  try {
    const { contentId, approvers } = req.body;
    const workflow = await advancedContentManagementService.initiateContentWorkflow(
      contentId,
      approvers
    );
    res.status(201).json(workflow);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/assets/manage', async (req: Request, res: Response) => {
  try {
    const { name, type, size, storageLocation, uploadedBy } = req.body;
    const asset = await advancedContentManagementService.manageAsset(
      name,
      type,
      size,
      storageLocation,
      uploadedBy
    );
    res.status(201).json(asset);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/items/:contentId/publish', async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;
    const content = await advancedContentManagementService.publishContent(contentId);
    res.status(200).json(content);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const metrics = await advancedContentManagementService.getContentMetrics({ start: startDate, end: endDate });
    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
