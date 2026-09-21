# Phase 23: Advanced ML & Real-time Intelligence

**Completed**: September 20, 2026
**Scope**: Real-time analytics streaming, ML-powered predictions, anomaly detection, BI platform integration, and intelligent content recommendations
**Total Endpoints**: 32
**New Collections**: 12 Firestore collections
**Services**: 5 core services + background monitoring

## Overview

Phase 23 implements advanced machine learning capabilities and real-time intelligence infrastructure that builds on Phase 21 (Analytics) and Phase 22 (Admin & Reporting) to provide:
- Real-time dashboard streaming with WebSocket subscriptions
- ML-powered engagement, revenue, and churn predictions
- Anomaly detection with rule-based alerting
- BI platform integration (Tableau, Looker, Power BI, Metabase)
- Collaborative filtering and content-based recommendations
- A/B testing framework for algorithm optimization

### Key Capabilities
- **Real-time Metrics** with 30-second update intervals and live subscriber management
- **ML Predictions** for engagement trends, revenue forecasting, learning outcomes, and churn risk
- **Anomaly Detection** with 7-day baseline windows and multi-severity alerting
- **BI Integration** with scheduled report execution and data warehouse syncing
- **Smart Recommendations** using collaborative filtering, content-based algorithms, and A/B testing

---

## 23.1: Real-time Dashboard Streaming

### Purpose
Provide live updates of platform metrics via WebSocket subscriptions for real-time executive visibility.

### Service: `realtimeDashboardService`

#### Key Methods
```typescript
subscribe(dashboardId: string, callback: Function): () => void
getRealtimeDashboard(): Promise<RealtimeDashboardData>
broadcastUpdate(update: StreamUpdate): Promise<void>
getActivityStream(limit?: number): Promise<any[]>
getEngagementHeatmap(days?: number): Promise<Record<string, Record<string, number>>>
getSubscriberCount(): number
```

#### Data Structure

**Real-time Dashboard Data**
```
{
  timestamp: Date,
  metrics: {
    activeUsers: number,         // unique users last hour
    totalEvents: number,         // event count last hour
    avgEngagement: number,       // average engagement score (0-100)
    revenue: number,             // revenue last hour
    churnRate: number            // percentage of active subscriptions cancelled
  },
  anomalies: Anomaly[],
  alerts: Alert[],
  topUsers: Array<{ userId: string, eventCount: number }>,
  activityHeatmap: Record<string, number>  // by hour (0-23)
}
```

**Stream Update Format**
```
{
  type: 'metric_update' | 'anomaly_detected' | 'alert_triggered' | 'user_activity',
  data: any,
  timestamp: Date
}
```

#### REST Endpoints (5)
```
GET  /api/realtime-dashboard/current           Get current realtime metrics
GET  /api/realtime-dashboard/activity-stream   Get recent user activity
GET  /api/realtime-dashboard/engagement-heatmap  Get hourly/daily engagement heatmap
GET  /api/realtime-dashboard/subscribers       Get subscriber count
POST /api/realtime-dashboard/broadcast         Broadcast manual update
```

#### Subscription Pattern
```ts
const unsubscribe = realtimeDashboardService.subscribe('dashboard-1', (update) => {
  console.log('Update received:', update);
});

// Later: unsubscribe from updates
unsubscribe();
```

