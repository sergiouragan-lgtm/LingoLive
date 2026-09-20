import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { searchService, SearchIndexType } from '../services/search.service';

const router = Router();

/**
 * @swagger
 * /search:
 *   post:
 *     summary: Full-text search across all indexes
 *     tags:
 *       - Search
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 minLength: 1
 *               indexTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [ebooks, courses, users, vocabulary, lessons, exercises]
 *               limit:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 100
 *               offset:
 *                 type: number
 *                 minimum: 0
 *               filters:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     field:
 *                       type: string
 *                     operator:
 *                       type: string
 *                       enum: [eq, lt, lte, gt, gte, in, contains]
 *                     value:
 *                       type: string
 */
router.post('/', requireAuth, async (req: any, res) => {
  try {
    const { query, indexTypes, limit, offset, filters } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Missing or invalid required field: query',
      });
    }

    const validIndexTypes = indexTypes
      ? indexTypes.filter((type: string) =>
          Object.values(SearchIndexType).includes(type as SearchIndexType)
        )
      : Object.values(SearchIndexType);

    const searchOptions = {
      limit: Math.min(limit || 20, 100),
      offset: offset || 0,
      filters,
      userId: req.user?.uid,
    };

    const results = await searchService.search(query.trim(), validIndexTypes, searchOptions);

    // Record search for analytics
    if (validIndexTypes.length > 0) {
      await searchService.recordSearch(
        req.user?.uid || 'anonymous',
        query.trim(),
        validIndexTypes[0] as SearchIndexType,
        results.length
      );
    }

    res.json({
      success: true,
      query: query.trim(),
      indexTypes: validIndexTypes,
      resultCount: results.length,
      limit: searchOptions.limit,
      offset: searchOptions.offset,
      results,
    });
  } catch (error: any) {
    console.error('Error performing search:', error);
    res.status(500).json({ error: 'Failed to perform search' });
  }
});

/**
 * @swagger
 * /search/suggestions:
 *   get:
 *     summary: Get search suggestions/autocomplete
 *     tags:
 *       - Search
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 50
 */
router.get('/suggestions', requireAuth, async (req: any, res) => {
  try {
    const { query, limit } = req.query;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Missing or invalid required parameter: query',
      });
    }

    const suggestions = await searchService.getSuggestions(
      query.trim(),
      Math.min(Number(limit) || 10, 50)
    );

    res.json({
      success: true,
      query: query.trim(),
      suggestions,
      count: suggestions.length,
    });
  } catch (error: any) {
    console.error('Error fetching search suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch search suggestions' });
  }
});

/**
 * @swagger
 * /search/trending:
 *   get:
 *     summary: Get trending searches
 *     tags:
 *       - Search
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 50
 */
router.get('/trending', requireAuth, async (req: any, res) => {
  try {
    const { limit } = req.query;

    const trendingSearches = await searchService.getTrendingSearches(
      Math.min(Number(limit) || 10, 50)
    );

    res.json({
      success: true,
      trending: trendingSearches,
      count: trendingSearches.length,
    });
  } catch (error: any) {
    console.error('Error fetching trending searches:', error);
    res.status(500).json({ error: 'Failed to fetch trending searches' });
  }
});

/**
 * @swagger
 * /search/statistics:
 *   get:
 *     summary: Get search analytics and statistics
 *     tags:
 *       - Search
 *     security:
 *       - bearerAuth: []
 */
router.get('/statistics', requireAuth, async (req: any, res) => {
  try {
    const statistics = await searchService.getSearchStatistics();

    res.json({
      success: true,
      statistics,
    });
  } catch (error: any) {
    console.error('Error fetching search statistics:', error);
    res.status(500).json({ error: 'Failed to fetch search statistics' });
  }
});

/**
 * @swagger
 * /search/cache/clear:
 *   post:
 *     summary: Clear search cache
 *     tags:
 *       - Search
 *     security:
 *       - bearerAuth: []
 */
router.post('/cache/clear', requireAuth, async (req: any, res) => {
  try {
    searchService.clearCache();

    res.json({
      success: true,
      message: 'Search cache cleared successfully',
    });
  } catch (error: any) {
    console.error('Error clearing search cache:', error);
    res.status(500).json({ error: 'Failed to clear search cache' });
  }
});

export default router;
