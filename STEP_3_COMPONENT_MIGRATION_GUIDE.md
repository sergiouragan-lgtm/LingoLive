# Step 3: Component Migration Guide

## Overview
Migrate existing components from legacy API patterns to new hooks and API client. This ensures all frontend components leverage phases 38-45 backend services.

## Migration Strategy

### Phase 1: Audit (Identify components to migrate)
1. Components using direct `fetch()` calls
2. Components with inline API logic
3. Components missing error handling
4. Dashboard and admin modules using analytics
5. Components needing feature flags or A/B testing

### Phase 2: Create Migration Templates
1. **API Client Pattern**: Replace fetch with apiClient
2. **Hook Pattern**: Use custom hooks for state management
3. **Error Handling**: Implement consistent error UI
4. **Loading States**: Add skeleton loaders and spinners
5. **Type Safety**: Ensure TypeScript interfaces

### Phase 3: Execute Migrations
Systematically replace patterns in high-impact components

---

## High-Impact Components for Migration

### Admin Dashboards (5-7 components)
These are critical for monitoring and should leverage monitoring/analytics hooks:

1. **`src/components/admin/gap/GlobalAdminDashboard.tsx`**
   - Current: Likely uses inline fetch for admin data
   - Migrate to: `useMonitoring()`, `useAnalytics()`, `useNotifications()`
   - Why: Admin needs real-time dashboard data with monitoring

2. **`src/components/admin/gmgi/GrowthDashboard.tsx`**
   - Current: May fetch growth metrics inline
   - Migrate to: `useRecommendations()`, `useAnalytics()`, `useMonitoring()`
   - Why: Growth tracking requires analytics and metrics

3. **`src/components/admin/gfmi/GFMI_Dashboard.tsx`**
   - Current: Likely fetches learning analytics
   - Migrate to: `useAnalytics()`, `useMonitoring()`
   - Why: Financial insights from learning data

4. **`src/components/admin/glp/LearningPassport.tsx`**
   - Current: Student progress tracking
   - Migrate to: `usePersonalization()`, `useRecommendations()`, `useAnalytics()`
   - Why: Personalized learning paths with recommendations

5. **`src/components/admin/alig/LearningRecommendations.tsx`**
   - Current: Manual recommendation display
   - Migrate to: `useRecommendations()`
   - Why: ML-powered recommendations engine

6. **`src/components/admin/FinancialManagementModule.tsx`**
   - Current: Financial reporting
   - Migrate to: `useAnalytics()`, `useRecommendations()` (for upsell)
   - Why: Analytics-driven financial insights

7. **`src/components/admin/SubscriptionMonitor.tsx`**
   - Current: Subscription status tracking
   - Migrate to: `useMonitoring()`, `useNotifications()`
   - Why: Real-time subscription health monitoring

### Learning & Tutorial Components (4-5 components)
These drive user engagement and should use personalization/recommendations:

8. **`src/components/ai-tutor/AIAssistant.tsx`**
   - Current: AI responses
   - Migrate to: `usePersonalization()`, `useAnalytics()`
   - Why: Personalized AI responses tracked for analytics

9. **`src/components/ai-tutor/conversacao/PracticeRoom.tsx`**
   - Current: Practice session management
   - Migrate to: `usePersonalization()`, `useRecommendations()`, `useAnalytics()`
   - Why: Recommended exercises, personalized difficulty

10. **`src/components/learning/quiz/LanguageQuiz.tsx`** (if exists)
    - Current: Quiz delivery
    - Migrate to: `usePersonalization()`, `useAnalytics()`, `useABTesting()`
    - Why: Adaptive difficulty, A/B test question formats

11. **`src/components/learning/ebook/EbookCurationPlatform.tsx`** (if exists)
    - Current: E-book browsing
    - Migrate to: `useRecommendations()`, `useAnalytics()`, `useFeatureFlags()`
    - Why: Recommended books, feature flags for UI variants

### Feature-Dependent Components (3-4 components)
Components that should support feature flags and experimentation:

12. **`src/components/core/Dashboard.tsx`**
    - Current: Main dashboard
    - Migrate to: `useFeatureFlags()`, `useABTesting()`, `useAnalytics()`
    - Why: Feature rollout for new dashboard features, A/B test layouts

13. **`src/components/core/Sidebar.tsx`**
    - Current: Navigation
    - Migrate to: `useFeatureFlags()`
    - Why: Conditionally show features based on flags

14. **`src/components/growth/PaymentsView.tsx`**
    - Current: Payment processing
    - Migrate to: `useNotifications()`, `useAnalytics()`, `useMonitoring()`
    - Why: Payment notifications, payment flow analytics

### Monitoring & Health (2-3 components)

15. **`src/components/admin/sicp/SecurityDashboard.tsx`**
    - Current: Security metrics
    - Migrate to: `useMonitoring()`, `useAnalytics()`
    - Why: Real-time security monitoring

16. **`src/components/admin/dipr/DevOpsDashboard.tsx`**
    - Current: DevOps metrics
    - Migrate to: `useMonitoring()`, `useAnalytics()`
    - Why: Infrastructure health and performance

---

## Migration Template Pattern

### Before (Legacy Pattern)
```tsx
import { useState, useEffect } from 'react';

export function MyComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/my-endpoint')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <div>{data?.name}</div>;
}
```

### After (New Hook Pattern)
```tsx
import { useMyFeature } from '@/hooks/useMyFeature';

export function MyComponent() {
  const { data, isLoading, error } = useMyFeature();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorAlert message={error} />;
  
  return <div>{data?.name}</div>;
}
```

### Hook Implementation Template
```tsx
// src/hooks/useMyFeature.ts
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

interface MyFeatureData {
  id: string;
  name: string;
  // ... other fields
}

export function useMyFeature() {
  const [data, setData] = useState<MyFeatureData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const response = await apiClient.get<MyFeatureData[]>('/my-endpoint');
    
    if (response.error) {
      setError(response.error);
    } else {
      setData(response.data?.[0] || null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, isLoading, error, refetch: loadData };
}
```

---

## Migration Checklist

- [ ] **Audit Phase**: Identify all components using direct API calls
- [ ] **Create Hooks**: Ensure all necessary hooks exist in `src/hooks/`
- [ ] **Implement Hooks**: Add implementations for hooks used by target components
- [ ] **Component 1-5**: Migrate admin dashboards (15 endpoint calls → 5 hooks)
- [ ] **Component 6-11**: Migrate learning components (20 endpoint calls → 4 hooks)
- [ ] **Component 12-14**: Migrate feature-dependent components (10 endpoint calls → 3 hooks)
- [ ] **Component 15-16**: Migrate monitoring components (8 endpoint calls → 2 hooks)
- [ ] **Testing**: Run component tests to verify migrations
- [ ] **E2E Testing**: Test critical user journeys
- [ ] **Performance**: Verify no performance regressions
- [ ] **Monitoring**: Check analytics for migration impact

---

## Priority Order

1. **Week 1**: Admin dashboards (GlobalAdminDashboard, GrowthDashboard)
2. **Week 2**: Learning components (AIAssistant, PracticeRoom)
3. **Week 3**: Feature flags and experimentation (Dashboard, PaymentsView)
4. **Week 4**: Monitoring and health (SecurityDashboard, DevOpsDashboard)

---

## Success Metrics

- ✅ 30-40 endpoint calls consolidated into 10 custom hooks
- ✅ All components use `apiClient` for HTTP requests
- ✅ Consistent error handling across all components
- ✅ >80% test coverage on migrated components
- ✅ No performance regression vs. baseline
- ✅ All analytics events properly tracked
