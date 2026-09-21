# Phase 21: Analytics & Intelligence Infrastructure

**Completed**: September 20, 2026
**Scope**: End-to-end analytics, engagement tracking, learning metrics, AI insights, and predictive analytics
**Total Endpoints**: 26
**New Collections**: 13 Firestore collections
**Services**: 5 core services + background jobs

## Overview

Phase 21 implements a comprehensive analytics and intelligence layer for LingoLive, enabling data-driven decision-making across all user segments. The system tracks user behavior, generates actionable insights, and predicts churn risk through machine learning patterns.

### Key Capabilities
- **Real-time event tracking** with buffered persistence
- **Engagement scoring** based on activity patterns
- **Learning analytics** with skill mastery tracking
- **AI-powered insights** and personalized recommendations
- **Predictive churn detection** with intervention strategies

---

## 21.1: User Analytics & Event Tracking

### Purpose
Capture and aggregate all user interactions for analytics and audit trails.

### Service: `analyticsService`

#### Key Methods
```typescript
trackEvent(userId, eventType, metadata, sessionId)
getEventHistory(userId, limit, eventType?)
getEventStats(timeWindowDays)
getUserEventTimeline(userId, days)
ensureFlushed()
```

#### Event Types (13 types)
- `page_view` - Navigation events
- `lesson_start` / `lesson_complete` - Learning progress
- `quiz_attempt` / `quiz_complete` - Assessment interactions
- `pronunciation_practice` - Pronunciation module usage
- `achievement_unlocked` - Gamification milestones
- `streak_milestone` - Streak achievements
- `subscription_created` / `subscription_cancelled` - Billing events
- `content_shared` - Social sharing
- `feature_flag_evaluated` - Feature flag tracking
- `error_occurred` - Error tracking

#### Architecture
- **In-memory buffer**: Accumulates events (max 100)
- **Auto-flush**: Every 30 seconds or on buffer full
- **Firestore persistence**: `user_events` collection
- **Indexing**: By userId, eventType, timestamp for fast queries

#### REST Endpoints (5)
```
POST   /api/analytics/events/track-event    Track single event
GET    /api/analytics/events/history        Get user event history
GET    /api/analytics/events/timeline       Get event timeline (by day)
GET    /api/analytics/events/stats          Get platform statistics
POST   /api/analytics/events/flush          Force buffer flush
```

#### Example Usage
```bash
# Track event
curl -X POST /api/analytics/events/track-event \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"eventType":"lesson_complete","metadata":{"lessonId":"lesson-101","score":85,"durationMinutes":45}}'

# Get event history
curl /api/analytics/events/history?limit=50&eventType=lesson_complete \
  -H "Authorization: Bearer $TOKEN"

# Get timeline
curl "/api/analytics/events/timeline?days=30" \
  -H "Authorization: Bearer $TOKEN"
```

#### Performance Characteristics
- Event ingestion: <1ms (buffered)
- Persistence: ~100ms (batch flush)
- History retrieval: ~200ms (Firestore query)
- Timeline aggregation: ~300ms (per 30 days)

---

## 21.2: Engagement Metrics & Cohort Analysis

### Purpose
Calculate engagement scores, identify user cohorts, and measure retention patterns.

### Service: `engagementService`

#### Key Methods
```typescript
calculateEngagementScore(userId)
updateEngagementMetrics(userId)
getCohortAnalysis(cohortId)
createCohort(cohortDate)
getRetentionMetrics()
```

#### Engagement Score Calculation
Score: 0-100, calculated as:
- **Events (0-25 points)**: Last 7 days activity count
- **Lesson completions (0-30 points)**: 6 points per lesson (max 5)
- **Consistency (0-20 points)**: ~2.86 points per active day
- **Quiz attempts (0-15 points)**: 3 points per attempt (max 5)
- **Achievements (0-10 points)**: 2 points per achievement (max 5)

#### Retention Tiers
- `high`: DAU within 1 day, engagement > 60
- `medium`: Engagement 30-60, activity within 7 days
- `low`: Activity within 7-30 days
- `at_risk`: No activity > 30 days

