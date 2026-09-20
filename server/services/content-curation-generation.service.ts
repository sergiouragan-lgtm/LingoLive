import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface CuratedContent {
  contentId: string;
  title: string;
  description: string;
  contentType: 'article' | 'video' | 'audio' | 'exercise' | 'quiz';
  concept: string;
  difficulty: number; // 1-10
  source: string;
  sourceUrl?: string;
  relevanceScore: number; // 0-100
  engagementScore: number;
  quality: 'high' | 'medium' | 'low';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
  rating: number; // 0-5
  ratingCount: number;
  isApproved: boolean;
}

export interface GeneratedExercise {
  exerciseId: string;
  userId: string;
  concept: string;
  difficulty: number;
  exerciseType: 'fill_blank' | 'multiple_choice' | 'speaking' | 'writing' | 'listening';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  estimatedDuration: number; // seconds
  generatedAt: Date;
  successRate?: number;
}

export interface CurriculumPath {
  pathId: string;
  userId: string;
  targetLanguage: string;
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'fluent';
  totalDuration: number; // hours
  completionPercentage: number;
  modules: ModuleInfo[];
  generatedAt: Date;
  updatedAt: Date;
  customizations: Record<string, any>;
}

export interface ModuleInfo {
  moduleId: string;
  title: string;
  description: string;
  concept: string;
  sequenceNumber: number;
  estimatedHours: number;
  contentIds: string[];
  exerciseIds: string[];
  completed: boolean;
}

export interface ContentMetadata {
  metadataId: string;
  contentId: string;
  keywords: string[];
  concepts: string[];
  prerequisites: string[];
  relatedContent: string[];
  learningOutcomes: string[];
  culturalNotes?: string;
  difficulty: number;
  averageCompletionTime: number; // minutes
}

export interface ABTestVariant {
  variantId: string;
  contentId: string;
  description: string;
  version: number;
  isControl: boolean;
  content: string;
  impressions: number;
  conversions: number;
  conversionRate: number;
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'paused' | 'completed';
}

