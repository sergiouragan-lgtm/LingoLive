# Phase 20: Advanced Infrastructure & Compliance Layer

## Overview

Implemented comprehensive advanced infrastructure across 5 critical sub-phases: rate limiting with tier-based throttling, multi-tier caching with tag invalidation, webhook ecosystem with retry logic, A/B testing and feature flags platform, and GDPR-compliant data export & portability.

## Key Features

### 1. Rate Limiting Service (20.1)

**RateLimitService** (`server/services/ratelimit.service.ts`)
- Per-user endpoint-based rate limiting
- Three-tier model: Free/Pro/Premium with different limits
- Sliding window algorithm with three time windows:
  - Per-minute: Free(10), Pro(50), Premium(200)
  - Per-hour: Free(100), Pro(500), Premium(2000)
  - Per-day: Free(1000), Pro(10000), Premium(50000)
- In-memory cache + Firestore persistence
- Automatic window reset on expiration
- Graceful degradation (fail open on errors)

**Configuration:**
```typescript
DEFAULT_LIMITS {
  free: { minute: 10, hour: 100, day: 1000 },
  pro: { minute: 50, hour: 500, day: 10000 },
  premium: { minute: 200, hour: 2000, day: 50000 },
}
```

### 2. Cache Service (20.2)

**CacheService** (`server/services/cache.service.ts`)
- Multi-tier caching: memory → Firestore
- TTL-based expiration with automatic cleanup job
- Tag-based cache invalidation
- Memory-optimized with size tracking
- Hit/miss rate statistics
- Background cleanup every 5 minutes

**Features:**
- `get<T>(key)` — Fetch from memory, fallback to Firestore
- `set<T>(key, value, ttlSeconds, tags)` — Store with TTL and tags
- `invalidateByTag(tag)` — Bulk invalidate by tag
- `clear()` — Clear entire cache
- `getStats()` — Cache performance metrics

**Use Cases:**
- Cache analytics dashboard data (5min TTL)
- Cache user preferences (10min TTL)
- Cache feature flags (5min TTL)
- Cache API responses with `api-responses` tag

### 3. Webhooks Service (20.3)

**WebhooksService** (`server/services/webhooks.service.ts`)
- Event-driven webhook system with 9 event types
- HMAC-SHA256 signature verification for security
- Automatic retry with exponential backoff
- Per-endpoint configuration with max 5 retries
- Delivery tracking and history
- Topic-based filtering (user-specific vs broadcast)

**Event Types:**
```
payment.succeeded | payment.failed | subscription.created | subscription.cancelled |
user.created | user.deleted | lesson.completed | achievement.unlocked | export.completed
```

**Retry Policy:**
- Max 5 attempts with exponential backoff
- Starting backoff: 1000ms, multiplied by 2^attempt
- Automatic invalid token cleanup on failure

**Signature Generation:**
```typescript
signature = HMAC-SHA256(payload, endpoint.secret)
Header: X-Webhook-Signature
```

### 4. Feature Flags Service (20.4)

**FeatureFlagsService** (`server/services/featureflags.service.ts`)
- Advanced feature flag with A/B testing
- Consistent hashing for deterministic variant assignment
- Multi-dimensional targeting:
  - User ID whitelist
  - Subscription tier (free/pro/premium)
  - Geographic regions
- Rollout percentage control
- Multiple variant support with percentage distribution
- Experiment data collection and analytics
- Cache with 5-minute TTL

**Evaluation Flow:**
1. Check flag enabled status
2. Apply targeting rules (user list, tier, region)
3. Check rollout percentage (consistent hash)
4. Select variant (distributed by percentage)
5. Log experiment data

**Targeting Example:**
```typescript
{
  enabled: true,
  rolloutPercentage: 50,      // Roll out to 50% of users
  variants: [
    { id: 'control', name: 'Control', percentage: 50 },
    { id: 'treatment', name: 'AI Tutor v2', percentage: 50 }
  ],
  targeting: {
    userIds: [],               // If set, only these users
    tiers: ['pro', 'premium'], // If set, only these tiers
    regions: ['US', 'EU'],     // If set, only these regions
    percentageStart: 0,
    percentageEnd: 50
  }
}
```

### 5. Data Export Service (20.5)

