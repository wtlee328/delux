#!/bin/bash

# Delux+ Backend Deployment to Cloud Run

set -e

# Configuration variables
PROJECT_ID="${GCP_PROJECT_ID:-}"
SERVICE_NAME="${CLOUD_RUN_SERVICE:-delux-plus-backend}"
REGION="${GCP_REGION:-asia-east1}"
SQL_INSTANCE="${SQL_INSTANCE_NAME:-delux-plus-db}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud CLI is not installed"
    exit 1
fi

# Get project ID from gcloud if not set
if [ -z "$PROJECT_ID" ]; then
    PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
    if [ -z "$PROJECT_ID" ]; then
        echo "Error: GCP_PROJECT_ID not set and no default project configured"
        echo "Run: export GCP_PROJECT_ID='your-project-id'"
        echo "Or: gcloud config set project your-project-id"
        exit 1
    fi
fi

IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"
SERVICE_ACCOUNT="${SERVICE_ACCOUNT_EMAIL:-delux-plus-storage-sa@${PROJECT_ID}.iam.gserviceaccount.com}"

echo "=== Delux+ Backend Deployment ==="
echo "Project: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo "Image: $IMAGE_NAME"
echo ""

# Check if deploying to production and ensure code is pushed
if [[ "$PROJECT_ID" == *"prod"* ]]; then
    echo "⚠️  PRODUCTION DEPLOYMENT DETECTED"
    
    # Check for uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        echo "Error: You have uncommitted changes. Please commit and push to main before deploying to production."
        exit 1
    fi
    
    # Check for unpushed commits
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    if [ "$CURRENT_BRANCH" != "main" ]; then
        echo "Error: You are not on the 'main' branch. Production deployment must happen from 'main'."
        exit 1
    fi
    
    UNPUSHED=$(git cherry -v origin/main 2>/dev/null || echo "")
    if [ -n "$UNPUSHED" ]; then
        echo "Error: You have unpushed commits. Please push to origin/main before deploying to production."
        exit 1
    fi
    
    echo "✅ Git state is clean and pushed. Proceeding with production deployment..."
fi

# Set the project
echo "Setting GCP project..."
gcloud config set project "$PROJECT_ID"

# Navigate to backend directory
cd "$(dirname "$0")/../backend"

# Build and push Docker image
echo "Building Docker image..."
gcloud builds submit --tag "$IMAGE_NAME" .

# Get Cloud SQL connection name
SQL_CONNECTION=$(gcloud sql instances describe "$SQL_INSTANCE" --format="value(connectionName)")

echo "Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
    --image="$IMAGE_NAME" \
    --region="$REGION" \
    --platform=managed \
    --allow-unauthenticated \
    --service-account="$SERVICE_ACCOUNT" \
    --add-cloudsql-instances="$SQL_CONNECTION" \
    --set-env-vars="NODE_ENV=production" \
    --set-env-vars="DB_HOST=/cloudsql/$SQL_CONNECTION" \
    --set-env-vars="DB_PORT=5432" \
    --set-env-vars="DB_NAME=${DB_NAME:-delux_plus}" \
    --set-env-vars="DB_USER=${DB_USER:-delux_admin}" \
    --set-env-vars="GCS_PROJECT_ID=$PROJECT_ID" \
    --set-env-vars="GCS_BUCKET_NAME=${GCS_BUCKET_NAME:-delux-plus-products}" \
    --set-env-vars="CORS_ORIGIN=${CORS_ORIGIN:-http://localhost:5173}" \
    --set-secrets="DB_PASSWORD=delux-db-password:latest" \
    --set-secrets="JWT_SECRET=delux-jwt-secret:latest" \
    --set-env-vars="CORS_ORIGIN=${CORS_ORIGIN:-*}" \
    --memory=512Mi \
    --cpu=1 \
    --timeout=300 \
    --concurrency=80 \
    --min-instances=0 \
    --max-instances=10

# Get service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format="value(status.url)")

echo ""
echo "=== Deployment Complete ==="
echo "Service URL: $SERVICE_URL"
echo "Health Check: $SERVICE_URL/health"
echo ""
echo "Test the deployment:"
echo "  curl $SERVICE_URL/health"
echo ""
echo "View logs:"
echo "  gcloud run services logs read $SERVICE_NAME --region=$REGION"
