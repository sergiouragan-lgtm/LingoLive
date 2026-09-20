#!/bin/bash

# LingoLive Server Health Check Script
# Monitors endpoint availability and performance
# Usage: ./scripts/health-check.sh [staging|production]

ENVIRONMENT=${1:-staging}
REGION=${2:-us-central1}
CHECK_INTERVAL=${3:-30}

SERVICE="lingolive-server-$ENVIRONMENT"

echo "🏥 LingoLive Health Check Monitor"
echo "Environment: $ENVIRONMENT"
echo "Check Interval: ${CHECK_INTERVAL}s"
echo "Started: $(date)"
echo ""

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE \
  --region $REGION --format='value(status.url)' 2>/dev/null)

if [ -z "$SERVICE_URL" ]; then
  echo "❌ Could not find service URL for $SERVICE"
  exit 1
fi

echo "Service URL: $SERVICE_URL"
echo ""

# Health check loop
CONSECUTIVE_FAILURES=0
MAX_CONSECUTIVE_FAILURES=3

while true; do
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
  
  # Check health endpoint
  RESPONSE=$(curl -s -w "\n%{http_code}\n%{time_total}" \
    "$SERVICE_URL/api/service-health" 2>&1)
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n2 | head -n1)
  RESPONSE_TIME=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n-2)
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ $TIMESTAMP - Health: OK (${RESPONSE_TIME}s)"
    CONSECUTIVE_FAILURES=0
  else
    CONSECUTIVE_FAILURES=$((CONSECUTIVE_FAILURES + 1))
    echo "⚠️  $TIMESTAMP - Health: FAILED (HTTP $HTTP_CODE) [Attempt $CONSECUTIVE_FAILURES/$MAX_CONSECUTIVE_FAILURES]"
    
    if [ $CONSECUTIVE_FAILURES -ge $MAX_CONSECUTIVE_FAILURES ]; then
      echo ""
      echo "🚨 ALERT: Service down for $CONSECUTIVE_FAILURES consecutive checks!"
      echo "Last response: $BODY"
      echo ""
      echo "Attempting automatic recovery..."
      
      # Optional: trigger alert notification
      gcloud logging write lingolive-health-check \
        "Service health check failed: $BODY" \
        --severity=ERROR \
        --resource=cloud_run_revision
    fi
  fi
  
  # Check additional metrics
  echo "   Response time: ${RESPONSE_TIME}s"
  
  # Alert if response time is high
  if (( $(echo "$RESPONSE_TIME > 3.0" | bc -l) )); then
    echo "   ⚠️  Slow response detected! Investigating..."
  fi
  
  sleep $CHECK_INTERVAL
done