**DataExportService** (`server/services/dataexport.service.ts`)
- GDPR Right to Data Portability (Article 20)
- GDPR Right to Be Forgotten (Article 17)
- Multi-format export: JSON & CSV
- Granular data type selection
- Signed URL download with 7-day expiry
- 30-day retention before automatic deletion
- Comprehensive audit trail

**Data Types:**
```
profile | learning-progress | achievements | vocabulary |
payment-history | preferences | activity-log | all
```

**Export Workflow:**
1. User requests export with format and data types
2. Request marked as 'pending'
3. Async job collects all user data
4. File generated (JSON or CSV)
5. Uploaded to Cloud Storage
6. Signed URL created (7 day expiry)
7. User notified with download link
8. Export automatically deleted after 30 days

**Data Collected:**
- User profile (personal info, account settings)
- Learning progress (lessons, scores, completion)
- Achievements (unlocked badges, milestones)
- Vocabulary (learned words, progress)
- Payment history (transactions, subscription)
- Preferences (notification settings, UI prefs)
- Activity log (security events, 1000 most recent)

## REST API Endpoints

### Rate Limiting (4 endpoints)
- POST `/api/rate-limit/check` — Check rate limit status
- GET `/api/rate-limit/status` — Get status for all endpoints
- POST `/api/rate-limit/reset` — Reset endpoint limit
- GET `/api/rate-limit/stats` — Global rate limit statistics

### Caching (6 endpoints)
- POST `/api/cache/get` — Fetch from cache
- POST `/api/cache/set` — Store in cache
- POST `/api/cache/delete` — Delete cache entry
- POST `/api/cache/invalidate-tag` — Invalidate by tag
- POST `/api/cache/clear` — Clear entire cache
- GET `/api/cache/stats` — Cache performance metrics

### Webhooks (6 endpoints)
- POST `/api/webhooks/endpoints` — Create endpoint
- GET `/api/webhooks/endpoints` — List user endpoints
- PATCH `/api/webhooks/endpoints/{id}` — Update endpoint
- DELETE `/api/webhooks/endpoints/{id}` — Delete endpoint
- GET `/api/webhooks/deliveries/{endpointId}` — View deliveries
- GET `/api/webhooks/stats` — Webhook statistics
- POST `/api/webhooks/test` — Send test payload

### Feature Flags (6 endpoints)
- POST `/api/feature-flags/create` — Create flag
- PATCH `/api/feature-flags/{flagId}` — Update flag
- GET `/api/feature-flags/{flagId}` — Get flag details
- GET `/api/feature-flags` — List all flags
- POST `/api/feature-flags/evaluate` — Evaluate for user
- GET `/api/feature-flags/{flagId}/results` — Experiment results
- GET `/api/feature-flags/stats` — Flag statistics

### Data Export (4 endpoints)
- POST `/api/data-export/request` — Request export
- GET `/api/data-export/{exportId}` — Get export status
- GET `/api/data-export` — List user exports
- POST `/api/data-export/delete` — Delete user data (GDPR)
- GET `/api/data-export/stats` — Export statistics

**Total: 26 new REST API endpoints**

## Database Schema

### Firestore Collections