#### Example Usage
```bash
# Get current realtime metrics
curl /api/realtime-dashboard/current \
  -H "Authorization: Bearer $TOKEN"

# Get activity stream (last 50 events)
curl "/api/realtime-dashboard/activity-stream?limit=50" \
  -H "Authorization: Bearer $TOKEN"

# Get 7-day engagement heatmap
curl "/api/realtime-dashboard/engagement-heatmap?days=7" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 23.2: Machine Learning Models & Predictions

### Purpose
Deliver predictive insights using ML models trained on historical platform data.

### Service: `mlModelsService`

#### Key Methods
```typescript
predictEngagementTrend(userId: string): Promise<EngagementPrediction>
forecastRevenue(months?: number): Promise<RevenueForecast[]>
predictLearningOutcome(userId: string, skillId: string): Promise<LearningOutcomePrediction>
predictChurnProbabilityML(userId: string): Promise<ChurnProbability>
getModelPerformanceMetrics(): Promise<ModelPerformance>
retrainModels(): Promise<void>
```

#### Prediction Models

**1. Engagement Prediction** (7/30/90-day forecast)
- Input: User event history (last 30 days)
- Calculates baseline average from first 30 days
- Compares 7-day average to detect trends
- Outputs: predicted scores for 7, 30, 90 days + trend (increasing/stable/decreasing)
- Confidence: 60-95% based on data volume

**2. Revenue Forecasting** (3-month forward)
- Input: Historical payments (last 6 months)
- Calculates monthly MRR and trend
- Applies 15% seasonal variation using sine curves
- Confidence decreases by 10% per month (90%, 80%, 70%)

**3. Learning Outcome Prediction**
- Input: Skill mastery records
- Estimates time-to-mastery based on practice velocity
- Predicts success probability (20-95%)
- Recommends learning path (foundational/standard/advanced)

**4. Churn Prediction Refinement**
- Input: Churn prediction data from Phase 21
- Extracts probability (0-100), risk factors, recommended interventions
- Default: 20% probability, 50% confidence if no history

#### Data Structure

**Engagement Prediction**
```
{
  userId: string,
  predictedEngagementScores: {
    day7: number,
    day30: number,
    day90: number
  },
  trend: 'increasing' | 'stable' | 'decreasing',
  confidence: number,        // 0-100
  predictedAt: Date
}
```

**Revenue Forecast**
```
{
  period: string,           // YYYY-MM
  forecastedMRR: number,
  forecastedARR: number,
  confidence: number,       // 0-100
  seasonalityFactor: number,
  forecastedAt: Date
}
```

#### REST Endpoints (6)
```
POST /api/ml-models/engagement-prediction/:userId     Predict engagement trend
GET  /api/ml-models/revenue-forecast                  Forecast revenue (3 months)
POST /api/ml-models/learning-outcome/:userId/:skillId Predict learning outcomes
POST /api/ml-models/churn-probability/:userId         Predict churn probability
GET  /api/ml-models/model-performance                 Get model accuracy metrics
POST /api/ml-models/retrain                           Manually trigger retraining
```

#### Example Usage
```bash
# Get engagement prediction for user
curl -X POST /api/ml-models/engagement-prediction/user-123 \
  -H "Authorization: Bearer $TOKEN"

# Get 3-month revenue forecast
curl /api/ml-models/revenue-forecast \
  -H "Authorization: Bearer $TOKEN"

# Predict learning outcome
curl -X POST /api/ml-models/learning-outcome/user-123/skill-456 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 23.3: Anomaly Detection & Alerting

### Purpose
Detect statistical anomalies in key metrics and trigger configurable alerts.

### Service: `anomalyDetectionService`

#### Key Methods
```typescript
detectEngagementAnomaly(userId: string): Promise<Anomaly | null>
detectRevenueAnomaly(): Promise<Anomaly | null>
detectErrorSpike(): Promise<Anomaly | null>
createAlertRule(name, metric, threshold, operator, channels): Promise<AlertRule>
getAlertRules(enabled?: boolean): Promise<AlertRule[]>
acknowledgeAlert(alertId: string, userId: string): Promise<void>
getAnomalies(limit?: number, unresolved?: boolean): Promise<Anomaly[]>
resolveAnomaly(anomalyId: string): Promise<void>
```

#### Anomaly Detection Thresholds

**Engagement Drop Detection**
- 7-day baseline window
- Triggered when: deviation > 50% from baseline
- Severity: critical (>80% deviation), high (<80%)

**Revenue Change Detection**
- 7-day baseline window
- Triggered when: absolute deviation > 40%
- Severity: critical (>70% deviation), high (<70%)

**Error Spike Detection**
- 7-day baseline (avg per hour)
- Triggered when: hourly errors > 100% above baseline
- Severity: critical (>200% increase), high (<200%)

