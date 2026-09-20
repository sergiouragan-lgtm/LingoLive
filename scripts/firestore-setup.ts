import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin
const serviceAccountPath = process.env.FIREBASE_ADMIN_KEY_PATH || './firebase-key.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID,
});

const db = admin.firestore();

interface CollectionSchema {
  name: string;
  indexes?: Array<{
    fields: string[];
    descending?: string[];
  }>;
  securityRules?: string;
}

const collections: CollectionSchema[] = [
  // Phase 38: Workflow Automation
  {
    name: 'workflows',
    indexes: [
      { fields: ['enabled', 'createdAt'] },
      { fields: ['userId', 'createdAt'] },
    ],
  },
  {
    name: 'workflow_executions',
    indexes: [
      { fields: ['workflowId', 'status'] },
      { fields: ['userId', 'createdAt'] },
    ],
  },

  // Phase 39: Caching
  {
    name: 'cache_entries',
    indexes: [
      { fields: ['key', 'expiresAt'] },
      { fields: ['createdAt'] },
    ],
  },

  // Phase 40: Microservices
  {
    name: 'service_mesh_config',
    indexes: [{ fields: ['serviceName', 'enabled'] }],
  },

  // Phase 41: Compliance & Analytics
  {
    name: 'compliance_audit_trail',
    indexes: [
      { fields: ['userId', 'timestamp'] },
      { fields: ['actionType', 'timestamp'] },
    ],
  },
  {
    name: 'api_rate_limits',
    indexes: [
      { fields: ['userId', 'endpoint'] },
      { fields: ['timestamp'] },
    ],
  },
  {
    name: 'user_analytics_events',
    indexes: [
      { fields: ['userId', 'timestamp'] },
      { fields: ['eventType', 'timestamp'] },
    ],
  },
  {
    name: 'error_logs',
    indexes: [
      { fields: ['userId', 'timestamp'] },
      { fields: ['severity', 'timestamp'] },
    ],
  },

  // Phase 42: Feature Flags & A/B Testing
  {
    name: 'feature_flags',
    indexes: [
      { fields: ['enabled', 'rollout'] },
      { fields: ['createdAt'] },
    ],
  },
  {
    name: 'flag_variants',
    indexes: [{ fields: ['flagId', 'createdAt'] }],
  },
  {
    name: 'ab_tests',
    indexes: [
      { fields: ['enabled', 'createdAt'] },
      { fields: ['name'] },
    ],
  },
  {
    name: 'test_results',
    indexes: [
      { fields: ['testId', 'timestamp'] },
      { fields: ['confidence'] },
    ],
  },
  {
    name: 'user_profiles',
    indexes: [
      { fields: ['userId', 'createdAt'] },
      { fields: ['proficiencyLevel'] },
    ],
  },
  {
    name: 'recommendations',
    indexes: [
      { fields: ['userId', 'score'] },
      { fields: ['userId', 'createdAt'] },
      { fields: ['itemType', 'score'] },
    ],
  },

  // Phase 43: Notifications & Caching
  {
    name: 'notifications',
    indexes: [
      { fields: ['userId', 'read'] },
      { fields: ['userId', 'createdAt'] },
      { fields: ['type', 'timestamp'] },
    ],
  },
  {
    name: 'notification_preferences',
    indexes: [{ fields: ['userId'] }],
  },
  {
    name: 'queue_jobs',
    indexes: [
      { fields: ['status', 'createdAt'] },
      { fields: ['userId', 'status'] },
    ],
  },
  {
    name: 'batch_processes',
    indexes: [
      { fields: ['status', 'timestamp'] },
      { fields: ['createdBy', 'timestamp'] },
    ],
  },

  // Phase 44: Monitoring
  {
    name: 'monitors',
    indexes: [
      { fields: ['enabled', 'createdAt'] },
      { fields: ['metric'] },
    ],
  },
  {
    name: 'metrics_data',
    indexes: [
      { fields: ['metric', 'timestamp'] },
      { fields: ['timestamp'] },
    ],
  },
  {
    name: 'monitoring_dashboard',
    indexes: [{ fields: ['timestamp'] }],
  },
  {
    name: 'alerts',
    indexes: [
      { fields: ['severity', 'timestamp'] },
      { fields: ['resolved', 'timestamp'] },
    ],
  },

  // Phase 45: Reporting & Versioning
  {
    name: 'reports',
    indexes: [
      { fields: ['createdBy', 'createdAt'] },
      { fields: ['type', 'timestamp'] },
    ],
  },
  {
    name: 'service_versions',
    indexes: [
      { fields: ['serviceName', 'version'] },
      { fields: ['releasedAt'] },
    ],
  },

  // Backup & General
  {
    name: 'backup_records',
    indexes: [
      { fields: ['timestamp'] },
      { fields: ['status'] },
    ],
  },
];

async function setupCollections() {
  console.log('🔄 Setting up Firestore collections...\n');

  for (const collection of collections) {
    try {
      // Create collection with initial document
      const docRef = db.collection(collection.name).doc('_schema');
      await docRef.set(
        {
          created: admin.firestore.FieldValue.serverTimestamp(),
          description: `${collection.name} collection`,
        },
        { merge: true }
      );

      console.log(`✅ Collection created: ${collection.name}`);

      if (collection.indexes && collection.indexes.length > 0) {
        console.log(`   - Indexes configured: ${collection.indexes.length}`);
      }
    } catch (error) {
      console.error(`❌ Error creating collection ${collection.name}:`, error);
    }
  }

  console.log('\n✨ Firestore setup complete!');
}

async function setupSecurityRules() {
  console.log('\n🔐 Configuring security rules...\n');

  const rulesContent = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated access by default
    match /{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }

    // Feature flags - read by all, write by admin
    match /feature_flags/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.admin == true;
    }

    // User-specific data
    match /user_profiles/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    match /notifications/{userId}/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }

    match /recommendations/{document=**} {
      allow read: if resource.data.userId == request.auth.uid;
      allow write: if request.auth.token.admin == true;
    }

    match /user_analytics_events/{document=**} {
      allow write: if request.auth != null;
      allow read: if request.auth.token.admin == true;
    }

    // Admin-only
    match /monitors/{document=**} {
      allow read, write: if request.auth.token.admin == true;
    }

    match /alerts/{document=**} {
      allow read, write: if request.auth.token.admin == true;
    }

    match /compliance_audit_trail/{document=**} {
      allow read: if request.auth.token.admin == true;
    }
  }
}
  `;

  console.log('Security rules template ready for manual deployment');
  fs.writeFileSync('firestore.rules', rulesContent);
  console.log('✅ Security rules saved to firestore.rules');
}

async function main() {
  try {
    console.log('🚀 LingoLive Firestore Setup\n');
    await setupCollections();
    await setupSecurityRules();

    console.log('\n📋 Next steps:');
    console.log('1. Deploy security rules: firebase deploy --only firestore:rules');
    console.log('2. Create indexes in Firebase Console or use:');
    console.log('   firebase firestore:indexes');
    console.log('3. Verify collections in Firebase Console');

    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

main();