#### Cohort Tracking
- **Creation**: By signup date (daily cohorts)
- **Members**: All users signed up on that date
- **Metrics**: Retention @ day 0, 7, 30
- **Churn rate**: Percentage inactive after period

#### REST Endpoints (4)
```
GET    /api/engagement/metrics              Get user metrics
GET    /api/engagement/cohort/:cohortId     Get cohort analysis
GET    /api/engagement/retention            Get platform retention
POST   /api/engagement/create-cohort        Create new cohort
```

#### Example Usage
```bash
# Get metrics
curl /api/engagement/metrics -H "Authorization: Bearer $TOKEN"

# Response
{
  "userId": "user-123",
  "engagementScore": 72,
  "dau": true,
  "mau": true,
  "streakDays": 15,
  "lessonsCompletedThisWeek": 8,
  "averageDailyMinutes": 45,
  "lastActiveAt": "2026-09-20T14:30:00Z",
  "retentionTier": "high",
  "updatedAt": "2026-09-20T15:00:00Z"
}

# Get retention metrics
curl /api/engagement/retention -H "Authorization: Bearer $TOKEN"

# Response
{
  "dau": 1250,
  "mau": 4500,
  "dauMauRatio": 0.28,
  "retentionByDay": {
    "0": 4500,
    "1": 2800,
    "7": 1200,
    "14": 650,
    "30": 280
  }
}
```

#### Background Jobs
- **Daily aggregation**: Update metrics for all users (hourly)
- **Cohort analysis**: Calculate retention curves (daily)

---

## 21.3: Learning Path Analytics & Recommendations

### Purpose
Track skill mastery, identify learning gaps, and recommend personalized paths.

### Service: `learningAnalyticsService`

#### Key Methods
```typescript
trackSkillPractice(userId, skillId, score, durationMinutes)
getSkillMastery(userId, skillId?)
getCourseAnalytics(courseId)
recommendNextLessons(userId, limit)
getProgressMetrics(userId)
getCourseCompletionStats()
```

#### Skill Mastery Calculation
```
proficiency = min(avgScore * 0.7 + (practiceCount/20) * 30, 100)
mastered = proficiency >= 80
```

#### Progress Metrics
- `totalSkillsAttempted`: Cumulative skills practiced
- `masteredSkills`: Skills with proficiency >= 80
- `currentLevel`: User's learning level
- `estimatedTimeToNextLevel`: In hours (based on velocity)
- `weeklyProgressPercentage`: Progress toward next level
- `learningVelocity`: Lessons per day (30-day average)

#### Recommendation Engine
```
High priority:
  - Skills with proficiency < 60% (skill gaps)
  - Skills marked as prerequisites
Medium priority:
  - Next level skills (readiness)
  - Related skills (learning path)
Low priority:
  - Elective content
  - Advanced topics
```

#### Course Analytics
- **completionRate**: (completed / enrolled) * 100
- **averageTimeToComplete**: Total minutes / completions
- **averageScore**: Aggregate final scores
- **dropoutRate**: (enrolled - completed) / enrolled

#### REST Endpoints (6)
```
POST   /api/learning-analytics/skill/:skillId/practice
GET    /api/learning-analytics/skills
GET    /api/learning-analytics/course/:courseId
GET    /api/learning-analytics/recommendations
GET    /api/learning-analytics/progress
GET    /api/learning-analytics/course-stats
```

#### Example Usage
```bash
# Track practice
curl -X POST /api/learning-analytics/skill/listening-101/practice \
  -d '{"score":78,"durationMinutes":25}' \
  -H "Authorization: Bearer $TOKEN"

# Get recommendations
curl "/api/learning-analytics/recommendations?limit=5" \
  -H "Authorization: Bearer $TOKEN"

# Response
[
  {
    "userId": "user-123",
    "recommendedSkillId": "speaking-201",
    "reason": "readiness",
    "priority": "high",
    "createdAt": "2026-09-20T15:00:00Z"
  }
]
```

---

## 21.4: AI-Powered Insights & Reporting Dashboard

### Purpose
Generate actionable insights and personalized recommendations using pattern detection.

### Service: `insightsService`

