# Steps 4-5: Database Setup & Deployment Guide

## Step 4: Database Setup

### 4.1 Firestore Initialization

#### Prerequisites
- Firebase Admin SDK credentials set in environment or `firebase-key.json`
- Firebase project created (lingolive-ia-f5778)
- Node.js 18+ installed

#### Execution

```bash
# Set Firebase credentials
export FIREBASE_PROJECT_ID=lingolive-ia-f5778
export FIREBASE_ADMIN_KEY_PATH=./firebase-key.json

# Run Firestore setup
npm run setup:firestore
```

#### What Gets Created

**50 Firestore Collections with Indexes:**

| Phase | Collections | Purpose |
|-------|-------------|---------|
| 38 | workflows, workflow_executions | Workflow automation |
| 39 | cache_entries | Distributed caching |
| 40 | service_mesh_config | Microservices routing |
| 41 | compliance_audit_trail, api_rate_limits, user_analytics_events, error_logs | Compliance & analytics |
| 42 | feature_flags, flag_variants, ab_tests, test_results, user_profiles, recommendations | Features & personalization |
| 43 | notifications, notification_preferences, queue_jobs, batch_processes | Notifications & queues |
| 44 | monitors, metrics_data, monitoring_dashboard, alerts | Monitoring |
| 45 | reports, service_versions, backup_records | Reporting & versioning |

#### Security Rules

```bash
# Deploy Firestore security rules
firebase deploy --only firestore:rules

# Verify deployment
firebase firestore:indexes
```

**Key Security Configurations:**
- Authenticated access required for all user data
- Admin-only access for sensitive collections
- User isolation for personal data (notifications, profiles)
- Time-series index optimization for analytics

#### Database Indexes

The setup script creates ~40 composite indexes optimized for:

1. **Time-series queries**: `timestamp`, `createdAt` descending
2. **User-scoped queries**: `userId`, `timestamp`
3. **Status tracking**: `status`, `createdAt`
4. **Metric aggregation**: `metric`, `timestamp`

All indexes auto-build in 5-15 minutes. Monitor progress:

```bash
firebase firestore:indexes
# Check for 'Ready' status
```

#### Verify Setup

```bash
# List created collections
firebase firestore:delete --recursive --path=/

# Check a collection exists
firebase firestore:get --collection=feature_flags --limit=1

# Check indexes
firebase firestore:indexes
```

---

## Step 5: CI/CD Deployment

### 5.1 GitHub Actions Pipeline Overview

The pipeline (`.github/workflows/deploy-production.yml`) has 6 jobs:

```
test → build → security-scan → deploy-staging (on branch)
                               → deploy-production (on main)
                               → notify-success
```

### 5.2 Job Details

#### Job 1: Test (ubuntu-latest, 30 min timeout)

**Runs on:** Every push to `main` or `claude/continue-previous-work-xogmfi`

**Steps:**
1. Type checking: `npm run typecheck`
2. Linting: `npm run lint` (non-blocking)
3. Unit tests: `npm run test:ci`
4. Coverage: `npm run test:coverage` (non-blocking)
5. Security audit: `npm audit --omit=dev`
6. Coverage upload: Codecov integration

**Success Criteria:**
- TypeScript compilation succeeds
- Unit tests all pass
- Coverage >80%

#### Job 2: Build (ubuntu-latest, 30 min timeout)

**Runs after:** Test succeeds

**Requires:** test job

**Environment:**
- Google Cloud authentication via OIDC federation
- Artifact Registry access

**Steps:**
1. Build Docker image
2. Tag with commit SHA and 'latest'
3. Push to Artifact Registry: `us-central1-docker.pkg.dev/lingolive-ia-f5778/images/lingolive:SHA`
4. Generate SBOM (Software Bill of Materials)

**Success Criteria:**
- Docker build succeeds
- Image pushed to registry

#### Job 3: Security Scan (ubuntu-latest, 15 min timeout)

**Runs after:** Build succeeds

