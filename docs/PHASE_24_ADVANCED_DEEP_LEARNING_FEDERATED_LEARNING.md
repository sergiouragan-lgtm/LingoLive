# Phase 24: Advanced Deep Learning & Federated Learning

**Status**: ✅ Complete  
**Date**: 2026-09-20  
**Coverage**: End-to-end implementation of 5 sub-phases (24.1–24.5)

---

## Overview

Phase 24 implements advanced machine learning capabilities for LingoLive, focusing on:

1. **24.1 Advanced Deep Learning** — LSTM networks for time series prediction
2. **24.2 Real-time Model Serving** — Inference optimization with caching
3. **24.3 Anomaly Interpretability** — SHAP-based explanation generation
4. **24.4 Advanced BI Integrations** — Multi-platform BI ecosystem
5. **24.5 Federated Learning** — Privacy-preserving distributed training

---

## 24.1 Advanced Deep Learning (`deep-learning.service.ts`)

### Purpose
Provides LSTM-based time series prediction and neural network training for learning analytics.

### Key Interfaces

```typescript
export interface LSTMPrediction {
  userId: string;
  metric: string;
  predictions: number[];
  timestamps: Date[];
  confidence: number;
  trend: 'upward' | 'downward' | 'stable';
  predictedAt: Date;
}

export interface NeuralNetworkModel {
  id: string;
  name: string;
  type: 'engagement' | 'churn' | 'revenue' | 'learning';
  architecture: {
    layers: number;
    neurons: number[];
    activation: string[];
  };
  trainedAt: Date;
  accuracy: number;
  lossValue: number;
  status: 'training' | 'ready' | 'deprecated';
}

export interface TimeSeriesForecast {
  metric: string;
  period: number; // days ahead
  values: number[];
  lowerBound: number[];
  upperBound: number[];
  confidence: number;
  modelUsed: string;
  forecastedAt: Date;
}

export interface DeepLearningMetrics {
  modelId: string;
  precisionScore: number;
  recallScore: number;
  f1Score: number;
  rocAuc: number;
  meanSquaredError: number;
  rootMeanSquaredError: number;
  evaluatedAt: Date;
}
```

### Core Methods

#### `predictWithLSTM(userId, metric, daysAhead)`
Generates time series predictions using LSTM networks:

```typescript
const prediction = await deepLearningService.predictWithLSTM(
  userId,
  'engagement_score',
  7
);
```

- **Algorithm**: LSTM with normalization/denormalization
- **Fallback**: Returns stable trend prediction if insufficient data (< 10 records)
- **Returns**: Predicted values with confidence score (40–95%)

#### `trainNeuralNetworkModel(modelType, trainingData)`
Trains task-specific neural networks:

- **Engagement Model**: 3 layers [128, 64, 32] with ReLU activation
- **Churn Model**: 4 layers [256, 128, 64, 1] with ReLU + sigmoid
- **Revenue Model**: 3 layers [100, 50, 1] with ReLU + linear
- **Learning Model**: 3 layers [80, 40, 1] with ReLU + sigmoid

#### `forecastTimeSeriesAdvanced(metric, daysAhead)`
ARIMA-LSTM hybrid approach with 95% confidence intervals:

```typescript
const forecast = await deepLearningService.forecastTimeSeriesAdvanced(
  'revenue_usd',
  30
);
```

- **Input**: ≥20 historical records required
- **Output**: Forecast with lower/upper bounds for uncertainty quantification
- **Confidence**: Fixed at 85% for stability

#### `evaluateModelPerformance(modelId)`
Computes standard ML evaluation metrics:

```typescript
const metrics = await deepLearningService.evaluateModelPerformance(modelId);
// { precisionScore: 0.92, recallScore: 0.88, f1Score: 0.90, rocAuc: 0.94, ... }
```

### Firestore Collections

| Collection | Documents | TTL |
|---|---|---|
| `lstm_predictions` | Per user×metric | 90 days |
| `neural_network_models` | Global | Indefinite |
| `timeseries_forecasts` | Per metric×timestamp | 30 days |
| `model_performance_metrics` | Per model | Indefinite |

### Scheduling

**Daily Model Retraining** (Every 24 hours):
- Fetches all 4 model types from `training_data` collection
- Retrains models if ≥1000 samples available
- Logs training status and loss metrics