class ContentCurationGenerationService {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = getFirestore();
  }

  public async curateContentForUser(userId: string, concept: string, limit: number = 10): Promise<CuratedContent[]> {
    try {
      const snapshot = await this.db
        .collection('curated_content')
        .where('concept', '==', concept)
        .where('isApproved', '==', true)
        .orderBy('relevanceScore', 'desc')
        .orderBy('engagementScore', 'desc')
        .limit(limit)
        .get();

      const content = snapshot.docs.map((doc) => doc.data() as CuratedContent);

      for (const item of content) {
        await this.db.collection('curated_content').doc(item.contentId).update({
          viewCount: item.viewCount + 1,
        });
      }

      logSecurityEvent('CONTENT_CURATED' as any, 'error' as any, 'OPERATION FAILED', { userId, concept, count: content.length });
      return content;
    } catch (error) {
      logSecurityEvent('CONTENT_CURATION_FAILED' as any, 'error' as any, 'OPERATION FAILED', { userId, concept, error: (error as Error).message });
      throw error;
    }
  }

  public async generateExercise(
    userId: string,
    concept: string,
    difficulty: number,
    exerciseType: string
  ): Promise<GeneratedExercise> {
    try {
      const exerciseId = `exercise-${userId}-${concept}-${Date.now()}`;
      const exercises = this.generateExerciseContent(concept, difficulty, exerciseType);

      let firstExercise: GeneratedExercise | null = null;
      for (const exercise of exercises) {
        const genEx: GeneratedExercise = {
          exerciseId: `${exerciseId}-${Math.random()}`,
          userId,
          concept,
          difficulty,
          exerciseType: exerciseType as any,
          question: exercise.question,
          options: exercise.options,
          correctAnswer: exercise.correctAnswer,
          explanation: exercise.explanation,
          estimatedDuration: 180,
          generatedAt: new Date(),
        };

        await this.db.collection('generated_exercises').doc(genEx.exerciseId).set(genEx);
        if (!firstExercise) {
          firstExercise = genEx;
        }
      }

      return firstExercise!;
    } catch (error) {
      logSecurityEvent('EXERCISE_GENERATION_FAILED' as any, 'error' as any, 'Exercise generation failed', { userId, concept, error: (error as Error).message });
      throw error;
    }
  }

  public async generatePersonalizedCurriculum(
    userId: string,
    targetLanguage: string,
    proficiencyLevel: string,
    hoursPerWeek: number = 5
  ): Promise<CurriculumPath> {
    try {
      const pathId = `curriculum-${userId}-${Date.now()}`;

      const modules: ModuleInfo[] = [
        {
          moduleId: `mod-1`,
          title: 'Foundations',
          description: 'Basic grammar and vocabulary',
          concept: 'fundamentals',
          sequenceNumber: 1,
          estimatedHours: 10,
          contentIds: [],
          exerciseIds: [],
          completed: false,
        },
        {
          moduleId: `mod-2`,
          title: 'Conversational Skills',
          description: 'Speaking and listening practice',
          concept: 'conversation',
          sequenceNumber: 2,
          estimatedHours: 15,
          contentIds: [],
          exerciseIds: [],
          completed: false,
        },
        {
          moduleId: `mod-3`,
          title: 'Advanced Grammar',
          description: 'Complex structures and nuances',
          concept: 'grammar',
          sequenceNumber: 3,
          estimatedHours: 20,
          contentIds: [],
          exerciseIds: [],
          completed: false,
        },
      ];

      const totalHours = modules.reduce((sum, m) => sum + m.estimatedHours, 0);
      const curriculum: CurriculumPath = {
        pathId,
        userId,
        targetLanguage,
        proficiencyLevel: proficiencyLevel as any,
        totalDuration: totalHours,
        completionPercentage: 0,
        modules,
        generatedAt: new Date(),
        updatedAt: new Date(),
        customizations: { hoursPerWeek },
      };

      await this.db.collection('curriculum_paths').doc(pathId).set(curriculum);
      logSecurityEvent('CURRICULUM_GENERATED' as any, 'error' as any, 'OPERATION FAILED', { userId, targetLanguage, pathId });
      return curriculum;
    } catch (error) {
      logSecurityEvent('CURRICULUM_GENERATION_FAILED' as any, 'error' as any, 'OPERATION FAILED', { userId, error: (error as Error).message });
      throw error;
    }
  }

  public async rateContent(userId: string, contentId: string, rating: number): Promise<void> {
    try {
      if (rating < 0 || rating > 5) throw new Error('Rating must be 0-5');

      const contentDoc = await this.db.collection('curated_content').doc(contentId).get();
      if (!contentDoc.exists) throw new Error('Content not found');

      const content = contentDoc.data() as CuratedContent;
      const newAverageRating =
        (content.rating * content.ratingCount + rating) / (content.ratingCount + 1);

      await this.db.collection('curated_content').doc(contentId).update({
        rating: newAverageRating,
        ratingCount: content.ratingCount + 1,
      });

      await this.db.collection('user_content_ratings').doc(`${userId}-${contentId}`).set({
        userId,
        contentId,
        rating,
        ratedAt: new Date(),
      });

      logSecurityEvent('CONTENT_RATED' as any, 'error' as any, 'OPERATION FAILED', { userId, contentId, rating });
    } catch (error) {
      logSecurityEvent('CONTENT_RATING_FAILED' as any, 'error' as any, 'OPERATION FAILED', { userId, contentId, error: (error as Error).message });
      throw error;
    }
  }

  public async createABTestVariant(
    contentId: string,
    description: string,
    content: string,
    isControl: boolean = false
  ): Promise<ABTestVariant> {
    try {
      const variantId = `variant-${contentId}-${Date.now()}`;

      const existingVariants = await this.db
        .collection('ab_test_variants')
        .where('contentId', '==', contentId)
        .get();

      const variant: ABTestVariant = {
        variantId,
        contentId,
        description,
        version: existingVariants.size,
        isControl,
        content,
        impressions: 0,
        conversions: 0,
        conversionRate: 0,
        startDate: new Date(),
        status: 'active',
      };

      await this.db.collection('ab_test_variants').doc(variantId).set(variant);
      logSecurityEvent('AB_TEST_VARIANT_CREATED' as any, 'error' as any, 'OPERATION FAILED', { variantId, contentId });
      return variant;
    } catch (error) {
      logSecurityEvent('AB_TEST_VARIANT_CREATION_FAILED' as any, 'error' as any, 'OPERATION FAILED', { contentId, error: (error as Error).message });
      throw error;
    }
  }

  public async getContentMetadata(contentId: string): Promise<ContentMetadata> {
    try {
      const metadataDoc = await this.db.collection('content_metadata').doc(contentId).get();

      if (!metadataDoc.exists) {
        const newMetadata: ContentMetadata = {
          metadataId: contentId,
          contentId,
          keywords: [],
          concepts: [],
          prerequisites: [],
          relatedContent: [],
          learningOutcomes: [],
          difficulty: 5,
          averageCompletionTime: 30,
        };
        await this.db.collection('content_metadata').doc(contentId).set(newMetadata);
        return newMetadata;
      }

      return metadataDoc.data() as ContentMetadata;
    } catch (error) {
      logSecurityEvent('CONTENT_METADATA_FETCH_FAILED' as any, 'error' as any, 'OPERATION FAILED', { contentId, error: (error as Error).message });
      throw error;
    }
  }

  public async updateCurriculumProgress(
    pathId: string,
    moduleId: string,
    completed: boolean
  ): Promise<void> {
    try {
      const pathDoc = await this.db.collection('curriculum_paths').doc(pathId).get();
      if (!pathDoc.exists) throw new Error('Curriculum not found');

      const curriculum = pathDoc.data() as CurriculumPath;
      const updatedModules = curriculum.modules.map((m) => (m.moduleId === moduleId ? { ...m, completed } : m));

      const completedCount = updatedModules.filter((m) => m.completed).length;
      const completionPercentage = (completedCount / updatedModules.length) * 100;

      await this.db.collection('curriculum_paths').doc(pathId).update({
        modules: updatedModules,
        completionPercentage,
        updatedAt: new Date(),
      });

      logSecurityEvent('CURRICULUM_PROGRESS_UPDATED' as any, 'error' as any, 'OPERATION FAILED', { pathId, moduleId, completed });
    } catch (error) {
      logSecurityEvent('CURRICULUM_UPDATE_FAILED' as any, 'error' as any, 'OPERATION FAILED', { pathId, error: (error as Error).message });
      throw error;
    }
  }

  private generateExerciseContent(
    concept: string,
    difficulty: number,
    type: string
  ): Array<{ question: string; options?: string[]; correctAnswer: string; explanation: string }> {
    const exercises = [
      {
        question: `What is the correct pronunciation of "${concept}"?`,
        options: ['option-a', 'option-b', 'option-c', 'option-d'],
        correctAnswer: 'option-a',
        explanation: 'The correct pronunciation emphasizes the first syllable.',
      },
    ];
    return exercises;
  }
}

export const contentCurationGenerationService = new ContentCurationGenerationService();
