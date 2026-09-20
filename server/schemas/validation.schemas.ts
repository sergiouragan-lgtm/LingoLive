import { z } from 'zod';

// Shared schemas
const UUIDSchema = z.string().uuid('Invalid UUID format');
const EmailSchema = z.string().email('Invalid email format');
const LanguageSchema = z.enum(['en', 'es', 'fr', 'pt', 'it', 'de', 'ja', 'zh']);

// ===== API Validation Schemas =====

/**
 * Vocabulary sync request validation
 * Used by: POST /api/sync-vocabulary
 */
export const VocabSyncSchema = z.object({
  userId: UUIDSchema.optional(), // Optional because verified from token
  words: z.array(
    z.object({
      word: z.string().min(1).max(100),
      definition: z.string().max(500),
      language: LanguageSchema,
      pronunciation: z.string().optional(),
      exampleSentence: z.string().max(1000).optional(),
    })
  ).min(1).max(1000), // At least 1 word, max 1000 at a time
});

export type VocabSync = z.infer<typeof VocabSyncSchema>;

/**
 * User profile update validation
 * Used by: PUT /api/profile
 */
export const UserProfileUpdateSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
  preferences: z.object({
    language: LanguageSchema.optional(),
    theme: z.enum(['light', 'dark', 'auto']).optional(),
    notifications: z.boolean().optional(),
  }).optional(),
}).strict(); // Don't allow extra fields

export type UserProfileUpdate = z.infer<typeof UserProfileUpdateSchema>;

/**
 * Assessment submission validation
 * Used by: POST /api/assessment/submit
 */
export const AssessmentSubmissionSchema = z.object({
  assessmentId: UUIDSchema,
  answers: z.array(
    z.object({
      questionId: z.string(),
      answer: z.union([z.string(), z.number(), z.array(z.string())]),
      timeSpentSeconds: z.number().int().min(0).optional(),
    })
  ).min(1),
  completedAt: z.string().datetime().optional(),
}).strict();

export type AssessmentSubmission = z.infer<typeof AssessmentSubmissionSchema>;

/**
 * Payment intent creation validation
 * Used by: POST /api/payment/create-intent
 */
export const PaymentIntentSchema = z.object({
  amount: z.number().int().min(100).max(999999), // Amount in cents (min $1, max $9,999.99)
  currency: z.enum(['USD', 'EUR', 'BRL', 'GBP']).default('USD'),
  subscriptionPlanId: z.string().optional(),
  metadata: z.record(z.string()).optional(),
}).strict();

export type PaymentIntent = z.infer<typeof PaymentIntentSchema>;

/**
 * Ebook chapter update validation
 * Used by: PUT /api/ebook/:ebookId/chapters/:chapterId
 */
export const EbookChapterUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().max(100000).optional(), // Max ~20k words
  coverImageUrl: z.string().url().optional(),
  publishedAt: z.string().datetime().optional(),
  wordCount: z.number().int().min(0).optional(),
}).strict();

export type EbookChapterUpdate = z.infer<typeof EbookChapterUpdateSchema>;

/**
 * Learning path progress validation
 * Used by: POST /api/learning-path/progress
 */
export const LearningPathProgressSchema = z.object({
  pathId: UUIDSchema,
  lessonId: UUIDSchema,
  completionPercentage: z.number().int().min(0).max(100),
  timeSpentSeconds: z.number().int().min(0).max(3600).optional(),
  score: z.number().min(0).max(100).optional(),
}).strict();

export type LearningPathProgress = z.infer<typeof LearningPathProgressSchema>;

/**
 * Chat message validation
 * Used by: POST /api/ai-tutor/chat
 */
export const ChatMessageSchema = z.object({
  conversationId: UUIDSchema,
  message: z.string().min(1).max(5000),
  language: LanguageSchema,
  context: z.object({
    topicId: z.string().optional(),
    difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  }).optional(),
}).strict();

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// ===== Validation Middleware Factory =====

/**
 * Creates a validation middleware for request body
 * Usage: app.post('/api/endpoint', validateBody(SomeSchema), handler)
 */
export function validateBody<T extends z.ZodType>(schema: T) {
  return async (req: any, res: any, next: any) => {
    try {
      const validated = await schema.parseAsync(req.body);
      req.validatedBody = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message,
            code: e.code,
          })),
        });
      }
      next(error);
    }
  };
}

/**
 * Creates a validation middleware for request query parameters
 * Usage: app.get('/api/endpoint', validateQuery(SomeSchema), handler)
 */
export function validateQuery<T extends z.ZodType>(schema: T) {
  return async (req: any, res: any, next: any) => {
    try {
      const validated = await schema.parseAsync(req.query);
      req.validatedQuery = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message,
            code: e.code,
          })),
        });
      }
      next(error);
    }
  };
}

/**
 * Creates a validation middleware for route parameters
 * Usage: app.get('/api/:id', validateParams(z.object({ id: UUIDSchema })), handler)
 */
export function validateParams<T extends z.ZodType>(schema: T) {
  return async (req: any, res: any, next: any) => {
    try {
      const validated = await schema.parseAsync(req.params);
      req.validatedParams = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid path parameters',
          details: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message,
            code: e.code,
          })),
        });
      }
      next(error);
    }
  };
}
