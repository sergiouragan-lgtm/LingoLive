import { Router, Request, Response } from 'express';
import { apiDocumentationDeveloperExperienceService } from '../services/api-documentation-developer-experience.service';

const router = Router();

router.post('/endpoints/create', async (req: Request, res: Response) => {
  try {
    const { path, method, description, parameters, responseSchema, statusCodes, tags, requestBody } = req.body;
    const endpoint = await apiDocumentationDeveloperExperienceService.createAPIEndpoint(
      path,
      method,
      description,
      parameters,
      responseSchema,
      statusCodes,
      tags,
      requestBody
    );
    res.status(201).json(endpoint);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/documentation/publish', async (req: Request, res: Response) => {
  try {
    const { title, version, description, baseURL, endpoints, schemas, security } = req.body;
    const docs = await apiDocumentationDeveloperExperienceService.publishAPIDocs(
      title,
      version,
      description,
      baseURL,
      endpoints,
      schemas,
      security
    );
    res.status(201).json(docs);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/guides/create', async (req: Request, res: Response) => {
  try {
    const { title, content, category, codeExamples, relatedEndpoints } = req.body;
    const guide = await apiDocumentationDeveloperExperienceService.createDeveloperGuide(
      title,
      content,
      category,
      codeExamples,
      relatedEndpoints
    );
    res.status(201).json(guide);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/sdks/publish', async (req: Request, res: Response) => {
  try {
    const { name, language, version, repositoryURL, documentation } = req.body;
    const sdk = await apiDocumentationDeveloperExperienceService.publishSDKMetadata(
      name,
      language,
      version,
      repositoryURL,
      documentation
    );
    res.status(201).json(sdk);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/metrics/record', async (req: Request, res: Response) => {
  try {
    const { apiCallsPerDay, uniqueDevelopers, averageResponseTime, documentationViews, codeExampleDownloads, errorRate } = req.body;
    const metrics = await apiDocumentationDeveloperExperienceService.recordAPIUsageMetrics(
      apiCallsPerDay,
      uniqueDevelopers,
      averageResponseTime,
      documentationViews,
      codeExampleDownloads,
      errorRate
    );
    res.status(201).json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/metrics/experience', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const metrics = await apiDocumentationDeveloperExperienceService.getDeveloperExperienceMetrics({ start: startDate, end: endDate });
    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/endpoints/:endpointId/deprecate', async (req: Request, res: Response) => {
  try {
    const { endpointId } = req.params;
    const { deprecated } = req.body;
    const endpoint = await apiDocumentationDeveloperExperienceService.updateAPIEndpointDeprecation(
      endpointId,
      deprecated
    );
    res.status(200).json(endpoint);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
