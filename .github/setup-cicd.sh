#!/bin/bash

# CI/CD Setup Script for GitHub Actions → GCP
# This script creates service accounts and generates keys for GitHub Actions

set -e

echo "=========================================="
echo "GitHub Actions CI/CD Setup for Delux+"
echo "=========================================="
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI not found"
    echo "Please install: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get project ID
if [ -z "$GCP_PROJECT_ID" ]; then
    echo "Enter your GCP Project ID:"
    read GCP_PROJECT_ID
fi

echo "Using GCP Project: $GCP_PROJECT_ID"
echo ""

# Confirm
read -p "Continue with setup? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Setup cancelled"
    exit 0
fi

echo ""
echo "Step 1: Creating GitHub Actions service account..."
echo "-----------------------------------"

# Create service account for GitHub Actions
gcloud iam service-accounts create github-actions \
    --display-name="GitHub Actions Deployment" \
    --project=$GCP_PROJECT_ID \
    2>/dev/null || echo "Service account already exists"

SA_EMAIL="github-actions@${GCP_PROJECT_ID}.iam.gserviceaccount.com"

# Grant roles
echo "Granting permissions..."

gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/run.admin" \
    --quiet

gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/storage.admin" \
    --quiet

gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/iam.serviceAccountUser" \
    --quiet

gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/cloudsql.client" \
    --quiet

echo "✓ Permissions granted"

# Create key
echo "Creating service account key..."
gcloud iam service-accounts keys create github-actions-key.json \
    --iam-account=$SA_EMAIL

echo "✓ Key created: github-actions-key.json"
echo ""

echo "Step 2: Creating Firebase service account..."
echo "-----------------------------------"

# Create service account for Firebase
gcloud iam service-accounts create firebase-github-actions \
    --display-name="Firebase GitHub Actions" \
    --project=$GCP_PROJECT_ID \
    2>/dev/null || echo "Service account already exists"

FIREBASE_SA_EMAIL="firebase-github-actions@${GCP_PROJECT_ID}.iam.gserviceaccount.com"

# Grant Firebase admin role
echo "Granting Firebase permissions..."

gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
    --member="serviceAccount:${FIREBASE_SA_EMAIL}" \
    --role="roles/firebase.admin" \
    --quiet

gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
    --member="serviceAccount:${FIREBASE_SA_EMAIL}" \
    --role="roles/firebasehosting.admin" \
    --quiet

echo "✓ Permissions granted"

# Create key
echo "Creating Firebase service account key..."
gcloud iam service-accounts keys create firebase-github-actions-key.json \
    --iam-account=$FIREBASE_SA_EMAIL

echo "✓ Key created: firebase-github-actions-key.json"
echo ""

echo "Step 3: Gathering configuration values..."
echo "-----------------------------------"

# Get backend URL
BACKEND_URL=$(gcloud run services describe delux-plus-backend \
    --region=asia-east1 \
    --format="value(status.url)" 2>/dev/null || echo "NOT_DEPLOYED_YET")

# Get SQL instance
SQL_INSTANCE=$(gcloud sql instances list \
    --format="value(name)" \
    --limit=1 2>/dev/null || echo "delux-plus-db")

# Get storage bucket
GCS_BUCKET=$(gcloud storage buckets list \
    --format="value(name)" \
    --filter="name:delux-plus*" \
    --limit=1 2>/dev/null || echo "delux-plus-products")

# Get backend service account
BACKEND_SA=$(gcloud iam service-accounts list \
    --filter="displayName:Delux Plus Storage" \
    --format="value(email)" 2>/dev/null || echo "delux-plus-storage-sa@${GCP_PROJECT_ID}.iam.gserviceaccount.com")

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "📋 GitHub Secrets to Configure:"
echo "-----------------------------------"
echo ""
echo "1. Go to your GitHub repository"
echo "2. Settings → Secrets and variables → Actions"
echo "3. Add the following secrets:"
echo ""
echo "GCP_PROJECT_ID:"
echo "$GCP_PROJECT_ID"
echo ""
echo "GCP_SA_KEY:"
echo "$(cat github-actions-key.json)"
echo ""
echo "FIREBASE_SERVICE_ACCOUNT:"
echo "$(cat firebase-github-actions-key.json)"
echo ""
echo "SQL_INSTANCE_NAME:"
echo "$SQL_INSTANCE"
echo ""
echo "DB_NAME:"
echo "delux_plus"
echo ""
echo "DB_USER:"
echo "delux_admin"
echo ""
echo "GCS_BUCKET_NAME:"
echo "$GCS_BUCKET"
echo ""
echo "SERVICE_ACCOUNT_EMAIL:"
echo "$BACKEND_SA"
echo ""
echo "BACKEND_URL:"
echo "$BACKEND_URL"
echo ""
echo "FRONTEND_URL:"
echo "https://${GCP_PROJECT_ID}.web.app"
echo ""
echo "=========================================="
echo ""
echo "⚠️  CRITICAL SECURITY WARNINGS:"
echo "=========================================="
echo "1. Copy the secrets above to GitHub NOW"
echo "2. DELETE the key files IMMEDIATELY:"
echo "   rm github-actions-key.json"
echo "   rm firebase-github-actions-key.json"
echo "3. NEVER commit these files to git!"
echo "4. GitHub will BLOCK pushes with these files"
echo "5. If committed, keys must be REVOKED"
echo "=========================================="
echo ""
echo "📚 Next Steps:"
echo "-----------------------------------"
echo "1. Add secrets to GitHub (see above)"
echo "2. Push code to trigger deployment"
echo "3. Monitor deployment in GitHub Actions tab"
echo "4. Verify deployment at your URLs"
echo ""
echo "For detailed instructions, see:"
echo ".github/CICD-SETUP.md"
echo ""
