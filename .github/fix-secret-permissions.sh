#!/bin/bash

# Fix Secret Manager permissions for Cloud Run service account
# This script grants the Secret Manager Secret Accessor role to the service account

set -e

PROJECT_ID="delux-plus-prod"
SERVICE_ACCOUNT="delux-plus-storage-sa@delux-plus-prod.iam.gserviceaccount.com"

echo "🔧 Fixing Secret Manager permissions for Cloud Run..."
echo "Project: $PROJECT_ID"
echo "Service Account: $SERVICE_ACCOUNT"
echo ""

# Grant Secret Manager Secret Accessor role to the service account
echo "📝 Granting Secret Manager Secret Accessor role..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor" \
  --condition=None

echo ""
echo "✅ Permissions granted successfully!"
echo ""
echo "The service account can now access:"
echo "  - db-password secret"
echo "  - jwt-secret secret"
echo ""
echo "You can verify the permissions with:"
echo "  gcloud projects get-iam-policy $PROJECT_ID \\"
echo "    --flatten='bindings[].members' \\"
echo "    --filter='bindings.members:$SERVICE_ACCOUNT'"
