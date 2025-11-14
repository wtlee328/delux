#!/bin/bash

# Script to fix GitHub Actions service account permissions

set -e

echo "=========================================="
echo "Fix GitHub Actions Permissions"
echo "=========================================="
echo ""

# Get project ID
if [ -z "$GCP_PROJECT_ID" ]; then
    echo "Enter your GCP Project ID:"
    read GCP_PROJECT_ID
fi

echo "Project: $GCP_PROJECT_ID"
echo ""

SA_EMAIL="github-actions@${GCP_PROJECT_ID}.iam.gserviceaccount.com"

echo "Granting additional permissions to: $SA_EMAIL"
echo ""

# Grant Storage Admin (for GCR - Container Registry uses Cloud Storage)
echo "1. Granting Storage Admin role..."
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/storage.admin" \
    --quiet

# Grant Artifact Registry Writer (for newer GCR)
echo "2. Granting Artifact Registry Writer role..."
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/artifactregistry.writer" \
    --quiet

# Grant Cloud Build Service Account role
echo "3. Granting Cloud Build Service Account role..."
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/cloudbuild.builds.builder" \
    --quiet

# Grant Service Account User (if not already granted)
echo "4. Granting Service Account User role..."
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/iam.serviceAccountUser" \
    --quiet

# Grant Cloud Run Admin (if not already granted)
echo "5. Granting Cloud Run Admin role..."
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/run.admin" \
    --quiet

# Grant Cloud SQL Client (if not already granted)
echo "6. Granting Cloud SQL Client role..."
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/cloudsql.client" \
    --quiet

echo ""
echo "✅ Permissions granted successfully!"
echo ""
echo "=========================================="
echo "Verify Permissions"
echo "=========================================="
echo ""

# List all roles for the service account
echo "Current roles for $SA_EMAIL:"
gcloud projects get-iam-policy $GCP_PROJECT_ID \
    --flatten="bindings[].members" \
    --filter="bindings.members:serviceAccount:${SA_EMAIL}" \
    --format="table(bindings.role)"

echo ""
echo "=========================================="
echo "Next Steps"
echo "=========================================="
echo ""
echo "1. Test deployment by pushing a change:"
echo "   echo '// test' >> backend/src/index.ts"
echo "   git add backend/src/index.ts"
echo "   git commit -m 'test: trigger deployment'"
echo "   git push origin main"
echo ""
echo "2. Watch deployment:"
echo "   https://github.com/YOUR_USERNAME/YOUR_REPO/actions"
echo ""
