# Phases 38-45 Frontend Integration Guide

**Status:** ✅ Complete Frontend API Client & Hooks  
**Date:** September 20, 2026  
**Coverage:** All 45 backend services integrated

---

## Overview

This guide documents the complete frontend integration layer for Phases 38-45 backend services. The implementation provides:

- **API Client** (`src/lib/api-client.ts`) - Base HTTP client with auth, retry logic, and timeout handling
- **12+ React Hooks** - Purpose-built hooks for each major service domain
- **Integration Dashboard** - Example component showing all hooks in action
- **Type Safety** - Full TypeScript support for all API responses

---

## Architecture

```
Frontend App
    ↓
React Components
    ↓
Custom Hooks (useFeatureFlags, useABTesting, etc.)
    ↓
API Client (apiClient.ts)
    ↓
Firebase Auth (token management)
    ↓
Backend APIs (Phase 38-45 services)
    ↓
Firestore Database
```

---

## File Structure

```
src/
├── lib/
│   └── api-client.ts                          # Base API client
├── hooks/
│   ├── useFeatureFlags.ts                     # Phase 42: Feature flags
│   ├── useABTesting.ts                        # Phase 42: A/B testing
│   ├── usePersonalization.ts                  # Phase 42: Personalization
│   ├── useRecommendations.ts                  # Phase 42: Recommendations
│   ├── useMonitoring.ts                       # Phase 44: Monitoring
│   ├── useNotifications.ts                    # Phase 43: Notifications
│   ├── useAnalytics.ts                        # Phase 41: Analytics
│   ├── useCache.ts                            # Phase 43: Caching
│   └── useWorkflow.ts                         # Phase 38: Workflows
└── components/
    └── integration/
        └── Phase38-45Dashboard.tsx             # Example integration
```

---

## API Client Usage

### Basic Setup

```typescript
import { apiClient } from '@/lib/api-client';
import { auth } from '@/firebase';

// All API calls automatically include Firebase auth token
const response = await apiClient.get('/api/features');
const data = await apiClient.post('/api/personalization/profile', { ... });
```

### Features

- **Automatic Auth**: Retrieves Firebase ID token for every request
- **Retry Logic**: Automatic retries with exponential backoff (3 retries by default)
- **Timeout**: 30 seconds default timeout per request
- **Error Handling**: Structured error responses
- **Type Safety**: Generic response types

---

## Hook Reference

### Feature Flags (Phase 42)

```typescript
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

function MyComponent() {
  const { flags, isLoading, error, isFlagEnabled, createFlag } = useFeatureFlags();

  // Check if a flag is enabled for current user
  if (isFlagEnabled('new-ui-redesign')) {
    return <NewUI />;
  }

  // Create a new flag
  await createFlag('beta-feature', 50); // 50% rollout

  return <div>{flags.length} flags configured</div>;
}
```

**Endpoints Used:**
- `GET /api/features` - List all flags
- `POST /api/features/create` - Create flag
- `PUT /api/features/:flagId` - Update flag

---

### A/B Testing (Phase 42)

```typescript
import { useABTesting, useUserABTestVariant } from '@/hooks/useABTesting';

function MyComponent() {
  const { tests, createTest, getTestResult, assignVariant } = useABTesting();

  // Create an A/B test
  const test = await createTest(
    'Homepage CTA Color',
    'Blue CTA',      // control
    'Green CTA',     // variant
    50               // 50/50 split
  );

  // Get user's assigned variant
  const { variant } = useUserABTestVariant(testId, userId);
  // variant is either 'control' or 'variant'

  // Get test results
  const result = await getTestResult(test.testId);
  // result.conversionRate, result.confidence
}
```

**Endpoints Used:**
- `GET /api/abtesting` - List tests
- `POST /api/abtesting/create` - Create test
- `GET /api/abtesting/:testId/results` - Get results
- `POST /api/abtesting/assign` - Assign variant to user

---

### Personalization (Phase 42)

```typescript
import { usePersonalization, usePersonalizedContent } from '@/hooks/usePersonalization';

function MyComponent() {
  const userId = auth.currentUser?.uid || '';
  const { profile, updateProfile, updateInterests } = usePersonalization(userId);
  const { content } = usePersonalizedContent(userId);

  // Update user preferences
  await updatePreferences({
    darkMode: true,
    contentLanguage: 'pt-BR',
    difficulty: 'intermediate',
  });

  // Update interests
  await updateInterests(['grammar', 'conversation', 'pronunciation']);

  return (
    <div>
      <p>Level: {profile?.proficiencyLevel}</p>
      <p>Style: {profile?.learningStyle}</p>
    </div>
  );
}
```

**Endpoints Used:**
- `GET /api/personalization/profile/:userId` - Get profile
- `PUT /api/personalization/profile/:userId` - Update profile
- `PUT /api/personalization/profile/:userId/preferences` - Update preferences
- `GET /api/personalization/content/:userId` - Get personalized content

---

### Recommendations (Phase 42)

