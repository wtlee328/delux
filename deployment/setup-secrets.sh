#!/bin/bash

# Setup Google Cloud Secret Manager for sensitive configuration

set -e

PROJECT_ID="${GCP_PROJECT_ID:-}"

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

echo "=== Setting up Secret Manager ==="
echo "Project: $PROJECT_ID"
echo ""

# Set the project
gcloud config set project "$PROJECT_ID"

# Enable Secret Manager API
echo "Enabling Secret Manager API..."
gcloud services enable secretmanager.googleapis.com

# Create DB_PASSWORD secret
echo ""
echo "Creating DB_PASSWORD secret..."
echo "Enter the database password:"
read -s DB_PASSWORD
echo -n "$DB_PASSWORD" | gcloud secrets create delux-db-password \
    --data-file=- \
    --replication-policy="automatic" \
    || echo "Secret may already exist. Updating..."

if [ $? -ne 0 ]; then
    echo -n "$DB_PASSWORD" | gcloud secrets versions add delux-db-password \
        --data-file=-
fi

# Create JWT_SECRET secret
echo ""
echo "Creating JWT_SECRET secret..."
echo "Enter the JWT secret (or press Enter to generate one):"
read -s JWT_SECRET

if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo "Generated JWT secret"
fi

echo -n "$JWT_SECRET" | gcloud secrets create delux-jwt-secret \
    --data-file=- \
    --replication-policy="automatic" \
    || echo "Secret may already exist. Updating..."

if [ $? -ne 0 ]; then
    echo -n "$JWT_SECRET" | gcloud secrets versions add delux-jwt-secret \
        --data-file=-
fi

# Grant access to Cloud Run service account
SERVICE_ACCOUNT="${SERVICE_ACCOUNT_EMAIL:-delux-plus-storage-sa@${PROJECT_ID}.iam.gserviceaccount.com}"

echo ""
echo "Granting secret access to service account..."
gcloud secrets add-iam-policy-binding delux-db-password \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding delux-jwt-secret \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor"

echo ""
echo "=== Setup Complete ==="
echo "Secrets created:"
echo "  - delux-db-password"
echo "  - delux-jwt-secret"
echo ""
echo "Service account $SERVICE_ACCOUNT has access to these secrets"
