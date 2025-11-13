#!/bin/bash

# Quick Deployment Script for Delux+ Platform
# Use this for subsequent deployments after initial setup

set -e

echo "=== Delux+ Quick Deployment ==="
echo ""

# Check required environment variables
if [ -z "$GCP_PROJECT_ID" ]; then
    echo "Error: GCP_PROJECT_ID not set"
    echo "Run: export GCP_PROJECT_ID='your-project-id'"
    exit 1
fi

echo "Project: $GCP_PROJECT_ID"
echo ""

# Navigate to deployment directory
cd "$(dirname "$0")"

# Deploy backend
echo "=== Deploying Backend ==="
./deploy-backend.sh

echo ""
echo "=== Deploying Frontend ==="
./deploy-frontend.sh

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Verify deployment:"
echo "  Backend: $(gcloud run services describe delux-plus-backend --region=asia-east1 --format='value(status.url)')/health"
echo "  Frontend: https://${GCP_PROJECT_ID}.web.app"