---

## 24.2 Real-time Model Serving (`model-serving.service.ts`)

### Purpose
Manages model server lifecycle and optimizes inference latency with caching.

### Key Interfaces

```typescript
export interface ModelServer {
  id: string;
  name: string;
  modelId: string;
  version: string;
  endpoint: string;
  status: 'running' | 'stopped' | 'error';
  latency: number;
  throughput: number;
  uptime: number;
  createdAt: Date;
  lastHealthCheck?: Date;
}

export interface ModelInferenceResponse {
  requestId: string;
  modelId: string;
  predictions: number[] | Record<string, number>;
  confidence: number;
  latency: number;
  inferenceVersion: string;
  respondedAt: Date;
}

export interface ModelServingMetrics {
  modelId: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  errorRate: number;
  cacheHitRate: number;
  metricsAt: Date;
}
```

### Core Methods

#### `performInference(modelId, inputData, batchSize, priority)`
Single inference request with caching:

```typescript
const response = await modelServingService.performInference(
  'churn-model-v1',
  { user_id: 'u123', days_active: 45 },
  1,
  'high' // priority: 'low' | 'normal' | 'high'
);
```

- **Cache TTL**: 1 hour
- **Cache Hit**: Returns cached result with existing latency
- **Cache Miss**: Runs inference, caches result, logs metrics
- **Latency**: Tracked at request level

#### `batchInference(modelId, requests)`
Optimized batch processing:

```typescript
const responses = await modelServingService.batchInference(
  'engagement-model',
  [
    { inputData: {...}, priority: 'normal' },
    { inputData: {...}, priority: 'high' }
  ]
);
```

- **Process**: Sequential inference for each request
- **Output**: Array of `ModelInferenceResponse` objects

#### `getServingMetrics(modelId)`
Computes latency percentiles and error rates:

```typescript
const metrics = await modelServingService.getServingMetrics(modelId);
// { p95Latency: 145ms, p99Latency: 203ms, cacheHitRate: 42.3%, ... }
```

- **P95/P99**: 95th/99th percentile of latencies from last 1000 requests
- **Cache Hit Rate**: Percentage of cached vs. fresh inferences

### Firestore Collections

| Collection | Purpose | Retention |
|---|---|---|
| `model_servers` | Server state & config | Indefinite |
| `inference_requests` | Request history | 7 days |
| `inference_cache` | Cached predictions | 1 hour (TTL) |
| `inference_metrics` | Latency & error tracking | 30 days |

### Scheduling

**Health Checks** (Every 60 seconds):
- Fetches all running servers
- Calculates metrics for last 1000 inferences
- Updates uptime, latency, and throughput fields

**Cache Cleanup** (Every 10 minutes):
- Removes expired entries from in-memory cache
- Logs cleanup count

---

## 24.3 Anomaly Interpretability (`anomaly-interpretability.service.ts`)

### Purpose
Explains detected anomalies using contributing factors and adaptive thresholds.

### Key Interfaces

```typescript
export interface CustomAnomalyThreshold {
  id: string;
  metric: string;
  lowerBound: number;
  upperBound: number;
  sensitivity: 'low' | 'medium' | 'high';
  adaptive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnomalyExplanation {
  anomalyId: string;
  metric: string;
  explanation: string;
  contributingFactors: Array<{
    factor: string;
    impact: number; // 0-100
    description: string;
  }>;
  similarPastAnomalies: string[];
  recommendedActions: string[];
  confidence: number;
  generatedAt: Date;
}

export interface FeatureImportance {
  anomalyId: string;
  features: Array<{
    name: string;
    importance: number; // 0-100
    direction: 'positive' | 'negative';
  }>;
  shapelyValues?: Record<string, number>;
  generatedAt: Date;
}

export interface InterpretabilityReport {
  reportId: string;
  metric: string;
  period: string; // YYYY-MM-DD to YYYY-MM-DD
  totalAnomalies: number;
  explainedAnomalies: number;
  averageConfidence: number;
  topFactors: Array<{ factor: string; frequency: number }>;
  generatedAt: Date;
}
```

### Sensitivity Levels

| Sensitivity | Multiplier | Use Case |
|---|---|---|
| `low` | 3σ | Ignore minor fluctuations |
| `medium` | 2σ | Balanced detection |
| `high` | 1.5σ | Catch subtle anomalies |

