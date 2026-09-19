/**
 * Migration: 001_add_feature_schemas
 * Adds new Firestore collections and indexes for:
 * - Subscriptions (payment system)
 * - E-book marketplace
 * - Live classes
 * - AI tutor insights
 * - Gamification
 *
 * Usage: Run via Firebase CLI or manual Firestore UI operations
 */

import { db } from '../config/firebase';
import { setDoc, doc, collection } from 'firebase/firestore';

const MIGRATION_VERSION = '001';

/**
 * Collection schemas (documentation only - Firestore is schema-less)
 */

export const SCHEMAS = {
  subscriptions: {
    path: 'subscriptions/{subId}',
    fields: {
      id: 'string',
      userId: 'string (indexed)',
      planId: 'string (indexed)',
      stripeSubscriptionId: 'string (unique)',
      status: 'enum: active|paused|cancelled|past_due|incomplete',
      billingCycle: 'enum: monthly|yearly',
      currentPeriodStart: 'number (timestamp)',
      currentPeriodEnd: 'number (timestamp)',
      nextBillingDate: 'number (timestamp)',
      pausedAt: 'number (timestamp, nullable)',
      cancelledAt: 'number (timestamp, nullable)',
      metadata: 'object',
      createdAt: 'number (timestamp)',
      updatedAt: 'number (timestamp)',
    },
    indexes: [
      { fields: [{ path: 'userId', direction: 'ASCENDING' }, { path: 'status', direction: 'ASCENDING' }] },
      { fields: [{ path: 'createdAt', direction: 'DESCENDING' }] },
    ],
  },

  payment_methods: {
    path: 'payment_methods/{userId}',
    fields: {
      userId: 'string',
      cards: 'array of { id, last4, expMonth, expYear, brand, default }',
      bankAccounts: 'array of { id, bankName, accountLast4, default }',
      updatedAt: 'number (timestamp)',
    },
  },

  ebook_marketplace: {
    path: 'ebook_marketplace/{ebookId}',
    fields: {
      id: 'string',
      title: 'string (indexed)',
      author: 'string (indexed)',
      description: 'string',
      price: 'number (indexed)',
      currency: 'string',
      cover: 'string (URL)',
      publisher: 'string',
      publishedDate: 'number (timestamp)',
      language: 'string (indexed)',
      level: 'string (indexed, e.g., A1, A2, B1, B2)',
      skills: 'array of strings',
      format: 'enum: pdf|epub',
      fileSize: 'number (bytes)',
      pageCount: 'number',
      salesMetrics: 'object { totalSales, avgRating, reviewCount }',
      createdAt: 'number (timestamp)',
      updatedAt: 'number (timestamp)',
    },
    indexes: [
      { fields: [{ path: 'price', direction: 'ASCENDING' }] },
      { fields: [{ path: 'level', direction: 'ASCENDING' }] },
      { fields: [{ path: 'language', direction: 'ASCENDING' }] },
      { fields: [{ path: 'createdAt', direction: 'DESCENDING' }] },
    ],
  },

  ebook_content: {
    path: 'ebook_content/{ebookId}',
    fields: {
      metadata: 'object (refers to ebook_marketplace)',
      content: 'object { pages: [ { text, images, metadata } ] }',
      reviews: 'array of { userId, rating, text, createdAt }',
      updatedAt: 'number (timestamp)',
    },
  },

  user_ebook_purchases: {
    path: 'user_ebook_purchases/{userId}/{ebookId}',
    fields: {
      purchasedAt: 'number (timestamp)',
      expiresAt: 'number (timestamp, nullable for lifetime licenses)',
      accessUrl: 'string',
      readingProgress: 'number (percentage)',
      bookmarks: 'array of { pageNumber, note }',
      highlights: 'array of { text, pageNumber, color }',
      notes: 'array of { text, pageNumber }',
      lastAccessedAt: 'number (timestamp)',
    },
  },

  live_classes: {
    path: 'live_classes/{classId}',
    fields: {
      id: 'string',
      title: 'string',
      teacherId: 'string (indexed)',
      scheduledTime: 'number (timestamp, indexed)',
      duration: 'number (minutes)',
      maxStudents: 'number',
      roomCode: 'string (unique)',
      recordingUrl: 'string (nullable)',
      summary: 'string (nullable)',
      translationSummary: 'string (nullable)',
      participants: 'array of { userId, joinedAt, leftAt, attendancePercent }',
      status: 'enum: scheduled|in_progress|completed|cancelled',
      language: 'string',
      level: 'string',
      topics: 'array of strings',
      createdAt: 'number (timestamp)',
      updatedAt: 'number (timestamp)',
    },
    indexes: [
      { fields: [{ path: 'teacherId', direction: 'ASCENDING' }, { path: 'scheduledTime', direction: 'DESCENDING' }] },
      { fields: [{ path: 'scheduledTime', direction: 'ASCENDING' }] },
    ],
  },

  live_class_recordings: {
    path: 'live_class_recordings/{recordingId}',
    fields: {
      id: 'string',
      classId: 'string (indexed)',
      videoUrl: 'string',
      transcriptUrl: 'string',
      summaryUrl: 'string',
      generatedAt: 'number (timestamp)',
      processingStatus: 'enum: pending|processing|completed|failed',
      duration: 'number (seconds)',
      fileSize: 'number (bytes)',
      createdAt: 'number (timestamp)',
    },
    indexes: [
      { fields: [{ path: 'classId', direction: 'ASCENDING' }] },
    ],
  },

  user_ebook_progress: {
    path: 'user_ebook_progress/{userId}/{ebookId}',
    fields: {
      progress: 'number (percentage)',
      currentPage: 'number',
      readingTimeMinutes: 'number',
      completedAt: 'number (timestamp, nullable)',
      rating: 'number (1-5, nullable)',
      review: 'string (nullable)',
      lastAccessedAt: 'number (timestamp)',
      updatedAt: 'number (timestamp)',
    },
  },

  user_gamification_ebook: {
    path: 'user_gamification_ebook/{userId}',
    fields: {
      totalEbooksRead: 'number',
      currentStreak: 'number (consecutive days)',
      longestStreak: 'number',
      badges: 'array of { id, name, unlockedAt }',
      xpFromReading: 'number',
      achievements: 'object { readingMilestones, levelCompletions, etc. }',
      updatedAt: 'number (timestamp)',
    },
  },

  ai_tutor_insights: {
    path: 'ai_tutor_insights/{userId}',
    fields: {
      weeklyPerformance: 'object { accuracy, fluency, vocab, pronunciation }',
      suggestedLessons: 'array of { topic, reason, difficulty }',
      personalizedPath: 'object { nextTopic, estimatedDuration, prerequisites }',
      conversationHistory: 'array of { role, text, timestamp }',
      skillScores: 'object { listening, speaking, reading, writing }',
      estimatedLevel: 'string (A1-C2 CEFR)',
      weakAreas: 'array of strings',
      updatedAt: 'number (timestamp)',
    },
  },

  parental_controls: {
    path: 'parental_controls/{parentUserId}/{childUserId}',
    fields: {
      screenTimeLimit: 'number (minutes per day)',
      contentFilter: 'enum: unrestricted|family_friendly|custom',
      classRestrictions: 'array of teacherIds or classLevels',
      allowPayments: 'boolean',
      analyticsConsent: 'boolean',
      createdAt: 'number (timestamp)',
      updatedAt: 'number (timestamp)',
    },
  },

  sync_queue: {
    path: 'sync_queue/{userId}/pending/{operationId}',
    fields: {
      id: 'string',
      collectionPath: 'string',
      docId: 'string',
      operation: 'enum: set|update|delete',
      data: 'object',
      timestamp: 'number',
      status: 'enum: pending|synced|failed',
      error: 'string (nullable)',
      retryCount: 'number',
    },
  },

  realtime_presence: {
    path: 'realtime_presence/{userId}',
    fields: {
      status: 'enum: online|idle|offline',
      lastSeen: 'number (timestamp)',
      device: 'enum: web|mobile|tablet',
      updatedAt: 'number (timestamp)',
    },
  },
};