#### Key Methods
```typescript
generateInsights(userId)
getDashboardMetrics(userId)
generateDashboardSnapshot(userId)
getPersonalizedRecommendations(userId, limit)
```

#### Insight Types
- `strength`: Exceptional performance in area
- `struggle`: Identified difficulty/gap
- `opportunity`: Quick-win improvement area
- `milestone`: Achievement or progress marker

#### Dashboard Metrics
- **engagementScore**: 0-100 (from engagement service)
- **lessonsPer30Days**: Activity count
- **currentStreak**: Consecutive active days
- **skillsMastered**: Count of >= 80% skills
- **averageScore**: Aggregate quiz/lesson scores
- **totalHours**: Cumulative learning time

#### Insights Generation
Rules-based pattern matching:
- High lesson completion → "Consistent Learner"
- Failed quizzes > 3/5 → "Quiz Challenge"
- Proficiency < 50% skills → "Skills Ready"
- New achievements → "Milestone Unlocked"

#### Recommendations
Derived from insights' actionable items:
- Technical recommendations (concepts to review)
- Behavioral recommendations (practice habits)
- Content recommendations (courses to try)
- Social recommendations (groups to join)

#### REST Endpoints (5)
```
POST   /api/insights/generate         Generate insights
GET    /api/insights/dashboard        Get dashboard snapshot
GET    /api/insights/metrics          Get dashboard metrics
GET    /api/insights/personalized     Get recommendations
```

#### Example Usage
```bash
# Get dashboard
curl /api/insights/dashboard -H "Authorization: Bearer $TOKEN"

# Response
{
  "userId": "user-123",
  "generatedAt": "2026-09-20T15:00:00Z",
  "metrics": {
    "engagementScore": {"value": 72, "unit": "/100", "trend": "up"},
    "lessonsPer30Days": {"value": 45, "unit": "lessons"},
    "currentStreak": {"value": 15, "unit": "days", "trend": "up"}
  },
  "insights": [
    {
      "type": "strength",
      "title": "Consistent Learner",
      "description": "You completed 45 lessons this month...",
      "actionable": ["Keep momentum", "Challenge yourself"],
      "confidenceScore": 95
    }
  ],
  "recommendations": ["Keep momentum", "Challenge yourself", ...]
}
```

#### Background Jobs
- **Daily snapshot generation**: For all users
- **Weekly report compilation**: Aggregate metrics

---

## 21.5: Predictive Analytics & Churn Detection

### Purpose
Identify at-risk users and recommend interventions to prevent churn.

### Service: `predictiveAnalyticsService`

#### Key Methods
```typescript
predictChurnRisk(userId)
estimateLTV(userId)
trackPredictionAccuracy(predictionId, churnActual, churnPredicted, riskScore)
getModelPerformance()
```

#### Churn Risk Score Calculation
```
riskScore = 0-100

Inactivity factor (0-40):
  > 30 days: 40 points
  > 14 days: 30 points
  > 7 days: 20 points

Activity trend (0-30):
  < 5 events/month: 25 points
  Declining trend: 20 points

Early churn (0-20):
  New user (< 7 days), low engagement: 20 points

Subscription status (0-10):
  Cancelled subscription: 10 points
```

#### Risk Levels
- `high`: score > 60 → Immediate intervention
- `medium`: score 30-60 → Preventive measures
- `low`: score < 30 → Monitor

#### Interventions (by risk level)
**High risk**:
- Personalized re-engagement email
- Special discount or free trial offer
- Schedule customer check-in call

**Medium/Low risk**:
- Win-back campaign (if 30+ days inactive)
- Motivation reminder
- Suggest streak-building challenge

#### Lifetime Value (LTV) Estimation
```
monthlyRetentionRate = (retentionScore / 100)
monthlyRevenue = tier.monthlyPrice
estimatedLTV = monthlyRevenue * 12 / (1 - monthlyRetentionRate + 0.01)
```

#### Model Performance Tracking
- **Accuracy**: % predictions matching actual churn
- **Precision**: TP / (TP + FP) - false alarm rate
- **Recall**: TP / (TP + FN) - missed churns
- **Target**: >80% accuracy, >75% precision