**σ = Standard deviation of recent anomalies**

### Core Methods

#### `setCustomThreshold(metric, lowerBound, upperBound, sensitivity, adaptive)`
Defines per-metric thresholds:

```typescript
await anomalyInterpretabilityService.setCustomThreshold(
  'error_rate',
  0.02,
  0.15,
  'high',
  true // adaptive = auto-adjust
);
```

- **Adaptive Mode**: Automatically optimizes bounds every 6 hours
- **Sensitivity**: Applied during threshold calculation

#### `explainAnomaly(anomalyId)`
Generates human-readable anomaly explanation:

```typescript
const explanation = await anomalyInterpretabilityService.explainAnomaly(anomId);
// {
//   explanation: "A critical severity anomaly was detected...",
//   contributingFactors: [ { factor: "high_deviation", impact: 85, ... } ],
//   similarPastAnomalies: [ anomId1, anomId2 ],
//   recommendedActions: [ "Escalate to on-call..." ],
//   confidence: 85
// }
```

- **Contributing Factors**: Deviation %, type, severity
- **Similar Anomalies**: Queried from past 5 similar incidents
- **Recommended Actions**: Based on anomaly type
- **Confidence**: 60–95% depending on factor count

#### `generateInterpretabilityReport(metric, startDate, endDate)`
Period-based aggregation report:

```typescript
const report = await anomalyInterpretabilityService.generateInterpretabilityReport(
  'engagement_score',
  new Date('2026-08-01'),
  new Date('2026-09-01')
);
```

- **Aggregates**: All anomalies detected in period
- **Top Factors**: Ranks contributing factors by frequency
- **Confidence**: Average confidence across all explained anomalies

### Firestore Collections

| Collection | Purpose |
|---|---|
| `custom_anomaly_thresholds` | Per-metric threshold config |
| `anomaly_explanations` | Generated explanations (indexed by anomalyId) |
| `feature_importance` | Feature attribution scores |
| `interpretability_reports` | Period-based aggregations |

### Scheduling

**Threshold Optimization** (Every 6 hours):
- Fetches all adaptive thresholds
- Calculates mean and standard deviation of recent 100 anomalies
- Updates lower/upper bounds based on sensitivity level

---

## 24.4 Advanced BI Integrations (`advanced-bi-integrations.service.ts`)

### Purpose
Connects to enterprise BI platforms for data synchronization and dashboard management.

### Supported Platforms

| Platform | Share Link Format | Features |
|---|---|---|
| **Domo** | `https://lingolive.domo.com/dashboard/{id}` | Real-time data sync, embedded dashboards |
| **QlikView** | `https://lingolive.qlik.com/qvf/{id}` | Server-side caching, data lineage |
| **Sisense** | `https://lingolive.sisense.com/app/{id}` | Widget embedding, analytics |
| **ThoughtSpot** | `https://lingolive.thoughtspot.com/embed/{id}` | Search analytics, pinboards |

### Key Interfaces

```typescript
export interface AdvancedBIPlatform {
  id: string;
  platform: 'domo' | 'qlikview' | 'sisense' | 'thoughtspot';
  name: string;
  apiKey: string;
  instanceUrl: string;
  status: 'connected' | 'disconnected' | 'error';
  datasetCount: number;
  lastSyncAt?: Date;
  createdAt: Date;
}

export interface DatasetMapping {
  id: string;
  sourceCollection: string;
  targetDataset: string;
  platform: string;
  columnMappings: Array<{
    sourceColumn: string;
    targetColumn: string;
    transformation?: string;
  }>;
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  enabled: boolean;
  createdAt: Date;
}

export interface DashboardPublishing {
  id: string;
  dashboardName: string;
  platform: string;
  dashboardId: string;
  shareLink: string;
  accessLevel: 'public' | 'restricted' | 'team';
  viewCount: number;
  lastViewedAt?: Date;
  publishedAt: Date;
}

export interface EmbeddedAnalytics {
  id: string;
  containerId: string;
  dashboardId: string;
  platform: string;
  embedToken: string;
  expiresAt: Date;
  permissionsLevel: 'view' | 'edit' | 'admin';
  createdAt: Date;
}

export interface BIDataLineage {
  datasetId: string;
  sourceCollections: string[];
  transformations: Array<{
    step: number;
    operation: string;
    inputColumns: string[];
    outputColumns: string[];
  }>;
  lastUpdated: Date;
}
```