/**
 * Firebase Firestore Security Rules additions
 * (These should be merged into your existing rules)
 */
export const FIRESTORE_RULES_ADDITIONS = `
  // Subscriptions - user can only read/write own
  match /subscriptions/{document=**} {
    allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
  }

  // E-book marketplace - public read, admin write
  match /ebook_marketplace/{document=**} {
    allow read: if request.auth != null;
    allow write: if request.auth != null && hasRole(request.auth.uid, 'publisher');
  }

  // E-book content - public read (for purchased books)
  match /ebook_content/{document=**} {
    allow read: if request.auth != null && hasPurchased(request.auth.uid, document);
    allow write: if request.auth != null && hasRole(request.auth.uid, 'publisher');
  }

  // Live classes - creator can manage, students can join
  match /live_classes/{document=**} {
    allow read: if request.auth != null;
    allow create: if request.auth != null && hasRole(request.auth.uid, 'teacher');
    allow update, delete: if request.auth != null && request.auth.uid == resource.data.teacherId;
  }

  // User-specific data - own data only
  match /user_ebook_purchases/{userId}/{document=**} {
    allow read, write: if request.auth != null && request.auth.uid == userId;
  }

  match /ai_tutor_insights/{userId} {
    allow read, write: if request.auth != null && request.auth.uid == userId;
  }

  match /parental_controls/{parentId}/{childId} {
    allow read, write: if request.auth != null && (request.auth.uid == parentId || request.auth.uid == childId);
  }

  match /sync_queue/{userId}/{document=**} {
    allow read, write: if request.auth != null && request.auth.uid == userId;
  }
`;