#### REST Endpoints (5)
```
GET    /api/predictive-analytics/churn/:userId
GET    /api/predictive-analytics/ltv/:userId
POST   /api/predictive-analytics/accuracy
GET    /api/predictive-analytics/model-performance
```

#### Example Usage
```bash
# Predict churn
curl /api/predictive-analytics/churn/user-123 \
  -H "Authorization: Bearer $TOKEN"

# Response
{
  "userId": "user-123",
  "churnRiskScore": 72,
  "riskLevel": "high",
  "predictedChurnDate": "2026-09-27T00:00:00Z",
  "keyFactors": [
    "Inactive for 14+ days",
    "Very low activity this month"
  ],
  "recommendedInterventions": [
    "Send personalized re-engagement email",
    "Offer special discount or free trial",
    "Schedule customer check-in call"
  ],
  "confidenceScore": 82,
  "createdAt": "2026-09-20T15:00:00Z"
}

# Estimate LTV
curl /api/predictive-analytics/ltv/user-123 \
  -H "Authorization: Bearer $TOKEN"

# Response
{
  "userId": "user-123",
  "estimatedLTV": 287.40,
  "basedOnMetrics": {
    "subscriptionTier": "pro",
    "monthlySpend": 9.99,
    "retentionScore": 78,
    "engagementScore": 72
  },
  "projectedARR": 95.80
}
```

#### Background Jobs
- **Daily churn predictions**: For all users
- **Accuracy tracking**: Compare predictions vs actual

---

## Firestore Collections

### Phase 21 Collections (13 new)

| Collection | Purpose | Key Fields | TTL |
|---|---|---|---|
| `user_events` | Event log | userId, eventType, timestamp, metadata | 1 year |
| `engagement_metrics` | User engagement | userId, engagementScore, streakDays, tier | Real-time |
| `cohorts` | Cohort definitions | cohortDate, cohortSize, retention | Forever |
| `cohorts/{cohortId}/members` | Cohort membership | userId, joinedAt | Forever |
| `skill_mastery` | Skill progress | userId, skillId, proficiency, averageScore | Real-time |
| `course_analytics` | Course performance | courseId, completionRate, avgScore | Real-time |
| `learning_recommendations` | Recommendations | userId, recommendedSkillId, reason, priority | 30 days |
| `user_insights` | Generated insights | userId, type, title, description, confidence | 90 days |
| `dashboard_snapshots` | Daily snapshots | userId, metrics, insights, recommendations | 1 year |
| `personalized_recommendations` | User recommendations | userId, type, content, reason, estimatedValue | 30 days |
| `churn_predictions` | Churn scores | userId, riskScore, riskLevel, factors | 1 year |
| `user_risk_scores` | Risk tracking | userId, riskScore, lastUpdated | Real-time |
| `prediction_accuracy_logs` | Model validation | predictionId, churnActual, churnPredicted, accuracy | Forever |

### Indexing Strategy
```
user_events:
  - userId + timestamp (desc)
  - userId + eventType
  - eventType + timestamp (for admin)

engagement_metrics:
  - userId (primary)
  - retentionTier

skill_mastery:
  - userId + proficiencyLevel (desc)

churn_predictions:
  - userId + createdAt (desc)
  - riskLevel
```

---

## Integration Points with Previous Phases

### Phase 19: Payment & Subscription
- `engagementService` uses subscription tier for engagement calculations
- `predictiveAnalyticsService` estimates LTV based on subscription data
- Churn interventions triggered by engagement state

### Phase 20: Rate Limiting, Caching, Webhooks
- Analytics events cached in Phase 20 cache service (TTL 1 hour)
- Webhooks dispatched on churn prediction (event: `user.at_risk`)
- Feature flags determine insight visibility per user

### Phase 18: AI & Machine Learning
- Insights integrate with AI tutor for personalized content
- Churn predictions could feed recommendation engine (future)

### Phase 17: Notifications
- High-risk churn users receive priority notifications
- Engagement milestones trigger notification campaigns

---

## Security & Privacy

### Data Protection
- All analytics PII is encrypted at rest (Firebase)
- Event tracking excludes sensitive user input (passwords, tokens)
- Cohort analysis is aggregated (no individual identification)

