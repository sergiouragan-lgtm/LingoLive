import { Router, Request, Response } from 'express';
import { internationalizationLocalizationService } from '../services/internationalization-localization.service';

const router = Router();

router.post('/languages/create', async (req: Request, res: Response) => {
  try {
    const { code, name, nativeNativeName, region } = req.body;
    const language = await internationalizationLocalizationService.createLanguage(
      code,
      name,
      nativeNativeName,
      region
    );
    res.status(201).json(language);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/keys/define', async (req: Request, res: Response) => {
  try {
    const { key, defaultValue, description, context } = req.body;
    const translationKey = await internationalizationLocalizationService.defineTranslationKey(
      key,
      defaultValue,
      description,
      context
    );
    res.status(201).json(translationKey);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/translations/submit', async (req: Request, res: Response) => {
  try {
    const { keyId, languageCode, translatedValue, translatedBy } = req.body;
    const translation = await internationalizationLocalizationService.submitTranslation(
      keyId,
      languageCode,
      translatedValue,
      translatedBy
    );
    res.status(201).json(translation);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/regions/define', async (req: Request, res: Response) => {
  try {
    const { code, name, languages, currencyCode, dateFormat, timeFormat, numberFormat } = req.body;
    const region = await internationalizationLocalizationService.defineLocalizationRegion(
      code,
      name,
      languages,
      currencyCode,
      dateFormat,
      timeFormat,
      numberFormat
    );
    res.status(201).json(region);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/translation-memory/build', async (req: Request, res: Response) => {
  try {
    const { sourceLanguage, targetLanguage, segments } = req.body;
    const memory = await internationalizationLocalizationService.buildTranslationMemory(
      sourceLanguage,
      targetLanguage,
      segments
    );
    res.status(201).json(memory);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/translations/:translationId/review', async (req: Request, res: Response) => {
  try {
    const { translationId } = req.params;
    const { status, reviewedBy } = req.body;
    const translation = await internationalizationLocalizationService.reviewTranslation(
      translationId,
      status,
      reviewedBy
    );
    res.status(200).json(translation);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const metrics = await internationalizationLocalizationService.getLocalizationMetrics({ start: startDate, end: endDate });
    res.status(200).json(metrics);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
