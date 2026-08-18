#!/bin/bash
set -e

echo "=========================================================="
echo "      LingoLIVE IA Enterprise - CI/CD Release Automation"
echo "=========================================================="

echo "[CI/CD] STEP 1: Verifying active environment configs..."
if [ ! -f "firestore.rules" ]; then
    echo "[ERROR] Security rules not found at root directory."
    exit 1
fi

echo "[CI/CD] STEP 2: Running TypeScript strict syntactic checks..."
npm run lint

echo "[CI/CD] STEP 3: Executing multi-tenant and rule unit tests..."
npm run test -- --run

echo "[CI/CD] STEP 4: Deploying Firebase Security Rules..."
firebase deploy --only firestore:rules

echo "[CI/CD] STEP 5: Deploying Composite Indexes..."
firebase deploy --only firestore:indexes

echo "[CI/CD] STEP 6: Uploading Cloud Functions..."
firebase deploy --only functions

echo "=========================================================="
echo "    Release successfully pushed to Production Cluster!"
echo "=========================================================="