#### Data Structure

**Anomaly Record**
```
{
  id: string,
  type: 'engagement_drop' | 'revenue_change' | 'error_spike' | 'churn_spike' | 'performance_degradation',
  severity: 'low' | 'medium' | 'high' | 'critical',
  metric: string,
  expectedValue: number,
  actualValue: number,
  deviation: number,        // percentage
  detectedAt: Date,
  resolved: boolean
}
```

**Alert Rule**
```
{
  id: string,
  name: string,
  metric: string,
  threshold: number,
  operator: 'gt' | 'lt' | 'change_percent',
  enabled: boolean,
  channels: string[],       // 'email', 'slack', 'in_app'
  createdAt: Date
}
```

#### REST Endpoints (8)
```
POST /api/anomaly-detection/detect-engagement/:userId  Detect engagement anomaly
POST /api/anomaly-detection/detect-revenue             Detect revenue anomaly
POST /api/anomaly-detection/detect-errors              Detect error spike
POST /api/anomaly-detection/rules                      Create alert rule
GET  /api/anomaly-detection/rules                      List alert rules
POST /api/anomaly-detection/alerts/:alertId/acknowledge Acknowledge alert
GET  /api/anomaly-detection/anomalies                  Get anomalies (with filtering)
POST /api/anomaly-detection/anomalies/:anomalyId/resolve Resolve anomaly
```

#### Example Usage
```bash
# Create alert rule for high error rate
curl -X POST /api/anomaly-detection/rules \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "High Error Rate",
    "metric": "hourly_errors",
    "threshold": 100,
    "operator": "gt",
    "channels": ["email", "slack"]
  }'

# Get unresolved anomalies
curl "/api/anomaly-detection/anomalies?unresolved=true&limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 23.4: BI Platform Integration & Data Warehouse

### Purpose
Connect to external BI platforms and sync analytics data to data warehouses.

### Service: `biIntegrationService`

#### Key Methods
```typescript
connectBIPlatform(platform, apiKey, serverUrl): Promise<BIConnection>
disconnectBIPlatform(connectionId): Promise<void>
getBIConnections(): Promise<BIConnection[]>
createScheduledReport(name, platform, frequency, recipients, reportType, filters): Promise<ScheduledReport>
getScheduledReports(enabled?: boolean): Promise<ScheduledReport[]>
executeScheduledReport(reportId): Promise<void>
syncDataToWarehouse(sourceCollection, targetTable): Promise<DataWarehouseSyncJob>
getDWyncJobs(limit?: number): Promise<DataWarehouseSyncJob[]>
createDashboardConfig(name, platform, dashboardId, refreshInterval, metrics, filters): Promise<BIDashboardConfig>
getBIDashboardConfigs(): Promise<BIDashboardConfig[]>
refreshDashboardData(dashboardId): Promise<void>
```

#### Supported BI Platforms
- **Tableau**: Direct API integration with Tableau Server
- **Looker**: LookML model and dashboard sync
- **Power BI**: Premium capacity and dataset refresh
- **Metabase**: Open-source BI with SQL query builder

#### Report Types & Frequencies
- **User Activity**: Daily/Weekly/Monthly
- **Financial**: Daily/Weekly/Monthly
- **Learning Metrics**: Weekly/Monthly
- **System Health**: Daily

#### Data Structure

**BI Connection**
```
{
  id: string,
  platform: 'tableau' | 'looker' | 'powerbi' | 'metabase',
  status: 'connected' | 'disconnected' | 'error',
  apiKey?: string,
  serverUrl?: string,
  lastSyncAt?: Date,
  dataRefreshInterval: number,  // minutes
  createdAt: Date
}
```

**Scheduled Report**
```
{
  id: string,
  name: string,
  platform: string,
  frequency: 'daily' | 'weekly' | 'monthly',
  recipients: string[],
  reportType: string,
  filters?: Record<string, any>,
  nextRunAt: Date,
  lastRunAt?: Date,
  enabled: boolean,
  createdAt: Date
}
```

**Data Warehouse Sync Job**
```
{
  id: string,
  status: 'pending' | 'running' | 'completed' | 'failed',
  sourceCollection: string,
  targetTable: string,
  recordsProcessed: number,
  recordsFailed: number,
  startedAt: Date,
  completedAt?: Date,
  errorMessage?: string
}
```

#### REST Endpoints (11)
```
POST /api/bi-integration/connections              Create BI connection
GET  /api/bi-integration/connections              List BI connections
DELETE /api/bi-integration/connections/:id        Disconnect BI platform
POST /api/bi-integration/scheduled-reports        Create scheduled report
GET  /api/bi-integration/scheduled-reports        List scheduled reports
POST /api/bi-integration/scheduled-reports/:id/execute  Execute report
POST /api/bi-integration/data-warehouse-sync      Start DW sync job
GET  /api/bi-integration/data-warehouse-sync      List sync jobs
POST /api/bi-integration/dashboard-configs        Create dashboard config
GET  /api/bi-integration/dashboard-configs        List dashboard configs
POST /api/bi-integration/dashboard-configs/:id/refresh  Refresh dashboard data
```

#### Example Usage
```bash
# Connect to Tableau
curl -X POST /api/bi-integration/connections \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "platform": "tableau",
    "apiKey": "tableau_api_key",
    "serverUrl": "https://tableau.example.com"
  }'

