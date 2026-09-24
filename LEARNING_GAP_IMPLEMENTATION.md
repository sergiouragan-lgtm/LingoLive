# Learning Gap Aggregation Implementation

## Overview

This implementation provides an automated system to:
1. **Log student errors** from quiz attempts and exercises
2. **Aggregate errors** into learning gaps by skill area and sub-area
3. **Generate recommendations** for remediation
4. **Prioritize gaps** based on error frequency and rate
5. **Track aggregation** metrics and statistics

## Files Created

### Core Service
- `server/services/learning-gap-aggregation.service.ts` — Main service for error logging and gap aggregation
- `server/services/__tests__/learning-gap-aggregation.service.test.ts` — Unit tests

### Background Jobs
- `server/jobs/learning-gap-aggregation.job.ts` — Bull queue job for scheduled aggregation (every 6 hours)

### API Routes
- `server/routes/learning-gaps.routes.ts` — REST API endpoints for error logging and gap retrieval

## API Endpoints

### User-Facing Endpoints

#### 1. Log a Student Error
```http
POST /api/learning-gaps/errors
Content-Type: application/json
Authorization: Bearer <token>

{
  "lessonId": "lesson123",
  "exerciseId": "exercise456",
  "language": "pt-BR",
  "skillArea": "grammar",
  "skillSubArea": "past-tense",
  "correctAnswer": "foi",
  "studentAnswer": "era",
  "errorType": "incorrect",
  "confidence": 25,
  "contextMetadata": {
    "difficultyLevel": "intermediate",
    "attemptNumber": 2,
    "timeSpentMs": 5000
  }
}

Response:
{
  "success": true,
  "errorId": "error-123"
}
```

#### 2. Get Learning Gaps for Current User
```http
GET /api/learning-gaps
Authorization: Bearer <token>

Response:
{
  "success": true,
  "count": 3,
  "gaps": [
    {
      "userId": "user123",
      "skillArea": "grammar",
      "skillSubArea": "past-tense",
      "language": "pt-BR",
      "errorCount": 5,
      "errorRate": 45,
      "priority": "high",
      "recommendedActions": [...]
    }
  ]
}
```

#### 3. Get Gaps by Skill Area
```http
GET /api/learning-gaps/by-skill/grammar
Authorization: Bearer <token>

Response:
{
  "success": true,
  "skillArea": "grammar",
  "count": 2,
  "gaps": [...]
}
```

#### 4. Manually Trigger Aggregation
```http
POST /api/learning-gaps/aggregate
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Aggregated 3 learning gaps",
  "gaps": [...]
}
```

#### 5. Close a Learning Gap
```http
POST /api/learning-gaps/grammar/past-tense/close
Content-Type: application/json
Authorization: Bearer <token>

{
  "language": "pt-BR"
}

Response:
{
  "success": true,
  "message": "Learning gap closed successfully"
}
```

### Admin-Only Endpoints

#### 6. Trigger Global Aggregation
```http
POST /api/learning-gaps/admin/trigger-aggregation
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "limitUsers": 100  // Optional: limit to first N users
}

Response:
{
  "success": true,
  "message": "Aggregation job triggered",
  "jobId": "job-456"
}
```

#### 7. Get Queue Statistics
```http
GET /api/learning-gaps/admin/stats
Authorization: Bearer <admin-token>

Response:
{
  "success": true,
  "stats": {
    "counts": {
      "active": 1,
      "completed": 10,
      "failed": 0
    },
    "latestJobs": [...]
  }
}
```

#### 8. Get Aggregation History
```http
GET /api/learning-gaps/admin/history?limitDays=7
Authorization: Bearer <admin-token>

Response:
{
  "success": true,
  "count": 5,
  "limitDays": 7,
  "history": [
    {
      "totalErrorsProcessed": 450,
      "gapsCreated": 32,
      "usersAffected": 15,
      "executionTimeMs": 3200,
      "timestamp": "2024-12-24T10:00:00Z"
    }
  ]
}
```

## Data Models