### Core Methods

#### `connectAdvancedBIPlatform(platform, name, apiKey, instanceUrl)`
Establishes connection to BI platform:

```typescript
const connection = await advancedBIIntegrationService.connectAdvancedBIPlatform(
  'domo',
  'LingoLive Analytics',
  'api_key_...',
  'https://lingolive.domo.com'
);
```

- **Validation**: Attempts API connection
- **Status**: Set to 'connected' on success
- **Logging**: Security event logged with platform info

#### `createDatasetMapping(sourceCollection, targetDataset, platform, columnMappings, syncFrequency)`
Maps Firestore collection to BI dataset:

```typescript
const mapping = await advancedBIIntegrationService.createDatasetMapping(
  'user_engagement',
  'analytics_dataset',
  'domo',
  [
    {
      sourceColumn: 'engagement_score',
      targetColumn: 'score',
      transformation: 'Math.round(x * 100)'
    }
  ],
  'hourly'
);
```

- **Sync Frequencies**: realtime, hourly, daily, weekly
- **Transformations**: Optional per-column logic
- **Enabled**: Default true

#### `publishDashboard(platform, dashboardName, dashboardId, accessLevel)`
Publishes dashboard with access control:

```typescript
const publishing = await advancedBIIntegrationService.publishDashboard(
  'sisense',
  'Student Engagement Dashboard',
  'dash_xyz',
  'team' // 'public' | 'restricted' | 'team'
);
```

- **Share Link**: Auto-generated from platform base URL
- **View Tracking**: Enabled automatically
- **Access Levels**: Control visibility scope

#### `createEmbeddedAnalytics(containerId, dashboardId, platform, permissionsLevel)`
Generates secure embed tokens:

```typescript
const embedded = await advancedBIIntegrationService.createEmbeddedAnalytics(
  'container_id',
  'dashboard_id',
  'thoughtspot',
  'view' // 'view' | 'edit' | 'admin'
);
// { embedToken: 'token_...', expiresAt: Date(+7 days) }
```

- **Token TTL**: 7 days
- **Permissions**: view, edit, admin per container
- **Refresh**: Automatic refresh when expired

#### `getDataLineage(datasetId)`
Traces data flow for compliance:

```typescript
const lineage = await advancedBIIntegrationService.getDataLineage(datasetId);
// {
//   sourceCollections: ['users', 'engagement'],
//   transformations: [
//     { step: 1, operation: 'map_columns', inputColumns: [...], outputColumns: [...] }
//   ]
// }
```

### Firestore Collections

| Collection | Purpose |
|---|---|
| `advanced_bi_platforms` | Connection configs |
| `dataset_mappings` | Sync configurations |
| `published_dashboards` | Dashboard metadata & view counts |
| `embedded_analytics` | Embed token tracking |

### Scheduling

**Dataset Sync** (Every 60 minutes):
- Fetches enabled mappings
- Checks sync frequency
- Syncs up to 1000 records per collection
- Updates `lastSyncAt` timestamp

---

## 24.5 Federated Learning (`federated-learning.service.ts`)

### Purpose
Implements privacy-preserving distributed ML with differential privacy guarantees.

### Key Interfaces

```typescript
export interface FederatedLearningModel {
  id: string;
  name: string;
  version: string;
  taskType: 'engagement' | 'churn' | 'revenue' | 'learning';
  globalAccuracy: number;
  participantCount: number;
  roundNumber: number;
  status: 'initializing' | 'aggregating' | 'distributing' | 'completed';
  createdAt: Date;
  lastRoundAt?: Date;
}

export interface LocalUpdate {
  id: string;
  participantId: string;
  modelId: string;
  round: number;
  weights: Record<string, number[]>;
  accuracy: number;
  dataSize: number;
  timestamp: Date;
}

export interface DifferentialPrivacyConfig {
  epsilon: number; // Privacy budget (0–∞, lower = more private)
  delta: number; // Failure probability (typically 1e-6)
  clipNorm: number; // Gradient clipping threshold
  noiseScale: number; // Gaussian noise standard deviation
}

export interface PrivacyReport {
  reportId: string;
  modelId: string;
  privacyBudgetUsed: number;
  privacyBudgetRemaining: number;
  dataExposureRisk: number; // 0-100
  membershipInferenceRisk: number; // 0-100
  modelInversionRisk: number; // 0-100
  generatedAt: Date;
}
```