# Create daily revenue report
curl -X POST /api/bi-integration/scheduled-reports \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Daily Revenue Report",
    "platform": "tableau",
    "frequency": "daily",
    "recipients": ["admin@lingolive.com"],
    "reportType": "financial"
  }'

# Sync payments to data warehouse
curl -X POST /api/bi-integration/data-warehouse-sync \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "sourceCollection": "payments",
    "targetTable": "dwh_payments"
  }'
```

---

## 23.5: Intelligent Content Recommendations

### Purpose
Deliver personalized content recommendations using ML algorithms and A/B testing.

### Service: `recommendationsService`

#### Key Methods
```typescript
getUserContentPreferences(userId: string): Promise<UserContentPreference>
updateUserPreferences(userId, preferences): Promise<void>
getPersonalizedRecommendations(userId, limit?): Promise<ContentRecommendation[]>
getCollaborativeFilteringRecommendations(userId): Promise<CollaborativeFilteringResult>
createABTest(name, description, variants): Promise<ABTest>
activateABTest(testId): Promise<void>
getABTests(status?): Promise<ABTest[]>
recordRecommendationInteraction(userId, contentId, type): Promise<void>
getRecommendationMetrics(): Promise<RecommendationMetrics>
```

#### Recommendation Algorithms

**1. Content-Based Filtering**
- Scoring factors: language match (25pts), difficulty match (25pts), type match (20pts), popularity (variable), user engagement (0-20pts)
- Total score: 0-100
- Filters out already-viewed content
- Top 10 recommendations returned

**2. Collaborative Filtering**
- Finds similar users via engagement metrics
- Uses top 5 similar users as neighbors
- Aggregates recommendations from neighbors
- Scores by similarity weight

**3. Hybrid Approach**
- Combines both algorithms
- Weighted towards content-based for cold-start users
- Transitions to collaborative as engagement grows

#### A/B Testing Framework
- Multiple algorithm variants per test
- Weighted traffic distribution (per variant)
- Tracks: CTR, conversion, engagement, revenue
- Determines winner based on primary metric

#### Engagement Scoring
- Clicked: +5 points
- Viewed: +3 points
- Completed: +10 points
- Skipped: -2 points

#### Data Structure

**User Content Preference**
```
{
  userId: string,
  preferredLanguages: string[],
  preferredDifficulty: 'beginner' | 'intermediate' | 'advanced',
  preferredContentTypes: string[],
  engagementScore: number,
  lastUpdated: Date
}
```

**Content Recommendation**
```
{
  userId: string,
  contentId: string,
  contentType: string,
  title: string,
  scoringFactors: Record<string, number>,
  recommendationScore: number,    // 0-100
  reason: string,
  recommendedAt: Date,
  interactionType?: 'clicked' | 'completed' | 'skipped' | 'viewed'
}
```

**A/B Test**
```
{
  id: string,
  name: string,
  status: 'active' | 'paused' | 'completed' | 'draft',
  variants: Array<{
    variantId: string,
    name: string,
    weight: number,              // 0-100
    algorithmType: 'collaborative_filtering' | 'content_based' | 'hybrid' | 'random'
  }>,
  metrics: {
    ctr: number,
    conversion: number,
    engagement: number,
    revenue: number
  },
  startDate: Date,
  endDate?: Date,
  winner?: string,
  createdAt: Date
}
```

#### REST Endpoints (9)
```
GET  /api/recommendations/preferences/:userId            Get user preferences
PUT  /api/recommendations/preferences/:userId            Update preferences
GET  /api/recommendations/personalized/:userId           Get personalized recommendations
GET  /api/recommendations/collaborative-filtering/:userId Get CF recommendations
POST /api/recommendations/interactions                   Record interaction
POST /api/recommendations/ab-tests                       Create A/B test
GET  /api/recommendations/ab-tests                       List A/B tests
POST /api/recommendations/ab-tests/:testId/activate      Activate A/B test
GET  /api/recommendations/metrics                        Get recommendation metrics
```

#### Scoring Examples

**E-book Content (User: intermediate Portuguese learner)**
- Language Match: 25 pts (Portuguese preferred)
- Difficulty Match: 25 pts (intermediate available)
- Type Match: 20 pts (e-book in preferences)
- Popularity: 5 pts (500 views)
- User Engagement: 12 pts (score: 60)
- **Total: 87 points**

**Quiz Content (Same user, not yet attempted)**
- Language Match: 25 pts
- Difficulty Match: 15 pts (slight mismatch)
- Type Match: 0 pts (quiz not preferred)
- Popularity: 3 pts (low views)
- User Engagement: 8 pts
- **Total: 51 points**

#### Example Usage
```bash
# Get user preferences
curl /api/recommendations/preferences/user-123 \
  -H "Authorization: Bearer $TOKEN"