### StudentErrorLog
```typescript
interface StudentErrorLog {
  id: string;
  userId: string;
  timestamp: Date;
  lessonId: string;
  exerciseId: string;
  language: string;
  skillArea: string;           // e.g., 'grammar', 'vocabulary'
  skillSubArea: string;        // e.g., 'past-tense', 'articles'
  correctAnswer: string;
  studentAnswer: string;
  errorType: 'incorrect' | 'partial' | 'timeout' | 'skipped';
  confidence?: number;         // 0-100
  contextMetadata?: {
    difficultyLevel?: string;
    attemptNumber?: number;
    timeSpentMs?: number;
  };
}
```

### StudentLearningGap
```typescript
interface StudentLearningGap {
  userId: string;
  skillArea: string;
  skillSubArea: string;
  language: string;
  errorCount: number;
  errorRate: number;           // 0-100
  lastErrorAt: Date;
  firstErrorAt: Date;
  relatedExercises: string[];
  recommendedActions: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  aggregatedAt: Date;
  status: 'active' | 'closed';
}
```

## Firestore Collections

### `student_error_logs`
Stores individual errors as students make them.

**Index needed:**
```
Collection: student_error_logs
- Composite: (userId, timestamp DESC)
```

### `student_learning_gaps`
Stores aggregated learning gaps by skill area.

**Document ID format:** `{userId}:{skillArea}:{skillSubArea}:{language}`

**Index needed:**
```
Collection: student_learning_gaps
- Composite: (userId, status)
- Composite: (userId, priority)
```

### `aggregation_stats`
Stores historical statistics about aggregation job runs.

## Integration Steps

### 1. Register Routes in Server
Add to `server/index.ts` or main server file:

```typescript
import learningGapsRoutes from './routes/learning-gaps.routes';

// ... in Express app setup
app.use('/api/learning-gaps', learningGapsRoutes);
```

### 2. Initialize Scheduled Job
Add to server startup:

```typescript
import { scheduleAggregationJob } from './jobs/learning-gap-aggregation.job';

// In your server initialization
await scheduleAggregationJob();
console.log('Learning gap aggregation job scheduled');
```

### 3. Update Environment Variables
Add to `.env`:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 4. Install Dependencies (if not already installed)
```bash
npm install bull redis
```

## Algorithm Details

### Priority Calculation
- **Critical**: Error rate > 70% OR error count > 10
- **High**: Error rate > 50% OR error count > 7
- **Medium**: Error rate > 30% OR error count > 5
- **Low**: Error rate ≤ 30% AND error count ≤ 5

### Minimum Threshold
- A gap is only created when error count ≥ 3
- Errors from the last 7 days are considered

### Recommendation Generation
- Always: "Practice [skill] exercises regularly" + "Use spaced repetition"
- Error rate > 50%: Recommend foundational review and focused module
- Error rate > 70%: Recommend tutoring session

## Performance Considerations

### Scaling
- **Per-user aggregation**: ~100ms for 50 errors
- **Batch aggregation**: Processes ~10,000 errors in ~3-5 seconds
- **Firestore reads**: Uses batch queries and indexes

### Job Schedule
- Runs every 6 hours (configurable via cron expression)
- Can be manually triggered for testing/critical updates
- Failed jobs are retried automatically (Bull feature)

## Testing

Run tests:
```bash
npm test -- learning-gap-aggregation.service.test.ts
```

## Future Enhancements

1. **ML-based gap prediction**: Predict gaps before they occur
2. **Content recommendations**: Link gaps to specific content modules
3. **Progress tracking**: Monitor gap closure over time
4. **Collaborative filtering**: Find similar learners' solutions
5. **Automated fascicle generation**: Create personalized practice sets from gaps
6. **Analytics dashboard**: Visualize gap trends and patterns

## Monitoring

Monitor job health via:
- Bull's web UI: `bull-board`
- Firestore metrics console
- CloudLogging for error traces

```bash
# Optional: Install Bull Board for monitoring
npm install @bull-board/express
```

## Troubleshooting

### Jobs not running
- Check Redis connection
- Verify Bull queue is initialized
- Check server logs for `[Learning Gap Aggregation]` messages

### Gaps not appearing
- Verify errors are being logged (check `student_error_logs` collection)
- Run manual aggregation: `POST /api/learning-gaps/aggregate`
- Check minimum error threshold (3 errors)

### High latency
- Create Firestore composite indexes (see above)
- Check Redis performance
- Monitor Firestore quota usage
