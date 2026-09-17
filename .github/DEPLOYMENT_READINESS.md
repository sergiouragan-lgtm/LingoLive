# LingoLive Deployment Readiness Status

**Last Updated:** 2026-09-17

## Overview

This document tracks the readiness of the LingoLive canary deployment pipeline (Fase 4 — GCP Cloud Run).

## Status Summary

✅ **Workflow Configuration:** Complete
✅ **GitHub Secrets:** Configured (5/5)
✅ **Repository Variables:** Enabled
⏳ **GCP Infrastructure:** Pending (blocking Fase 4)

## Configured Items

### GitHub Secrets (All Set)
- ✅ `FIREBASE_DEPLOY_TOKEN` — Firebase deployment token from `firebase login:ci`
- ✅ `GCP_PROJECT_ID` — `lingolive-ia-f5778`
- ✅ `GCP_REGION` — `us-central1`
- ✅ `GCP_SERVICE_ACCOUNT_KEY` — GCP service account JSON credentials
- ✅ `SLACK_WEBHOOK_URL` — Slack incoming webhook for deployment notifications

### Repository Variables (All Set)
- ✅ `ENABLE_PRODUCTION_DEPLOY` — `true` (gates Fase 4 execution)

### Workflow Configuration
- ✅ Fase 1: Security Audit (Gitleaks, Snyk, SonarCloud)
- ✅ Fase 2: Build & Test (React + Node.js backend)
- ✅ Fase 3: Mobile Build (Flutter — awaiting project initialization)
- ✅ Fase 4: Canary Deploy (GCP Cloud Run — awaiting infrastructure)

## Blockers for Fase 4 Execution

### 1. GCP Billing (Critical)
**Status:** ⏳ Awaiting user action

**Steps to Enable:**
```bash
# Visit the billing console
https://console.developers.google.com/billing/enable?project=lingolive-ia-f5778
```

1. Click "Enable Billing"
2. Link a billing account (or create one)
3. Wait 2-3 minutes for propagation

**Verification:**
```bash
gcloud artifacts repositories create lingolive-docker \
  --repository-format=docker \
  --location=us-central1
```

### 2. GCP Artifact Registry
**Status:** ⏳ Awaiting billing + user execution

**Command:**
```bash
gcloud artifacts repositories create lingolive-docker \
  --repository-format=docker \
  --location=us-central1
```

### 3. GCP Cloud Run Service
**Status:** ⏳ Awaiting billing + user execution

**Command:**
```bash
gcloud run deploy lingolive-canary \
  --image=us-central1-docker.pkg.dev/lingolive-ia-f5778/lingolive-docker/lingolive:latest \
  --region=us-central1 \
  --platform=managed \
  --no-allow-unauthenticated
```

## Pipeline Behavior

### When Fase 4 Executes
- ✅ Triggered on push to `main` (after Fase 1-3 pass)
- ✅ Builds & pushes Docker image to Artifact Registry
- ✅ Deploys to Cloud Run with "canary" tag (no traffic initially)
- ✅ Routes 10% traffic to canary revision
- ✅ Waits 15 minutes for observation window
- ✅ Performs health check on `/api/service-health/public`
- ✅ Promotes to 100% traffic (if health check passes)
- ✅ Auto-rollback on failure
- ✅ Sends Slack notification on failure

### When Fase 4 is Skipped
- Current state (blocked by missing `ENABLE_PRODUCTION_DEPLOY` or secrets)
- Steps: Fase 1-3 pass, Fase 4 is skipped with status `skipped`

## Next Steps

1. **Enable GCP Billing** (https://console.developers.google.com/billing/enable?project=lingolive-ia-f5778)
2. **Create Artifact Registry:**
   ```bash
   gcloud artifacts repositories create lingolive-docker \
     --repository-format=docker \
     --location=us-central1
   ```
3. **Create Cloud Run Service:**
   ```bash
   gcloud run deploy lingolive-server \
     --image=us-central1-docker.pkg.dev/lingolive-ia-f5778/lingolive-docker/lingolive:latest \
     --region=us-central1 \
     --platform=managed \
     --no-allow-unauthenticated
   ```
4. **Trigger deployment:**
   - Push a new commit to `main`, OR
   - Use GitHub Actions UI to manually trigger `workflow_dispatch`

## Monitoring

Once Fase 4 is active, monitor deployments at:
- **GitHub Actions:** https://github.com/sergiouragan-lgtm/LingoLive/actions
- **Cloud Run Console:** https://console.cloud.google.com/run?project=lingolive-ia-f5778
- **Slack:** #toda-a-empresa-uraganstudio (deployment notifications)

## Related Documentation

- `.github/workflows/devsecops.yml` — Pipeline definition
- `CLAUDE.md` — Project architecture & guidelines
- `BILLING_SETUP.md` — Billing & infrastructure setup (if exists)

---

**Maintained by:** Claude Haiku 4.5  
**Session:** https://claude.ai/code/session_01Kst9ubCJMi9f1G86NPrTpP