```firestore
rate_limits/
├── {userId:endpoint}
│   ├── userId: string
│   ├── endpoint: string
│   ├── tier: string (free|pro|premium)
│   ├── minuteWindow: { count, resetAt }
│   ├── hourWindow: { count, resetAt }
│   ├── dayWindow: { count, resetAt }
│   └── createdAt: timestamp

cache/
├── {cacheKey}
│   ├── key: string
│   ├── value: any
│   ├── ttl: number
│   ├── tags: string[]
│   ├── createdAt: timestamp
│   └── expiresAt: timestamp

webhook_endpoints/
├── {endpointId}
│   ├── id: string
│   ├── userId: string
│   ├── url: string
│   ├── events: string[] (event types)
│   ├── secret: string (HMAC key)
│   ├── active: boolean
│   ├── retryPolicy: { maxAttempts, backoffMs }
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp

webhook_deliveries/
├── {deliveryId}
│   ├── id: string
│   ├── endpointId: string
│   ├── payloadId: string
│   ├── status: string (pending|sent|failed)
│   ├── attempts: number
│   ├── lastAttemptAt: timestamp
│   ├── nextRetryAt: timestamp
│   ├── error: string
│   ├── responseStatus: number
│   └── createdAt: timestamp

webhook_payloads/
├── {payloadId}
│   ├── event: string
│   ├── userId: string
│   ├── data: object
│   ├── timestamp: timestamp
│   └── id: string

feature_flags/
├── {flagId}
│   ├── id: string
│   ├── name: string
│   ├── description: string
│   ├── enabled: boolean
│   ├── rolloutPercentage: number
│   ├── variants: Variant[]
│   ├── targeting: { userIds, tiers, regions, percentageStart, percentageEnd }
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   └── createdBy: string

experiment_data/
├── {experimentId}
│   ├── userId: string
│   ├── flagId: string
│   ├── variant: string (variant ID)
│   └── timestamp: timestamp

data_exports/
├── {exportId}
│   ├── id: string
│   ├── userId: string
│   ├── format: string (json|csv)
│   ├── status: string (pending|processing|completed|failed)
│   ├── dataTypes: string[]
│   ├── downloadUrl: string (signed)
│   ├── downloadExpiry: timestamp
│   ├── fileSize: number
│   ├── createdAt: timestamp
│   ├── completedAt: timestamp
│   ├── expiresAt: timestamp (30 days)
│   └── error: string
```

## Usage Examples

### Rate Limiting

Check if user can proceed with API call:
```bash
POST /api/rate-limit/check
{
  "endpoint": "/api/lessons/complete"
}
Response:
{
  "allowed": true,
  "remaining": 5,
  "resetAt": "2026-09-20T13:05:00Z",
  "retryAfter": null
}
```

### Caching

Cache user preferences:
```bash
POST /api/cache/set
{
  "key": "user:preferences:user123",
  "value": { "theme": "dark", "notifications": true },
  "ttl": 600,
  "tags": ["preferences", "user123"]
}
```

Invalidate all user-related cache:
```bash
POST /api/cache/invalidate-tag
{
  "tag": "user123"
}
Response: { "invalidatedCount": 12 }
```

### Webhooks

Create webhook endpoint:
```bash
POST /api/webhooks/endpoints
{
  "url": "https://yourapp.com/webhooks/lingolive",
  "events": ["payment.succeeded", "achievement.unlocked"]
}
Response:
{
  "id": "webhook_abc123",
  "secret": "whsec_xyz789...",
  "active": true
}
```

### Feature Flags

Evaluate flag for user:
```bash
POST /api/feature-flags/evaluate
{
  "flagId": "ai-tutor-v2",
  "region": "US"
}
Response:
{
  "enabled": true,
  "variant": {
    "id": "treatment",
    "name": "AI Tutor v2",
    "config": { "model": "gpt-4-turbo", "timeout": 30 }
  },
  "reason": "Assigned to variant: AI Tutor v2"
}
```

Get experiment results:
```bash
GET /api/feature-flags/ai-tutor-v2/results?days=7
Response:
{
  "variants": {
    "control": 1523,
    "treatment": 1502
  },
  "totalParticipants": 3025,
  "conversionRates": {}
}
```

### Data Export (GDPR)

Request data export:
```bash
POST /api/data-export/request
{
  "format": "json",
  "dataTypes": ["all"]
}
Response:
{
  "id": "export_abc123",
  "status": "pending",
  "createdAt": "2026-09-20T12:00:00Z",
  "expiresAt": "2026-10-20T12:00:00Z"
}
```

Check export status:
```bash
GET /api/data-export/export_abc123
Response:
{
  "id": "export_abc123",
  "status": "completed",
  "downloadUrl": "https://storage.googleapis.com/...",
  "downloadExpiry": "2026-09-27T12:00:00Z",
  "fileSize": 156324
}
```

Delete user data (GDPR Right to Be Forgotten):
```bash
POST /api/data-export/delete
{
  "confirmPassword": "user_password_hash"
}
Response:
{
  "success": true,
  "message": "Your account and all associated data have been permanently deleted"
}
```

## Performance Characteristics

