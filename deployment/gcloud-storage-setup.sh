#!/bin/bash

# Delux+ Google Cloud Storage Setup Script
# This script creates and configures a storage bucket for product images

set -e

# Configuration variables
PROJECT_ID="${GCP_PROJECT_ID:-}"
BUCKET_NAME="${GCS_BUCKET_NAME:-delux-plus-products}"
LOCATION="${GCS_LOCATION:-asia-east1}"
STORAGE_CLASS="STANDARD"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud CLI is not installed"
    echo "Install from: https://cloud.google.com/sdk/docs/install"
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

echo "=== Delux+ Cloud Storage Setup ==="
echo "Project: $PROJECT_ID"
echo "Bucket: $BUCKET_NAME"
echo "Location: $LOCATION"
echo ""

# Set the project
echo "Setting GCP project..."
gcloud config set project "$PROJECT_ID"

# Create storage bucket
echo "Creating storage bucket..."
gcloud storage buckets create "gs://$BUCKET_NAME" \
    --location="$LOCATION" \
    --default-storage-class="$STORAGE_CLASS" \
    --uniform-bucket-level-access \
    || echo "Bucket may already exist"

# Set public read access for all objects
echo "Configuring public read access..."
gcloud storage buckets add-iam-policy-binding "gs://$BUCKET_NAME" \
    --member=allUsers \
    --role=roles/storage.objectViewer

# Configure CORS for frontend uploads
echo "Configuring CORS..."
cat > /tmp/cors-config.json <<EOF
[
  {
    "origin": ["http://localhost:5173", "https://*.web.app", "https://*.firebaseapp.com"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"],
    "maxAgeSeconds": 3600
  }
]
EOF

gcloud storage buckets update "gs://$BUCKET_NAME" \
    --cors-file=/tmp/cors-config.json

rm /tmp/cors-config.json

# Set lifecycle policy (optional - for cleanup)
echo "Setting lifecycle policy..."
cat > /tmp/lifecycle-config.json <<EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {
          "type": "Delete"
        },
        "condition": {
          "age": 365,
          "matchesPrefix": ["temp/"]
        }
      }
    ]
  }
}
EOF

gcloud storage buckets update "gs://$BUCKET_NAME" \
    --lifecycle-file=/tmp/lifecycle-config.json

rm /tmp/lifecycle-config.json

# Create service account for backend access
SERVICE_ACCOUNT_NAME="delux-plus-storage-sa"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "Creating service account..."
gcloud iam service-accounts create "$SERVICE_ACCOUNT_NAME" \
    --display-name="Delux+ Storage Service Account" \
    --description="Service account for Delux+ backend to access Cloud Storage" \
    || echo "Service account may already exist"

# Grant storage admin role to service account
echo "Granting storage permissions..."
gcloud storage buckets add-iam-policy-binding "gs://$BUCKET_NAME" \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role=roles/storage.objectAdmin

# Create and download service account key
KEY_FILE="gcs-keyfile.json"
echo "Creating service account key..."
gcloud iam service-accounts keys create "$KEY_FILE" \
    --iam-account="$SERVICE_ACCOUNT_EMAIL"

echo ""
echo "=== Setup Complete ==="
echo "Bucket Name: $BUCKET_NAME"
echo "Bucket URL: https://storage.googleapis.com/$BUCKET_NAME"
echo "Service Account: $SERVICE_ACCOUNT_EMAIL"
echo "Key File: $KEY_FILE"
echo ""
echo "IMPORTANT: Move the key file to a secure location!"
echo "  mv $KEY_FILE ../backend/gcs-keyfile.json"
echo ""
echo "Update your backend .env file:"
echo "  GCS_PROJECT_ID=$PROJECT_ID"
echo "  GCS_BUCKET_NAME=$BUCKET_NAME"
echo "  GCS_KEYFILE_PATH=./gcs-keyfile.json"
echo ""
echo "For Cloud Run, use the service account directly (no key file needed)"