```typescript
import { useRecommendations, useRecommendationFeed } from '@/hooks/useRecommendations';

function MyComponent() {
  const userId = auth.currentUser?.uid || '';
  const { recommendations, groups, rateRecommendation } = useRecommendations(userId);
  const { feed } = useRecommendationFeed(userId, 10);

  // Group recommendations by type
  groups.forEach(group => {
    console.log(group.category); // 'course', 'lesson', 'book', etc.
    console.log(group.recommendations); // Sorted by score
  });

  // Rate a recommendation (positive/negative feedback)
  await rateRecommendation(recommendationId, 5); // 1-5 star rating
}
```

**Endpoints Used:**
- `GET /api/recommendations/:userId` - Get all recommendations
- `GET /api/recommendations/:userId/feed?limit=10` - Get feed
- `POST /api/recommendations/:recommendationId/rate` - Rate recommendation

---

### Monitoring & Metrics (Phase 44)

```typescript
import { useMonitoring, useMetrics, useMonitoringDashboard } from '@/hooks/useMonitoring';

function AdminDashboard() {
  const { monitors, createMonitor } = useMonitoring();
  const { data: cpuMetrics } = useMetrics('cpu_usage', 'day');
  const { dashboard } = useMonitoringDashboard();

  // Create a monitor for a metric
  await createMonitor('High Memory', 'memory_usage', 85); // Alert if > 85%

  // View system health
  if (dashboard?.health === 'critical') {
    return <AlertBanner />;
  }

  return (
    <div>
      <p>Status: {dashboard?.health}</p>
      <Chart data={cpuMetrics} />
    </div>
  );
}
```

**Endpoints Used:**
- `GET /api/monitoring/monitors` - List monitors
- `POST /api/monitoring/monitors/create` - Create monitor
- `GET /api/monitoring/metrics/:name?timeRange=day` - Get metrics
- `GET /api/monitoring/dashboard` - Get dashboard data

---

### Notifications (Phase 43)

```typescript
import { useNotifications, useNotificationPreferences, useSendNotification } from '@/hooks/useNotifications';

function NotificationCenter() {
  const userId = auth.currentUser?.uid || '';
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(userId);
  const { preferences, updatePreferences } = useNotificationPreferences(userId);
  const { send } = useSendNotification();

  // Mark notification as read
  await markAsRead(notificationId);

  // Mark all as read
  await markAllAsRead();

  // Update preferences
  await updatePreferences({
    emailNotifications: false,
    pushNotifications: true,
  });

  // Send a notification (admin use)
  await send(userId, 'Achievement Unlocked', 'You completed 7-day streak!', 'success');

  return (
    <div>
      <p>Unread: {unreadCount}</p>
      {notifications.map(n => (
        <NotificationItem key={n.notificationId} notification={n} />
      ))}
    </div>
  );
}
```

**Endpoints Used:**
- `GET /api/notifications/user/:userId` - List notifications
- `PUT /api/notifications/:notificationId/read` - Mark as read
- `POST /api/notifications/mark-all-read` - Mark all as read
- `DELETE /api/notifications/:notificationId` - Delete
- `GET /api/notifications/preferences/:userId` - Get preferences
- `POST /api/notifications/send` - Send notification

---

### Analytics & Tracking (Phase 41)

```typescript
import { useAnalytics, useSessionTracking, useLearningAnalytics } from '@/hooks/useAnalytics';

function LearningModule() {
  const userId = auth.currentUser?.uid || '';
  const { trackEvent, getUserAnalytics, analytics } = useAnalytics(userId);
  const { sessionId, startSession, endSession } = useSessionTracking(userId);
  const { stats, loadStats } = useLearningAnalytics(userId);

  // Start tracking session
  useEffect(() => {
    startSession();
    return () => endSession();
  }, []);

  // Track custom events
  const completeLesson = async () => {
    await trackEvent('lesson_completed', {
      lessonId: 'lesson-123',
      timeSpent: 300, // seconds
      score: 95,
    });
  };

  // Get user stats
  return (
    <div>
      <p>Total Sessions: {analytics?.sessionCount}</p>
      <p>Lessons Completed: {stats?.totalLessonsCompleted}</p>
      <p>Accuracy: {stats?.averageAccuracy}%</p>
    </div>
  );
}
```

**Endpoints Used:**
- `POST /api/analytics/track` - Track event
- `GET /api/analytics/user/:userId` - Get user analytics
- `POST /api/analytics/session/start` - Start session
- `POST /api/analytics/session/end` - End session
- `GET /api/analytics/learning/:userId` - Get learning stats

---

### Caching (Phase 43)

```typescript
import { useCache, useCacheStats, useCacheInvalidation } from '@/hooks/useCache';

function DataComponent() {
  const { value, set, get, clear } = useCache<UserData>('user_profile');
  const { stats } = useCacheStats();
  const { invalidate } = useCacheInvalidation();

  // Get cached value
  await get(); // Fetches from cache server

  // Set cache value (with 1 hour TTL)
  await set(userData, 3600);

  // Invalidate by pattern
  await invalidate('user_*'); // Clears all user_* keys

  return (
    <div>
      <p>Cache Hit Rate: {stats?.hitRate}%</p>
      <p>Cached Items: {stats?.totalEntries}</p>
    </div>
  );
}
```