### Core Methods

#### `initializeFederatedModel(name, taskType)`
Starts federated learning round:

```typescript
const model = await federatedLearningService.initializeFederatedModel(
  'Student Learning Outcome Predictor',
  'learning'
);
// { id: 'fl-learning-...', status: 'initializing', roundNumber: 0 }
```

- **Status**: Set to 'initializing'
- **Round**: Starts at 0
- **Participants**: Tracked as updates arrive

#### `submitLocalUpdate(participantId, modelId, weights, accuracy, dataSize)`
Client submits trained weights:

```typescript
await federatedLearningService.submitLocalUpdate(
  'school_1',
  'fl-learning-...',
  { layer1: [0.5, 0.3, ...], layer2: [0.1, 0.2, ...] },
  0.87, // accuracy on local data
  450 // sample count
);
```

- **Round Tracking**: Tied to current model round
- **Logging**: Security event for audit trail
- **Validation**: Weights structure validated

#### `aggregateModelUpdates(modelId)`
Secure aggregation of weights:

```typescript
const updatedModel = await federatedLearningService.aggregateModelUpdates(modelId);
// Computes federated average of all local updates
```

- **Algorithm**: Simple federated averaging (Σ weights / N participants)
- **Status**: Changed to 'distributing' after aggregation
- **Round**: Incremented by 1
- **Accuracy**: Averaged across participants

#### `applyDifferentialPrivacy(weights, config)`
Adds privacy guarantees to aggregated model:

```typescript
const noisyWeights = await federatedLearningService.applyDifferentialPrivacy(
  aggregatedWeights,
  {
    epsilon: 1.0,
    delta: 1e-6,
    clipNorm: 1.0,
    noiseScale: 0.1
  }
);
```

- **Clipping**: Bounds gradient norm to prevent single-sample overfitting
- **Noise**: Gaussian noise scaled by epsilon/delta tradeoff
- **Privacy Budget**: Tracked across rounds

#### `generatePrivacyReport(modelId)`
Assesses privacy risks:

```typescript
const report = await federatedLearningService.generatePrivacyReport(modelId);
// {
//   privacyBudgetUsed: 0.5,
//   privacyBudgetRemaining: 7.5,
//   dataExposureRisk: 40, // 0-100
//   membershipInferenceRisk: 30,
//   modelInversionRisk: 25
// }
```

- **Privacy Budget**: Total epsilon allowed (8.0)
- **Risk Scores**: Heuristic-based (lower = safer)
- **Exposure**: Decreases with larger privacy budget used

### Firestore Collections

| Collection | Purpose |
|---|---|
| `federated_learning_models` | Global model state |
| `federated_local_updates` | Per-participant updates (indexed by round) |
| `secure_aggregations` | Aggregation job tracking |
| `privacy_reports` | Privacy audit trail |

### Scheduling

**Aggregation Rounds** (Every 60 minutes):
- Fetches models in 'aggregating' status
- Collects all updates for current round
- Performs secure aggregation
- Increments round number
- Logs completion

### Privacy Model

**Differential Privacy Guarantees**:
- Each round "costs" epsilon of privacy budget
- Total privacy budget = 8.0 (allows ~10 rounds at ε=0.8)
- Failure probability (δ) set to 1e-6
- Member inference probability bounded by δ after total budget exhausted

**Privacy Risks** (Heuristic):
- **Data Exposure**: 100 - (privacyBudgetUsed × 12.5)
- **Membership Inference**: 50 - (participantCount × 0.5)
- **Model Inversion**: 40 - (participantCount × 0.3)

---

## Endpoints Summary

### Deep Learning (`/api/deep-learning`)
- `POST /lstm-predict` — Generate LSTM predictions
- `POST /train-model` — Train neural network
- `POST /forecast-timeseries` — Advanced time series forecast
- `GET /models` — List all models
- `POST /evaluate-model/:modelId` — Evaluate performance
- `GET /lstm-predictions/:userId` — Fetch user predictions

