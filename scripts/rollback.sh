#!/bin/bash
set -e

# LingoLive Server Rollback Script
# Reverts to the previous Cloud Run revision
# Usage: ./scripts/rollback.sh [staging|production]

ENVIRONMENT=${1:-staging}
REGION=${2:-us-central1}

echo "⏮️  Rolling back LingoLive Server ($ENVIRONMENT) to previous revision..."

# Get the current service
SERVICE="lingolive-server-$ENVIRONMENT"

# List the last 2 revisions
echo ""
echo "📋 Recent revisions:"
gcloud run revisions list \
  --service=$SERVICE \
  --region=$REGION \
  --limit=5 \
  --format='table(REVISION,ACTIVE,DEPLOY_TIME,IMAGE)'

# Get the previous revision (second in the list)
PREVIOUS_REVISION=$(gcloud run revisions list \
  --service=$SERVICE \
  --region=$REGION \
  --limit=2 \
  --format='value(REVISION)' | tail -n1)

if [ -z "$PREVIOUS_REVISION" ]; then
  echo "❌ Could not find previous revision!"
  exit 1
fi

echo ""
echo "⏮️  Rolling back to revision: $PREVIOUS_REVISION"

# Update traffic to previous revision
gcloud run services update-traffic $SERVICE \
  --region=$REGION \
  --to-revisions=$PREVIOUS_REVISION=100

echo ""
echo "✅ Rollback complete!"
echo "Service: $SERVICE"
echo "Revision: $PREVIOUS_REVISION"

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE \
  --region $REGION --format='value(status.url)')

echo "URL: $SERVICE_URL"

# Health check
echo ""
echo "🏥 Running health check..."
sleep 5

curl -s $SERVICE_URL/api/service-health | jq . || echo "Health check failed"
