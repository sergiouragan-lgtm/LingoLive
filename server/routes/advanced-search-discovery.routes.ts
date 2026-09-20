import { Router, Request, Response } from 'express';
import { advancedSearchDiscoveryService } from '../services/advanced-search-discovery.service';

const router = Router();

router.post('/index/document', async (req: Request, res: Response) => {
  try {
    const { documentId, title, content, keywords, metadata, language } = req.body;
    const index = await advancedSearchDiscoveryService.indexDocument(
      documentId,
      title,
      content,
      keywords,
      metadata,
      language || 'en'
    );
    res.status(201).json(index);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/semantic/search', async (req: Request, res: Response) => {
  try {
    const { query, embedding, limit } = req.body;
    const result = await advancedSearchDiscoveryService.performSemanticSearch(
      query,
      embedding,
      limit || 10
    );
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/recommendations/generate', async (req: Request, res: Response) => {
  try {
    const { userId, algorithm } = req.body;
    const engine = await advancedSearchDiscoveryService.generateRecommendations(
      userId,
      algorithm || 'hybrid'
    );
    res.status(201).json(engine);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/feed/:userId/:type', async (req: Request, res: Response) => {
  try {
    const { userId, type } = req.params;
    const feed = await advancedSearchDiscoveryService.generateDiscoveryFeed(
      userId,
      type as any
    );
    res.status(200).json(feed);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/trending', async (req: Request, res: Response) => {
  try {
    const { period } = req.query;
    const trending = await advancedSearchDiscoveryService.getTrendingContent(
      (period as any) || 'daily'
    );
    res.status(200).json(trending);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const analytics = await advancedSearchDiscoveryService.getSearchAnalytics({ start: startDate, end: endDate });
    res.status(200).json(analytics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