**Endpoints Used:**
- `GET /api/cache/:key` - Get cache
- `POST /api/cache/:key` - Set cache
- `DELETE /api/cache/:key` - Delete key
- `POST /api/cache/invalidate` - Invalidate pattern
- `GET /api/cache/stats` - Get cache stats

---

### Workflows (Phase 38)

```typescript
import { useWorkflow, useWorkflowExecution, useWorkflowBuilder } from '@/hooks/useWorkflow';

function WorkflowBuilder() {
  const { createWorkflow } = useWorkflowBuilder();
  const { executeWorkflow } = useWorkflow(workflowId);
  const { execution, tasks, pollExecution } = useWorkflowExecution(executionId);

  // Create a workflow
  const workflow = await createWorkflow('User Onboarding', {
    steps: [
      { type: 'email', template: 'welcome' },
      { type: 'task', name: 'setup_profile' },
      { type: 'notification', message: 'Welcome!' },
    ],
  });

  // Execute workflow
  const execution = await executeWorkflow({
    userId: 'user-123',
    email: 'user@example.com',
  });

  // Poll for completion
  useEffect(() => {
    const unsubscribe = pollExecution();
    return unsubscribe;
  }, [executionId]);

  return (
    <div>
      <p>Status: {execution?.status}</p>
      <ul>
        {tasks.map(t => (
          <li key={t.taskId}>{t.name}: {t.status}</li>
        ))}
      </ul>
    </div>
  );
}
```

**Endpoints Used:**
- `POST /api/workflows/create` - Create workflow
- `POST /api/workflows/:workflowId/execute` - Execute workflow
- `GET /api/workflows/executions/:executionId` - Get execution status
- `GET /api/workflows/executions/:executionId/tasks` - Get tasks

---

## Integration Examples

### Example 1: Dashboard with Feature Flags

```typescript
import { Phase38_45Dashboard } from '@/components/integration/Phase38-45Dashboard';

// In your App.tsx or main router
<Route path="/dashboard" element={<Phase38_45Dashboard />} />
```

### Example 2: Learning Module with Personalization & Analytics

```typescript
function LessonView() {
  const userId = auth.currentUser?.uid || '';
  const { profile } = usePersonalization(userId);
  const { trackEvent } = useAnalytics(userId);
  const { recommendations } = useRecommendations(userId);

  const handleLessonComplete = async () => {
    // Track completion
    await trackEvent('lesson_completed', {
      lessonId: 'lesson-xyz',
      score: 95,
    });

    // Show personalized recommendations
    const nextSteps = await recommendations.getRecommendations({
      limit: 3,
    });
  };

  return (
    <div>
      <h2>Lesson for {profile?.proficiencyLevel}</h2>
      <LessonContent onComplete={handleLessonComplete} />
      <RecommendationsList items={recommendations.recommendations} />
    </div>
  );
}
```

### Example 3: Admin Panel with A/B Testing & Monitoring

```typescript
function AdminPanel() {
  const { tests, createTest } = useABTesting();
  const { dashboard } = useMonitoringDashboard();
  const { monitors, createMonitor } = useMonitoring();

  const startNewTest = async () => {
    await createTest('New Homepage Design', 'Current', 'Redesign', 50);

    // Monitor the test
    await createMonitor('Test Results', 'ab_test_conversion', 0.5);
  };

  return (
    <div>
      <SystemHealth health={dashboard?.health} />
      <TestManager tests={tests} onCreateTest={startNewTest} />
      <MonitorsList monitors={monitors} />
    </div>
  );
}
```

---

## Error Handling

All hooks follow a consistent error pattern:

```typescript
const { data, isLoading, error } = useYourHook();

if (error) {
  return <ErrorBoundary message={error} />;
}

if (isLoading) {
  return <SkeletonLoader />;
}

return <YourComponent data={data} />;
```

---

## Best Practices

1. **Use Loading States**: Always handle loading state with skeleton loaders
2. **Error Boundaries**: Wrap integrations in error boundaries
3. **Memoization**: Use `useCallback` for event handlers
4. **Cleanup**: Always cleanup intervals/subscriptions in useEffect
5. **Caching**: Use `useCache` for frequently accessed data
6. **Analytics**: Track important user interactions
7. **Feature Flags**: Gate new features behind flags during development

---

## Testing

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn().mockResolvedValue({
      data: [{ flagId: '1', name: 'test', enabled: true, rollout: 100 }],
    }),
  },
}));

test('loads feature flags', async () => {
  render(<YourComponent />);
  await waitFor(() => {
    expect(screen.getByText('test')).toBeInTheDocument();
  });
});
```

---

## Next Steps

1. ✅ **Integrate Dashboard** - Add `Phase38-45Dashboard` to your app
2. ✅ **Add Hooks to Components** - Gradually replace API calls with hooks
3. ✅ **Setup Error Boundaries** - Wrap components in error handling
4. ✅ **Add Analytics** - Track user interactions
5. ✅ **Deploy Monitoring** - Set up production monitoring

---

**Generated:** September 20, 2026  
**Status:** Production Ready