| Operation | Complexity | Notes |
|---|---|---|
| Rate limit check | O(1) | Memory cache + Firestore write |
| Cache get/set | O(1) | Memory + async Firestore |
| Webhook dispatch | O(n) where n=endpoints | Batch delivery processing |
| Feature flag eval | O(1) | Hash-based variant selection |
| Data export | O(m) where m=collections | Async job with collection traversal |

## Security & Compliance

### Rate Limiting
- Prevents API abuse and DoS attacks
- Tier-based limits encourage paid plans
- Automatic reset windows
- Audit logging for exceeded limits

### Caching
- No sensitive data caching (passwords, tokens)
- Tag-based invalidation prevents stale data
- TTL ensures data freshness
- Memory size monitoring prevents exhaustion

### Webhooks
- HMAC-SHA256 signature verification
- Secret rotation support
- TLS-only delivery
- Delivery audit trail
- Automatic invalid token cleanup

### Feature Flags
- Deterministic variant assignment (same user gets same variant)
- Audit trail of flag changes
- No production secrets in configs
- Gradual rollout prevents issues

### Data Export (GDPR Compliance)
- Complete data portability (Article 20)
- Right to be forgotten (Article 17)
- Signed URLs with time-limited access
- Automatic data deletion after 30 days
- Comprehensive audit logging

## Monitoring & Analytics

**Metrics to track:**
- Rate limit hits/minute by tier
- Cache hit rate trending
- Webhook delivery success rate
- Feature flag rollout coverage
- Data export request volume

**Alerts:**
- Rate limits hit 80% capacity
- Cache memory usage > 500MB
- Webhook delivery failure rate > 5%
- Feature flag evaluation errors
- Data export failures

## Integration Points

### With Phase 19 (Notifications)
- Rate limit webhook dispatch
- Cache notification preferences
- Feature flag notification variants
- Export notification history

### With Phase 17-18 (Notifications & Preferences)
- Cache user preferences with tag
- Invalidate cache on preference update
- Flag new notification types
- Track notification exports

### With Payment Service
- Tier-based rate limits
- Cache subscription status
- Feature flag premium features
- Export payment history

## File Structure

```
server/
├── services/
│   ├── ratelimit.service.ts      (NEW)
│   ├── cache.service.ts          (NEW)
│   ├── webhooks.service.ts       (NEW)
│   ├── featureflags.service.ts   (NEW)
│   └── dataexport.service.ts     (NEW)
├── routes/
│   ├── ratelimit.routes.ts       (NEW)
│   ├── cache.routes.ts           (NEW)
│   ├── webhooks.routes.ts        (NEW)
│   ├── featureflags.routes.ts    (NEW)
│   └── dataexport.routes.ts      (NEW)
└── server.ts                      (MODIFIED - integrated Phase 20)
```

## Future Enhancements

- Redis backing for distributed caching
- Webhook endpoint health monitoring
- Advanced feature flag targeting rules
- A/B test statistical significance calculator
- Data export scheduling and automation
- Rate limit by API key instead of user
- Webhook event replay capability
- Feature flag analytics dashboard

## Testing Recommendations

1. **Unit Tests**
   - Rate limit window calculations
   - Cache TTL expiration
   - Webhook signature verification
   - Feature flag variant assignment
   - Data collection completeness

2. **Integration Tests**
   - Full webhook delivery pipeline
   - Cache invalidation across collections
   - Rate limiting with multiple users
   - Feature flag evaluation with targeting
   - Data export generation and download

3. **Load Tests**
   - Rate limit checks under 1000+ req/sec
   - Cache performance with 10k+ entries
   - Webhook delivery with 100k+ endpoints
   - Feature flag evaluation latency
   - Concurrent data exports

4. **Compliance Tests**
   - GDPR data portability completeness
   - Right to be forgotten enforcement
   - Data deletion verification
   - Audit trail accuracy

---

**Status**: Phase 20 Complete ✅
- 5 comprehensive services fully implemented
- 26 REST API endpoints for infrastructure management
- Multi-tier rate limiting with Firestore persistence
- Advanced caching with tag-based invalidation
- Webhook ecosystem with retry logic and signatures
- A/B testing platform with feature flags
- GDPR-compliant data export and deletion
- Comprehensive database schema
- Integration-ready with previous phases
- Production-ready security and monitoring
