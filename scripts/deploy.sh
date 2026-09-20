#!/bin/bash
set -e

# LingoLive Server Deployment Script
# Usage: ./scripts/deploy.sh [staging|production] [image-tag]

ENVIRONMENT=${1:-staging}
IMAGE_TAG=${2:-latest}
REGION=${3:-us-central1}
PROJECT_ID=$(gcloud config get-value project)

echo "🚀 Deploying LingoLive Server to $ENVIRONMENT"
echo "   Environment: $ENVIRONMENT"
echo "   Image Tag: $IMAGE_TAG"
echo "   Region: $REGION"
echo "   Project: $PROJECT_ID"

# Step 1: Build Docker image
echo ""
echo "📦 Step 1: Building Docker image..."
docker build \
  -t gcr.io/$PROJECT_ID/lingolive-server:$IMAGE_TAG \
  -t gcr.io/$PROJECT_ID/lingolive-server:latest \
  --build-arg NODE_ENV=$ENVIRONMENT \
  .

# Step 2: Push to Container Registry
echo ""
echo "☁️  Step 2: Pushing to Google Container Registry..."
docker push gcr.io/$PROJECT_ID/lingolive-server:$IMAGE_TAG
docker push gcr.io/$PROJECT_ID/lingolive-server:latest

# Step 3: Deploy to Cloud Run
echo ""
echo "🌩️  Step 3: Deploying to Cloud Run..."
gcloud run deploy lingolive-server-$ENVIRONMENT \
  --image gcr.io/$PROJECT_ID/lingolive-server:$IMAGE_TAG \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 3600 \
  --max-instances 100 \
  --min-instances 1 \
  --set-env-vars NODE_ENV=$ENVIRONMENT

# Step 4: Get service URL
SERVICE_URL=$(gcloud run services describe lingolive-server-$ENVIRONMENT \
  --region $REGION --format='value(status.url)')

echo ""
echo "✅ Deployment complete!"
echo "Service URL: $SERVICE_URL"

# Step 5: Run health check
echo ""
echo "🏥 Step 4: Running health check..."
sleep 5

HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" $SERVICE_URL/api/service-health)
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Health check passed!"
  echo "Response: $BODY"
else
  echo "❌ Health check failed with status $HTTP_CODE"
  echo "Response: $BODY"
  exit 1
fi

echo ""
echo "🎉 Deployment successful!"