**Requires:** build job

**Scans:**
- Container image vulnerability scan via Google Cloud
- Checks for critical/high-severity vulnerabilities

**Success Criteria:**
- Scan completes (may be non-blocking in future)

#### Job 4: Deploy to Staging (ubuntu-latest, 20 min timeout)

**Runs when:**
- All tests pass
- Build succeeds
- **Only on branch:** `claude/continue-previous-work-xogmfi`

**Deployment:**
```bash
gcloud run deploy lingolive-api-staging \
  --image=us-central1-docker.pkg.dev/lingolive-ia-f5778/images/lingolive:SHA \
  --platform=managed \
  --region=us-central1 \
  --memory=2Gi \
  --cpu=2 \
  --timeout=900 \
  --max-instances=10 \
  --set-env-vars=NODE_ENV=staging,LOG_LEVEL=debug
```

**Features:**
- 2GB memory, 2 CPU cores
- 10 max concurrent instances
- 15-minute request timeout (for background jobs)
- Debug logging enabled

**Post-deployment:** Slack notification with deployment status

#### Job 5: Deploy to Production (ubuntu-latest, 30 min timeout)

**Runs when:**
- All tests pass
- Build succeeds
- **Only on branch:** `main` (merge commit)
- Requires manual approval (GitHub environment)

**Deployment Strategy:** Canary rollout

```
Time 0:   Deploy new revision, route 5% traffic to LATEST, 95% to CURRENT
Time 5m:  Monitor canary health, then route 25% to LATEST, 75% to CURRENT
Time 10m: Health check passes, route 50% to LATEST, 50% to CURRENT
Time 15m: Route 100% traffic to LATEST
```

**Deployment Details:**
```bash
gcloud run deploy lingolive-api \
  --image=us-central1-docker.pkg.dev/lingolive-ia-f5778/images/lingolive:SHA \
  --platform=managed \
  --region=us-central1 \
  --memory=2Gi \
  --cpu=2 \
  --timeout=900 \
  --max-instances=50 \
  --min-instances=5 \
  --set-env-vars=NODE_ENV=production,LOG_LEVEL=info
```

**Features:**
- 50 max concurrent instances (vs 10 for staging)
- 5 minimum warm instances (for faster cold starts)
- Info logging (less verbose than debug)

**Post-deployment:** Slack notification, service URL displayed

#### Job 6: Notify on Success

**Runs after:** Build and test succeed

**Notification:** Posts comment on PR: "✅ All checks passed! Ready for deployment."

### 5.3 Secrets Configuration

Required GitHub secrets:

```
WIF_PROVIDER              # Workload Identity Federation provider
WIF_SERVICE_ACCOUNT       # GCP service account email
SLACK_WEBHOOK_URL         # Slack webhook for notifications
```

#### Setup via Google Cloud

```bash
# 1. Create service account
gcloud iam service-accounts create github-actions \
  --project=lingolive-ia-f5778

# 2. Grant Cloud Run permissions
gcloud projects add-iam-policy-binding lingolive-ia-f5778 \
  --member=serviceAccount:github-actions@lingolive-ia-f5778.iam.gserviceaccount.com \
  --role=roles/run.admin

# 3. Grant Artifact Registry permissions
gcloud projects add-iam-policy-binding lingolive-ia-f5778 \
  --member=serviceAccount:github-actions@lingolive-ia-f5778.iam.gserviceaccount.com \
  --role=roles/artifactregistry.writer

# 4. Setup Workload Identity Federation
gcloud iam workload-identity-pools create "github" \
  --project="lingolive-ia-f5778" \
  --location="global" \
  --display-name="GitHub Actions"

# Store WIF_PROVIDER and WIF_SERVICE_ACCOUNT in GitHub secrets
```

### 5.4 Testing the Pipeline

#### Local Testing

```bash
# Typecheck
npm run typecheck

# Run tests
npm run test:ci

# Check linting
npm run lint

# Build Docker image locally
docker build -t lingolive:test .

# Test Docker startup
docker run --rm -p 3000:3000 lingolive:test
```

