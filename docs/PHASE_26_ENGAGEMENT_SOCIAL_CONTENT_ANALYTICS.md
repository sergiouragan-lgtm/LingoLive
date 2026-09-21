# Phase 26: Next-Generation Engagement, Social Learning, Content & Analytics

## Overview

Phase 26 introduces five integrated sub-phases creating a comprehensive engagement, social learning, personalized content, and analytics ecosystem:

1. **26.1 Gamification & Engagement Engine** — Achievement system with badges, leaderboards, streak tracking, and reward points
2. **26.2 Social Learning & Collaboration** — Study groups, peer challenges, forum discussions, collaborative learning
3. **26.3 Advanced Content Curation & Generation** — Dynamic content generation, personalized curriculum, A/B testing
4. **26.4 Analytics Dashboard & Insights** — Multi-role dashboards (student, teacher, parent, learner insights)
5. **26.5 Mobile Optimization & Offline Sync** — Offline content access, sync queue, conflict resolution, push notifications

---

## 26.1: Gamification & Engagement Engine

### Interfaces

```typescript
export interface Achievement {
  achievementId: string;
  userId: string;
  badgeType: 'milestone' | 'streak' | 'mastery' | 'social' | 'time_based';
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  pointsAwarded: number;
  unlockedAt: Date;
  progress?: number; // 0-100 for in-progress achievements
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  rank: number;
  totalPoints: number;
  weeklyPoints?: number;
  achievements: number;
  streakDays: number;
  lastActivityDate: Date;
}

export interface StreakData {
  userId: string;
  concept: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  streakStartDate: Date;
  pointsThisStreak: number;
}

export interface UserEngagementProfile {
  userId: string;
  totalPoints: number;
  achievementCount: number;
  currentLevel: number; // 1-100
  nextLevelThreshold: number;
  totalStreakDays: number;
  engagementScore: number; // 0-100
  badges: Achievement[];
  lastEngagementDate: Date;
}
```

### Core Methods

- `unlockAchievement(userId, badgeType, title, pointsAwarded)` — Awards badge and points
- `getLeaderboard(scope, userId?, limit)` — Returns ranked users (global/weekly/friends)
- `updateStreak(userId, concept)` — Tracks consecutive daily activity
- `awardPoints(userId, points, reason, metadata)` — Transactions and profile updates
- `getEngagementProfile(userId)` — Complete engagement data
- `checkMilestones(userId)` — Detects & awards milestone achievements

### Firestore Collections

| Collection | Purpose |
|---|---|
| `achievements` | Unlocked badges with metadata |
| `streaks` | Current streak data by concept |
| `reward_transactions` | Point award ledger |
| `user_engagement_profiles` | Aggregated engagement data |
| `milestones` | Milestone achievement tracking |

### Endpoints

```
POST   /api/gamification/achievement/unlock
GET    /api/gamification/leaderboard/:scope
POST   /api/gamification/streak/update
POST   /api/gamification/points/award
GET    /api/gamification/profile/:userId
POST   /api/gamification/milestones/check/:userId
```

---

## 26.2: Social Learning & Collaboration

### Interfaces

```typescript
export interface StudyGroup {
  groupId: string;
  name: string;
  description: string;
  createdBy: string;
  members: string[];
  memberCount: number;
  targetLanguage: string;
  proficiencyLevel: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  maxMembers: number;
}

export interface PeerChallenge {
  challengeId: string;
  initiatorId: string;
  opponentId: string;
  concept: string;
  difficulty: number;
  questionsCount: number;
  status: 'pending' | 'in_progress' | 'completed';
  initiatorScore?: number;
  opponentScore?: number;
  winner?: string;
  createdAt: Date;
  completedAt?: Date;
  timeLimit: number; // seconds
}

export interface ForumThread {
  threadId: string;
  authorId: string;
  title: string;
  content: string;
  concept: string;
  createdAt: Date;
  updatedAt: Date;
  replies: number;
  views: number;
  isPinned: boolean;
  tags: string[];
  status: 'open' | 'resolved' | 'closed';
}

export interface SocialMessage {
  messageId: string;
  senderId: string;
  recipientId?: string;
  groupId?: string;
  content: string;
  attachments?: string[];
  isRead: boolean;
  createdAt: Date;
  editedAt?: Date;
}

export interface SocialNotification {
  notificationId: string;
  userId: string;
  type: 'group_invite' | 'challenge_received' | 'reply_mention' | 'exercise_due' | 'message_received';
  sourceUserId: string;
  sourceId: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  actionUrl: string;
}
```