### Model Serving (`/api/model-serving`)
- `POST /start-server` — Launch model server
- `POST /stop-server/:serverId` — Stop server
- `GET /servers` — List servers
- `POST /inference` — Single inference request
- `POST /batch-inference` — Batch processing
- `GET /metrics/:modelId` — Serving metrics
- `POST /scale-server/:serverId` — Scale replicas

### Anomaly Interpretability (`/api/anomaly-interpretability`)
- `POST /threshold` — Set custom threshold
- `GET /thresholds` — List thresholds
- `POST /explain/:anomalyId` — Explain anomaly
- `GET /feature-importance/:anomalyId` — Feature attribution
- `POST /interpretability-report` — Generate report
- `POST /update-adaptive-threshold/:metric` — Update bounds

### Advanced BI Integrations (`/api/advanced-bi-integrations`)
- `POST /connect-platform` — Connect BI platform
- `POST /dataset-mapping` — Map Firestore to BI
- `POST /publish-dashboard` — Publish dashboard
- `POST /embedded-analytics` — Create embed token
- `POST /track-dashboard-view/:publishId` — Track view
- `GET /data-lineage/:datasetId` — Get lineage
- `GET /platforms` — List platforms
- `GET /published-dashboards` — List dashboards
- `POST /refresh-embed-token/:embedId` — Refresh token

### Federated Learning (`/api/federated-learning`)
- `POST /initialize-model` — Start federated model
- `POST /submit-local-update` — Submit weights
- `POST /aggregate-updates/:modelId` — Aggregate round
- `POST /apply-differential-privacy` — Add privacy
- `POST /privacy-report/:modelId` — Privacy audit
- `GET /models` — List models
- `GET /local-updates/:modelId` — Fetch updates
- `GET /aggregation-status/:modelId` — Check aggregation

---

## Integration Points

### With Phase 23
- **Anomaly Detection** ↔ **Anomaly Interpretability**: Explains Phase 23 anomalies
- **ML Models** ↔ **Deep Learning**: Extends model types (LSTM, neural networks)
- **Real-time Dashboard** ↔ **Model Serving**: Serves predictions to dashboard
- **Recommendations** ↔ **Federated Learning**: Privacy-preserving recommendation training

### With Existing Services
- **Firebase Auth**: All endpoints require authentication
- **Firestore**: Persistent storage for models, updates, metrics
- **Notifications**: Alerts on anomaly explanations, model drift
- **Analytics**: Logs all model operations for audit trail

---

## Security Considerations

### Authentication
- All endpoints protected by `requireAuth` middleware
- Firebase ID token verification required
- User identity tied to requests

### Data Privacy
- Federated learning keeps raw data on-device
- Differential privacy adds mathematical guarantees
- Encrypted model updates in transit
- No aggregated model exposes individual participant data

### Audit Trail
- All model operations logged via `logSecurityEvent`
- Privacy budget tracked per model
- Anomaly explanations attributed to requestor
- BI platform connections logged with API usage

---

## Monitoring & Operations

### Health Checks
- Model server uptime tracked (target: 99.5%)
- Inference latency monitored (p95 < 200ms, p99 < 400ms)
- Cache hit rate tracked (target: > 40%)
- Privacy budget consumption reported

### Alerting
- Model accuracy drop > 5% triggers notification
- Inference latency spike > 500ms
- Cache degradation below 20% hit rate
- Privacy budget exhaustion warning at 90% consumed

---

## Performance Benchmarks

| Component | Metric | Target |
|---|---|---|
| LSTM Prediction | Latency | < 100ms |
| Inference Request | P95 Latency | < 150ms |
| Batch Inference | Throughput | > 100 req/s |
| Model Training | Daily Retrain | < 5 min |
| Aggregation Round | Secure Aggregation | < 30s |
| Cache Lookup | Hit Rate | > 40% |

---

## Implementation Status

✅ **24.1 Advanced Deep Learning** — Complete  
✅ **24.2 Real-time Model Serving** — Complete  
✅ **24.3 Anomaly Interpretability** — Complete  
✅ **24.4 Advanced BI Integrations** — Complete  
✅ **24.5 Federated Learning** — Complete

All 5 route files implemented with full endpoint coverage.  
All 5 services integrated into `server.ts`.  
Ready for deployment.