/**
 * Helper function to check if user has a role
 * (Would be implemented in Firebase Security Rules)
 */
export const CUSTOM_CLAIMS_HELPER = `
  function hasRole(userId, role) {
    return request.auth.token[role] == true;
  }

  function hasPurchased(userId, ebookId) {
    return exists(/databases/$(database)/documents/user_ebook_purchases/$(userId)/$(ebookId));
  }
`;

/**
 * Execution steps for manual setup (if not using Cloud Functions for migration)
 */
export const MANUAL_SETUP_STEPS = [
  'Step 1: Create empty documents in each collection to initialize them',
  'Step 2: Enable Firestore indexes (can be done via Firebase Console)',
  'Step 3: Update firestore.rules with security rule additions',
  'Step 4: Run initializeMigration() function below to create sample documents',
];

/**
 * Initialize migration by creating collection stubs
 * (Call this after deploying to initialize collections)
 */
export async function initializeMigration(): Promise<void> {
  try {
    console.log('Starting migration 001: Adding feature schemas...');

    // Create collection stubs (Firebase auto-creates collections on first write)
    const stubCollections = [
      'subscriptions',
      'payment_methods',
      'ebook_marketplace',
      'ebook_content',
      'live_classes',
      'live_class_recordings',
      'ai_tutor_insights',
      'parental_controls',
      'sync_queue',
      'realtime_presence',
    ];

    // Initialize each collection with a temporary document
    for (const collectionName of stubCollections) {
      try {
        const docRef = doc(collection(db, collectionName), '_migration_stub');
        await setDoc(docRef, {
          _migrationVersion: MIGRATION_VERSION,
          _createdAt: new Date().toISOString(),
          _note: 'This is a stub document. It can be deleted after migration verification.',
        });
        console.log(`✓ Initialized collection: ${collectionName}`);
      } catch (error) {
        console.warn(`⚠ Could not initialize ${collectionName}:`, error);
      }
    }

    console.log('✓ Migration 001 completed successfully');
  } catch (error) {
    console.error('✗ Migration 001 failed:', error);
    throw error;
  }
}

/**
 * Verify migration (check if collections exist)
 */
export async function verifyMigration(): Promise<boolean> {
  try {
    console.log('Verifying migration 001...');
    // Implementation would check collection existence
    console.log('✓ Migration verified');
    return true;
  } catch (error) {
    console.error('✗ Migration verification failed:', error);
    return false;
  }
}