### Core Methods

- `createStudyGroup(userId, name, description, language, level, isPublic)` — Create peer learning group
- `joinStudyGroup(userId, groupId)` — Add member to group
- `initiateChallenge(initiatorId, opponentId, concept, difficulty)` — Peer-to-peer quiz competition
- `submitChallengeScore(challengeId, userId, score)` — Score submission & winner determination
- `createForumThread(userId, title, content, concept, tags)` — Discussion initiation
- `replyToThread(threadId, userId, content)` — Thread responses
- `sendMessage(senderId, content, recipientId?, groupId?)` — Direct/group messaging
- `getStudyGroups(userId)` — User's group membership
- `getUserNotifications(userId)` — Social event notifications

### Firestore Collections

| Collection | Purpose |
|---|---|
| `study_groups` | Group metadata & membership |
| `peer_challenges` | Challenge instances & scores |
| `forum_threads` | Discussion threads |
| `forum_replies` | Thread responses |
| `social_messages` | Direct & group messages |
| `social_notifications` | Activity notifications |

### Endpoints

```
POST   /api/social/group/create
POST   /api/social/group/join
POST   /api/social/challenge/initiate
POST   /api/social/challenge/submit-score
POST   /api/social/forum/thread/create
POST   /api/social/forum/reply
POST   /api/social/message/send
GET    /api/social/groups/:userId
GET    /api/social/notifications/:userId
```

---

## 26.3: Advanced Content Curation & Generation

### Interfaces

```typescript
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
```

### Core Methods

- `curateContentForUser(userId, concept, limit)` — Ranked content recommendations
- `generateExercise(userId, concept, difficulty, type)` — Dynamic exercise creation
- `generatePersonalizedCurriculum(userId, language, level, hoursPerWeek)` — Adaptive path
- `rateContent(userId, contentId, rating)` — User content feedback
- `createABTestVariant(contentId, description, content, isControl)` — A/B testing framework
- `getContentMetadata(contentId)` — Enriched content information
- `updateCurriculumProgress(pathId, moduleId, completed)` — Track module completion

### Firestore Collections

| Collection | Purpose |
|---|---|
| `curated_content` | Content items with scores |
| `generated_exercises` | AI-generated exercises |
| `curriculum_paths` | Personalized learning paths |
| `content_metadata` | Rich content metadata |
| `ab_test_variants` | A/B test variants & metrics |
| `user_content_ratings` | User content feedback |

### Endpoints

```
GET    /api/content/curated/:userId/:concept
POST   /api/content/exercise/generate
POST   /api/content/curriculum/generate
POST   /api/content/content/rate
POST   /api/content/ab-test/create-variant
GET    /api/content/metadata/:contentId
POST   /api/content/curriculum/update-progress
```

---

## 26.4: Analytics Dashboard & Insights

### Interfaces

