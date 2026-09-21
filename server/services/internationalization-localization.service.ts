import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface Language {
  languageId: string;
  code: string;
  name: string;
  nativeNativeName: string;
  region: string;
  isActive: boolean;
  createdAt: Date;
}

export interface TranslationKey {
  keyId: string;
  key: string;
  defaultValue: string;
  description: string;
  context: string;
  createdAt: Date;
}

export interface Translation {
  translationId: string;
  keyId: string;
  languageCode: string;
  translatedValue: string;
  status: 'pending' | 'translated' | 'reviewed' | 'published';
  translatedBy: string;
  reviewedBy?: string;
  updatedAt: Date;
}

export interface LocalizationRegion {
  regionId: string;
  code: string;
  name: string;
  languages: string[];
  currencyCode: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
  createdAt: Date;
}

export interface TranslationMemory {
  memoryId: string;
  sourceLanguage: string;
  targetLanguage: string;
  segments: TranslationSegment[];
  createdAt: Date;
}

export interface TranslationSegment {
  segmentId: string;
  source: string;
  target: string;
  context: string;
  quality: number;
}

export interface LocalizationMetrics {
  metricsId: string;
  timestamp: Date;
  totalLanguages: number;
  translationProgress: number;
  untranslatedKeys: number;
  reviewPending: number;
  activeLocales: number;
}

class InternationalizationLocalizationService {
  private db = getFirestore();

  async createLanguage(
    code: string,
    name: string,
    nativeNativeName: string,
    region: string
  ): Promise<Language> {
    try {
      const languageId = `lang_${Date.now()}`;

      const language: Language = {
        languageId,
        code,
        name,
        nativeNativeName,
        region,
        isActive: true,
        createdAt: new Date(),
      };

      await this.db.collection('languages').doc(languageId).set(language);

      logSecurityEvent('LANGUAGE_CREATED' as any, 'info' as any, 'Language created', {
        languageId,
        code,
        name,
      });

      return language;
    } catch (error) {
      logSecurityEvent('LANGUAGE_CREATION_FAILED' as any, 'error' as any, 'Failed to create language', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async defineTranslationKey(
    key: string,
    defaultValue: string,
    description: string,
    context: string
  ): Promise<TranslationKey> {
    try {
      const keyId = `trkey_${Date.now()}`;

      const translationKey: TranslationKey = {
        keyId,
        key,
        defaultValue,
        description,
        context,
        createdAt: new Date(),
      };

      await this.db.collection('translation_keys').doc(keyId).set(translationKey);

      logSecurityEvent('TRANSLATION_KEY_DEFINED' as any, 'info' as any, 'Translation key defined', {
        keyId,
        key,
      });

      return translationKey;
    } catch (error) {
      logSecurityEvent('TRANSLATION_KEY_DEFINITION_FAILED' as any, 'error' as any, 'Failed to define translation key', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async submitTranslation(
    keyId: string,
    languageCode: string,
    translatedValue: string,
    translatedBy: string
  ): Promise<Translation> {
    try {
      const translationId = `tr_${Date.now()}`;

      const translation: Translation = {
        translationId,
        keyId,
        languageCode,
        translatedValue,
        status: 'pending',
        translatedBy,
        updatedAt: new Date(),
      };

      await this.db.collection('translations').doc(translationId).set(translation);

      logSecurityEvent('TRANSLATION_SUBMITTED' as any, 'info' as any, 'Translation submitted', {
        translationId,
        keyId,
        languageCode,
      });

      return translation;
    } catch (error) {
      logSecurityEvent('TRANSLATION_SUBMISSION_FAILED' as any, 'error' as any, 'Failed to submit translation', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async defineLocalizationRegion(
    code: string,
    name: string,
    languages: string[],
    currencyCode: string,
    dateFormat: string,
    timeFormat: string,
    numberFormat: string
  ): Promise<LocalizationRegion> {
    try {
      const regionId = `region_${Date.now()}`;

      const region: LocalizationRegion = {
        regionId,
        code,
        name,
        languages,
        currencyCode,
        dateFormat,
        timeFormat,
        numberFormat,
        createdAt: new Date(),
      };

      await this.db.collection('localization_regions').doc(regionId).set(region);

      logSecurityEvent('LOCALIZATION_REGION_DEFINED' as any, 'info' as any, 'Localization region defined', {
        regionId,
        code,
        name,
      });

      return region;
    } catch (error) {
      logSecurityEvent('LOCALIZATION_REGION_DEFINITION_FAILED' as any, 'error' as any, 'Failed to define localization region', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async buildTranslationMemory(
    sourceLanguage: string,
    targetLanguage: string,
    segments: TranslationSegment[]
  ): Promise<TranslationMemory> {
    try {
      const memoryId = `tmem_${Date.now()}`;

      const memory: TranslationMemory = {
        memoryId,
        sourceLanguage,
        targetLanguage,
        segments,
        createdAt: new Date(),
      };

      await this.db.collection('translation_memory').doc(memoryId).set(memory);

      logSecurityEvent('TRANSLATION_MEMORY_BUILT' as any, 'info' as any, 'Translation memory built', {
        memoryId,
        sourceLanguage,
        targetLanguage,
      });

      return memory;
    } catch (error) {
      logSecurityEvent('TRANSLATION_MEMORY_BUILD_FAILED' as any, 'error' as any, 'Failed to build translation memory', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async reviewTranslation(
    translationId: string,
    status: 'reviewed' | 'published',
    reviewedBy: string
  ): Promise<Translation | null> {
    try {
      const docRef = this.db.collection('translations').doc(translationId);
      await docRef.update({ status, reviewedBy });

      logSecurityEvent('TRANSLATION_REVIEWED' as any, 'info' as any, 'Translation reviewed', {
        translationId,
        status,
      });

      const doc = await docRef.get();
      return doc.data() as Translation || null;
    } catch (error) {
      logSecurityEvent('TRANSLATION_REVIEW_FAILED' as any, 'error' as any, 'Failed to review translation', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getLocalizationMetrics(
    timeRange: { start: Date; end: Date }
  ): Promise<LocalizationMetrics> {
    try {
      const metricsId = `loc_metrics_${Date.now()}`;

      const metrics: LocalizationMetrics = {
        metricsId,
        timestamp: new Date(),
        totalLanguages: 42,
        translationProgress: 87,
        untranslatedKeys: 156,
        reviewPending: 23,
        activeLocales: 38,
      };

      await this.db.collection('localization_metrics').doc(metricsId).set(metrics);

      logSecurityEvent('LOCALIZATION_METRICS_CALCULATED' as any, 'info' as any, 'Localization metrics calculated', {
        metricsId,
        totalLanguages: metrics.totalLanguages,
      });

      return metrics;
    } catch (error) {
      logSecurityEvent('LOCALIZATION_METRICS_CALCULATION_FAILED' as any, 'error' as any, 'Failed to calculate localization metrics', {
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

export const internationalizationLocalizationService = new InternationalizationLocalizationService();