#### GitHub Actions Dry Run

1. Push to `claude/continue-previous-work-xogmfi` branch
2. Observe workflow in Actions tab
3. Verify all jobs complete successfully

#### Staging Deployment Test

1. Ensure test + build jobs pass
2. Check Cloud Run for staging deployment
3. Test API endpoints:
   ```bash
   curl https://lingolive-api-staging-XXXX.run.app/api/service-health
   ```

#### Production Deployment Test

1. Merge PR to `main`
2. Observe canary deployment progression
3. Monitor traffic shift at 5m, 10m, 15m marks
4. Verify production health:
   ```bash
   curl https://api.lingolive.com/api/service-health
   ```

### 5.5 Monitoring & Rollback

#### Cloud Run Monitoring

```bash
# View deployment history
gcloud run releases list --service=lingolive-api --region=us-central1

# Get service URL
gcloud run services describe lingolive-api --region=us-central1

# View logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=lingolive-api" --limit 100

# View traffic distribution
gcloud run services describe lingolive-api --region=us-central1 --format="value(status.traffic)"
```

#### Rollback Procedure

If canary deployment fails:

```bash
# Immediately rollback all traffic to previous revision
gcloud run services update-traffic lingolive-api \
  --to-revisions=LATEST=0,CURRENT=100 \
  --region=us-central1

# Or revert to specific revision
gcloud run services update-traffic lingolive-api \
  --to-revisions=<previous-revision-id>=100 \
  --region=us-central1
```

#### Slack Alerts

Configure Slack notifications in workflow:
- ✅ Successful deployments (staging + production)
- ❌ Failed tests or builds
- 🔄 Canary deployment progress

---

## Execution Checklist

### Before First Deployment

- [ ] Firestore security rules reviewed
- [ ] Service account created with correct permissions
- [ ] Workload Identity Federation configured
- [ ] GitHub secrets added (WIF_PROVIDER, WIF_SERVICE_ACCOUNT, SLACK_WEBHOOK_URL)
- [ ] Docker image builds locally
- [ ] Environment variables set correctly

### After Database Setup

- [ ] Firestore collections created (firebase firestore:indexes)
- [ ] Security rules deployed (firebase deploy --only firestore:rules)
- [ ] Indexes ready (check "Ready" status)
- [ ] Test data inserted

### After First Test Run

- [ ] All tests pass locally (npm run test:ci)
- [ ] Coverage >80% (npm run test:coverage)
- [ ] No TypeScript errors (npm run typecheck)
- [ ] Linting passes (npm run lint)

### After First Staging Deploy

- [ ] API responds on staging URL
- [ ] Endpoints return valid responses
- [ ] Logs show no errors
- [ ] Slack notification sent

### After First Production Deploy

- [ ] Canary traffic shifts as expected
- [ ] Error rate <0.1%
- [ ] Response time <200ms (p99)
- [ ] Full traffic routed to new version
- [ ] Monitoring dashboards show healthy service

---

## Post-Deployment

### Monitoring Setup

```bash
# Create Cloud Monitoring dashboard
gcloud monitoring dashboards create --config='{
  "displayName": "LingoLive API",
  "mosaicLayout": {
    "columns": 12,
    "tiles": [
      {
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Request Rate",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type=cloud_run_revision AND resource.labels.service_name=lingolive-api"
                }
              }
            }]
          }
        }
      }
    ]
  }
}'
```

### Alert Configuration

```bash
# Alert on error rate >1%
gcloud alpha monitoring policies create \
  --notification-channels=SLACK_CHANNEL_ID \
  --display-name="LingoLive API Error Rate High" \
  --condition-display-name="Error rate > 1%" \
  --condition-threshold-value=0.01
```

### Runbook

Create a runbook at `docs/RUNBOOK.md` covering:
- Common error codes and fixes
- Scaling procedures
- Emergency rollback
- Data migration procedures