```typescript
export interface StudentInsight {
  userId: string;
  overallProgress: number; // 0-100
  currentLevel: number; // 1-10
  averageAccuracy: number; // 0-100
  strengthConcepts: string[];
  weaknessAreas: string[];
  recommendedFocusAreas: string[];
  weeklyActivityHours: number;
  engagementTrend: 'increasing' | 'stable' | 'decreasing';
  lastAnalyzedAt: Date;
}

export interface TeacherDashboard {
  teacherId: string;
  totalStudents: number;
  classOverallProgress: number;
  avgStudentAccuracy: number;
  topPerformers: string[];
  strugglingStudents: string[];
  commonMisconceptions: string[];
  recommendedInterventions: string[];
  lastUpdatedAt: Date;
}

export interface ParentPortal {
  parentId: string;
  childId: string;
  childName: string;
  progressPercentage: number;
  currentUnit: string;
  weeklyActivity: { date: string; hoursSpent: number }[];
  strengths: string[];
  areasForImprovement: string[];
  recommendedSupport: string[];
  communicationHistory: Message[];
  lastReportDate: Date;
}

export interface LearnerInsight {
  userId: string;
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  optimalLearningTime: string; // hour of day
  preferredContentType: string;
  estimatedTimeToMastery: Record<string, number>; // concept -> hours
  personalizedTips: string[];
  goalAlignment: Record<string, number>; // goal -> % progress
  nextRecommendedActions: string[];
  generatedAt: Date;
}

export interface PerformanceAnalytics {
  analyticsId: string;
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
  totalSessionTime: number; // minutes
  sessionCount: number;
  avgSessionDuration: number; // minutes
  accuracyTrend: number[];
  conceptMasteryMap: Record<string, number>;
  strengthTrend: number[];
  challengeTrend: number[];
  timeSeriesData: { timestamp: Date; metric: number }[];
  generatedAt: Date;
}

export interface CustomReport {
  reportId: string;
  generatedBy: string;
  title: string;
  filters: Record<string, any>;
  metrics: string[];
  format: 'pdf' | 'csv' | 'json';
  data: Record<string, any>;
  createdAt: Date;
  expiresAt: Date;
}
```

### Core Methods

- `getStudentInsight(userId)` — Learner progress & recommendations
- `getTeacherDashboard(teacherId)` — Class-wide analytics & interventions
- `getParentPortal(parentId, childId)` — Child progress & support recommendations
- `getLearnerInsight(userId)` — Learning style & optimization tips
- `getPerformanceAnalytics(userId, period)` — Time-series performance data
- `generateCustomReport(generatedBy, title, filters, metrics)` — Flexible reporting
- `exportData(userId, format)` — CSV/JSON data export

### Firestore Collections

| Collection | Purpose |
|---|---|
| `student_insights` | Learner progress snapshots |
| `teacher_dashboards` | Class analytics |
| `parent_portals` | Parent-child progress |
| `learner_insights` | Learning style & optimization |
| `performance_analytics` | Time-series metrics |
| `custom_reports` | Generated reports |

### Endpoints

```
GET    /api/analytics/student-insight/:userId
GET    /api/analytics/teacher-dashboard/:teacherId
GET    /api/analytics/parent-portal/:parentId/:childId
GET    /api/analytics/learner-insight/:userId
GET    /api/analytics/performance/:userId/:period
POST   /api/analytics/custom-report/generate
GET    /api/analytics/export/:userId/:format
```

---

## 26.5: Mobile Optimization & Offline Sync

### Interfaces

```typescript
export interface OfflineContent {
  contentId: string;
  userId: string;
  type: 'lesson' | 'exercise' | 'quiz' | 'resource';
  title: string;
  content: string;
  downloadedAt: Date;
  expiresAt: Date;
  size: number; // bytes
  isAvailableOffline: boolean;
  lastAccessedAt: Date;
}

export interface SyncQueue {
  syncId: string;
  userId: string;
  operation: 'create' | 'update' | 'delete';
  entityType: string;
  entityId: string;
  payload: Record<string, any>;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  createdAt: Date;
  syncedAt?: Date;
  errorMessage?: string;
}

export interface MobileAPIEndpoint {
  endpointId: string;
  path: string;
  method: string;
  responseFormat: 'json' | 'binary';
  cacheStrategy: 'no-cache' | 'cache-first' | 'network-first';
  cacheDuration: number; // seconds
  priority: 'critical' | 'high' | 'medium' | 'low';
  isOptimized: boolean;
}

export interface LocalStorageConfig {
  userId: string;
  maxStorageSize: number; // bytes (default 500MB)
  usedStorage: number;
  contentInventory: OfflineContent[];
  syncQueue: SyncQueue[];
  lastCleanupAt: Date;
  cleanupInterval: number; // days
}

export interface PushNotificationPreference {
  userId: string;
  deviceId: string;
  isEnabled: boolean;
  notificationTypes: {
    lesson_reminder: boolean;
    achievement_unlocked: boolean;
    challenge_received: boolean;
    social_update: boolean;
    message_received: boolean;
  };
  quietHours: { start: string; end: string } | null;
  lastUpdatedAt: Date;
}

export interface SyncConflictResolution {
  conflictId: string;
  userId: string;
  entityId: string;
  serverVersion: Record<string, any>;
  clientVersion: Record<string, any>;
  resolutionStrategy: 'server-wins' | 'client-wins' | 'merge';
  resolvedVersion: Record<string, any>;
  resolvedAt: Date;
}
```