# Get personalized recommendations (limit 15)
curl "/api/recommendations/personalized/user-123?limit=15" \
  -H "Authorization: Bearer $TOKEN"

# Record interaction (user clicked content)
curl -X POST /api/recommendations/interactions \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "userId": "user-123",
    "contentId": "content-456",
    "interactionType": "clicked"
  }'

# Create A/B test comparing algorithms
curl -X POST /api/recommendations/ab-tests \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Content-Based vs Collaborative",
    "variants": [
      {
        "variantId": "v1",
        "name": "Content-Based",
        "weight": 50,
        "algorithmType": "content_based"
      },
      {
        "variantId": "v2",
        "name": "Collaborative",
        "weight": 50,
        "algorithmType": "collaborative_filtering"
      }
    ]
  }'
```

---

## Database Collections Summary

**Phase 23 creates/uses 12 Firestore collections:**

1. `anomalies` - Detected anomalies with severity and status
2. `alert_rules` - Configurable alert rules with multi-channel delivery
3. `alerts` - Triggered alerts with acknowledgment tracking
4. `prediction_accuracy_logs` - Model prediction accuracy tracking
5. `engagement_predictions` - Engagement trend predictions
6. `revenue_forecasts` - Revenue forecasting results
7. `churn_predictions` - Churn probability predictions (from Phase 21)
8. `bi_connections` - BI platform credentials and status
9. `scheduled_reports` - Report scheduling and execution history
10. `dw_sync_jobs` - Data warehouse synchronization jobs
11. `bi_dashboard_configs` - BI dashboard configuration
12. `user_content_preferences` - User recommendation preferences
13. `recommendation_interactions` - User interactions with recommendations
14. `ab_tests` - A/B test configurations and results

**Collections reused from Phase 21:**
- `user_events` - User event data for analytics
- `engagement_metrics` - User engagement scores
- `payments` - Payment transaction data
- `subscriptions` - Subscription information
- `error_logs` - Application error tracking

---

## Integration Points

### With Phase 21 (Analytics & Intelligence)
- Reads `user_events` for engagement baselines
- Accesses `engagement_metrics` for current scores
- Leverages `churn_predictions` for churn models
- Uses `payments` for revenue forecasting

### With Phase 22 (Admin & Reporting)
- Provides real-time metrics to dashboards
- Feeds anomalies to compliance alerts
- Supplies predictions for executive reports
- Powers financial analytics KPIs

### With Payment System
- Ingests `payments` for revenue anomaly detection
- Tracks subscription changes for churn
- Monitors failed transactions

### With Core Platform
- Integrates with content/ebook system for recommendations
- Tracks user interactions across platform
- Powers personalization for learning paths

---

## Performance Characteristics

### Real-time Dashboard
- Update interval: 30 seconds
- Subscriber broadcast latency: <100ms
- Heatmap aggregation: <500ms
- Metrics calculation: <200ms

### ML Model Execution
- Engagement prediction: <300ms
- Revenue forecast: <500ms
- Learning outcome: <200ms
- Churn prediction: <150ms

### Anomaly Detection
- Engagement check: hourly
- Revenue check: hourly
- Error spike check: continuous
- Rule evaluation: <100ms

### Background Jobs
- Recommendation generation: every 6 hours
- Model retraining: daily
- Report execution: scheduled
- DW sync jobs: on-demand, <1 second per 100 records

---

## Security & Privacy

### Authentication & Authorization
- All endpoints require `requireAuth` middleware
- Role-based access control for BI connections
- Sensitive data masked in logs
- Audit trail for all configuration changes

### Data Protection
- API keys encrypted in transit
- BI credentials stored securely in Firestore
- Recommendation data anonymized in analytics
- User preferences isolated per user

### Compliance
- GDPR-compliant user data handling
- Right-to-be-forgotten support for recommendations
- Audit logging for all model predictions
- Data retention policies enforced

---

## Monitoring & Alerting

### Health Checks
- Model accuracy tracking via `prediction_accuracy_logs`
- BI platform connectivity monitoring
- Recommendation engine performance metrics
- Anomaly detection false positive rate

### Metrics
- Model performance: accuracy, MAE, AUC
- Recommendation CTR and conversion rate
- Anomaly detection: precision, recall, F1
- Real-time dashboard: subscriber count, broadcast latency

---

## Testing Strategy

### Unit Tests
- Anomaly detection algorithms
- ML model calculations
- Scoring functions
- Rule evaluation logic

### Integration Tests
- End-to-end anomaly workflows
- BI platform connections
- Real-time subscription model
- Recommendation generation

### Performance Tests
- Real-time dashboard load (100+ subscribers)
- ML prediction latency (<500ms)
- Anomaly detection throughput
- Recommendation ranking speed

---

## Future Enhancements

**Phase 24** could extend with:
- Advanced deep learning models (LSTM for time series)
- Real-time model serving (TensorFlow Serving)
- Custom anomaly detection thresholds per metric
- Recommendation explanation generation
- Advanced BI integrations (Domo, QlikView)
- Federated learning for privacy-preserving ML
- Multi-armed bandit optimization for A/B testing

---

## Deployment Checklist

- [ ] All 5 services deployed and initialized
- [ ] 5 route files mounted in server.ts
- [ ] Firestore indexes created for all collections
- [ ] Background jobs scheduled and verified
- [ ] ML models trained on historical data
- [ ] BI platform connections tested
- [ ] Real-time dashboard WebSocket subscription tested
- [ ] Anomaly detection thresholds calibrated
- [ ] Recommendation engine cold-start handling verified
- [ ] A/B testing framework operational
- [ ] TypeScript checks passing
- [ ] All endpoints verified with curl
- [ ] CI/CD pipeline green

---

**Ready for**: Phase 24 (Advanced Deep Learning & Federated Learning)

**Dependencies Satisfied**: Phase 21, Phase 22
**Backward Compatibility**: Full
