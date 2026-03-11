#!/bin/bash

# Delux+ Frontend Deployment to Firebase Hosting

set -e

# Configuration variables
PROJECT_ID="${GCP_PROJECT_ID:-}"
BACKEND_URL="${BACKEND_URL:-}"

# Check if firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "Error: Firebase CLI is not installed"
    echo "Install with: npm install -g firebase-tools"
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

echo "=== Delux+ Frontend Deployment ==="
echo "Project: $PROJECT_ID"
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

# Navigate to project root
cd "$(dirname "$0")/.."

# Update .firebaserc with project ID
echo "Configuring Firebase project..."
cat > .firebaserc <<EOF
{
  "projects": {
    "default": "$PROJECT_ID"
  }
}
EOF

# Get backend URL if not provided
if [ -z "$BACKEND_URL" ]; then
    echo "Fetching backend URL from Cloud Run..."
    BACKEND_URL=$(gcloud run services describe delux-plus-backend \
        --region=asia-east1 \
        --format="value(status.url)" 2>/dev/null || echo "")
    
    if [ -z "$BACKEND_URL" ]; then
        echo "Warning: Could not fetch backend URL automatically"
        echo "Please enter your backend URL (e.g., https://delux-plus-backend-xxxxx-xx.a.run.app):"
        read BACKEND_URL
    fi
fi

echo "Backend URL: $BACKEND_URL"

# Update production environment file
echo "Updating production environment..."
cat > frontend/.env.production <<EOF
# Production API Configuration
VITE_API_BASE_URL=$BACKEND_URL
EOF

# Navigate to frontend directory
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build production bundle
echo "Building production bundle..."
npm run build

# Navigate back to root
cd ..

# Deploy to Firebase Hosting
echo "Deploying to Firebase Hosting..."
firebase deploy --only hosting --project "$PROJECT_ID"

# Get hosting URL
HOSTING_URL=$(firebase hosting:channel:list --project "$PROJECT_ID" 2>/dev/null | grep "live" | awk '{print $2}' || echo "")

if [ -z "$HOSTING_URL" ]; then
    HOSTING_URL="https://${PROJECT_ID}.web.app"
fi

echo ""
echo "=== Deployment Complete ==="
echo "Frontend URL: $HOSTING_URL"
echo "Backend URL: $BACKEND_URL"
echo ""
echo "Update Cloud Storage CORS if needed:"
echo "  Add $HOSTING_URL to cors-config.json"
echo ""
echo "Update backend CORS_ORIGIN environment variable:"
echo "  gcloud run services update delux-plus-backend \\"
echo "    --region=asia-east1 \\"
echo "    --set-env-vars=\"CORS_ORIGIN=$HOSTING_URL\""