### Core Methods

- `downloadContentForOffline(userId, contentId, size)` — Cache content locally
- `queueSyncOperation(userId, operation, entityType, entityId, payload)` — Queue changes
- `processSyncQueue(userId)` — Upload queued changes
- `registerMobileEndpoint(path, method, cacheStrategy, duration)` — API optimization
- `setPushNotificationPreferences(userId, deviceId, preferences)` — Notification control
- `getLocalStorageConfig(userId)` — Storage inventory & quota
- `detectSyncConflict(userId, entityId, clientVersion, serverVersion)` — Conflict detection

### Firestore Collections

| Collection | Purpose |
|---|---|
| `offline_content` | Downloaded content metadata |
| `sync_queue` | Pending local changes |
| `mobile_api_endpoints` | Optimized endpoint registry |
| `local_storage_configs` | Per-user storage quotas |
| `push_preferences` | Notification settings |
| `sync_conflicts` | Conflict resolution log |

### Endpoints

```
POST   /api/mobile/content/download
POST   /api/mobile/sync-queue/add
POST   /api/mobile/sync-queue/process/:userId
POST   /api/mobile/endpoint/register
POST   /api/mobile/push-preferences/set
GET    /api/mobile/storage-config/:userId
POST   /api/mobile/conflict/detect
```

---

## Integration Points

### With Phase 25 (Personalization & Adaptive Learning)
- Achievement unlock when mastery thresholds met
- Recommendations integrated into curriculum
- Learning analytics feed into student insights
- Social challenges on adapted content

### With Phase 24 (Deep Learning & Federated Learning)
- ML models for content curation
- Predictive analytics in dashboards
- Federated learning on user engagement data

### With Phase 23 (Advanced ML & Real-time Intelligence)
- Anomaly detection for engagement drops
- Real-time dashboard updates
- Recommendation refinement

---

## Scheduling

| Task | Frequency | Purpose |
|---|---|---|
| Leaderboard cache clear | Every 1 minute | Fresh rankings |
| Curriculum progress sync | Every 1 hour | Real-time tracking |
| Dashboard generation | Every 6 hours | Analytics refresh |
| Sync queue processing | Every 5 minutes | Mobile sync |
| Storage cleanup | Daily | Cache management |

---

## Security & Privacy

- All dashboard endpoints secured with `requireAuth` middleware
- Parent portal access restricted to authorized guardians
- Student data isolated by role
- Sync conflicts logged for audit trail
- Export data requires explicit user permission
- Push notifications opt-in with granular controls

---

## Performance Targets

- **Leaderboard queries**: < 200ms (cached)
- **Insight generation**: < 500ms
- **Sync queue processing**: < 100ms per operation
- **Mobile endpoint response**: < 300ms (with caching)
- **Dashboard load**: < 1 second

---

## Monitoring & Metrics

- Achievement unlock rates by type
- Leaderboard engagement (active users)
- Social group creation & participation
- Content rating distribution
- Dashboard usage by role
- Sync success/failure rates
- Offline content usage patterns
- Storage utilization by user

---

## Total Endpoints: 35

**Gamification (6)** | **Social (9)** | **Content (7)** | **Analytics (7)** | **Mobile (7)**

All endpoints follow REST conventions, secured by `requireAuth`, and logged via `logSecurityEvent`.