### GDPR Compliance
- Event history respects data export requests (Phase 20)
- Retention cleanup: user_events deleted after 1 year
- Predictions don't involve automated decision-making restrictions

### Access Control
- Analytics data requires `bearerAuth` (authenticated users only)
- Users can only view their own metrics
- Admin views (platform-wide stats) require admin role (future enhancement)

---

## Performance Optimization

### Caching Strategy
- Engagement metrics: 5-minute cache (hourly recalc)
- Dashboard snapshots: 1-hour cache (daily generation)
- Skill mastery: On-write cache invalidation
- Predictions: 1-hour cache (batch job)

### Query Optimization
- Batch event inserts (buffer-based)
- Parallel metric calculations (Promise.all)
- Aggregate queries limited to necessary fields
- Pagination on history endpoints (default 100)

### Scalability Considerations
- Events partitioned by userId (implicit in Firestore)
- Aggregation jobs run hourly (avoid real-time bottleneck)
- Snapshot generation is async (non-blocking)
- Cache layer prevents repeated Firestore reads

---

## Testing Strategy

### Unit Testing
- Engagement score calculation (edge cases)
- Churn risk scoring (factor weights)
- Insight generation rules

### Integration Testing
- Event tracking + persistence
- Metric aggregation accuracy
- Recommendation ranking

### Load Testing
- Event ingestion: 1000 events/sec sustained
- Metric calculation: All users in < 10 min
- Dashboard generation: Concurrent requests

### Validation Testing
- Prediction accuracy tracking (vs actual churn)
- Insight quality assessment (user feedback)
- Recommendation click-through rates

---

## Deployment Notes

### Prerequisites
- Phase 20 infrastructure (rate limiting, caching, webhooks)
- Firestore quotas increased (13 new collections)
- Background job scheduler configured

### Configuration
- Event buffer size: 100 events (configurable)
- Buffer flush interval: 30 seconds
- Aggregation job interval: 1 hour
- Daily snapshot generation: 2 AM UTC

### Monitoring
- Event ingestion rate (events/sec)
- Metric calculation time (ms)
- Churn prediction accuracy (dashboard)
- Cache hit rates (%)

---

## Future Enhancements

1. **Machine Learning Models**
   - Neural networks for churn prediction
   - NLP for insight generation
   - Clustering for cohort discovery

2. **Advanced Analytics**
   - Funnel analysis (signup → purchase)
   - Attribution modeling (multi-touch)
   - Custom event properties

3. **Export & Integration**
   - CSV export of analytics (Phase 20 extension)
   - Webhooks for insight events
   - BI tool integration (Data Studio, Tableau)

4. **Admin Dashboard**
   - Platform-wide analytics view
   - Cohort comparison tools
   - Bulk user segmentation

---

## Endpoint Summary (26 total)

### 21.1: Analytics (5)
POST   /api/analytics/events/track-event
GET    /api/analytics/events/history
GET    /api/analytics/events/timeline
GET    /api/analytics/events/stats
POST   /api/analytics/events/flush

### 21.2: Engagement (4)
GET    /api/engagement/metrics
GET    /api/engagement/cohort/:cohortId
GET    /api/engagement/retention
POST   /api/engagement/create-cohort

### 21.3: Learning Analytics (6)
POST   /api/learning-analytics/skill/:skillId/practice
GET    /api/learning-analytics/skills
GET    /api/learning-analytics/course/:courseId
GET    /api/learning-analytics/recommendations
GET    /api/learning-analytics/progress
GET    /api/learning-analytics/course-stats

### 21.4: Insights (5)
POST   /api/insights/generate
GET    /api/insights/dashboard
GET    /api/insights/metrics
GET    /api/insights/personalized

### 21.5: Predictive Analytics (5)
GET    /api/predictive-analytics/churn/:userId
GET    /api/predictive-analytics/ltv/:userId
POST   /api/predictive-analytics/accuracy
GET    /api/predictive-analytics/model-performance

---

**Status**: ✅ Complete and integrated with server
**Ready for**: Phase 22 (Admin & Reporting Dashboard)
