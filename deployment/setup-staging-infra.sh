#!/bin/bash
set -ex

PROJECT_ID="delux-plus-staging-488508"
REGION="asia-east1"
SQL_INSTANCE="delux-plus-db-staging"
DB_NAME="delux_plus_staging"
DB_USER="delux_admin"
DB_PASSWORD="!Redsoxno1"
BUCKET_NAME="delux-plus-products-staging"
SERVICE_ACCOUNT_NAME="delux-plus-storage-sa"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
JWT_SECRET=$(openssl rand -base64 32)
BACKEND_SERVICE="delux-plus-backend-staging"

echo "Setting project to $PROJECT_ID..."
gcloud config set project "$PROJECT_ID"

echo "Enabling services..."
gcloud services enable sqladmin.googleapis.com secretmanager.googleapis.com run.googleapis.com storage.googleapis.com cloudbuild.googleapis.com iam.googleapis.com

echo "Creating Cloud SQL instance..."
gcloud sql instances create "$SQL_INSTANCE" --database-version="POSTGRES_15" --tier="db-f1-micro" --region="$REGION" || true
gcloud sql users set-password postgres --instance="$SQL_INSTANCE" --password="$DB_PASSWORD"
gcloud sql databases create "$DB_NAME" --instance="$SQL_INSTANCE" || true
gcloud sql users create "$DB_USER" --instance="$SQL_INSTANCE" --password="$DB_PASSWORD" || true

echo "Creating Cloud Storage bucket..."
gcloud storage buckets create "gs://$BUCKET_NAME" --location="$REGION" --default-storage-class="STANDARD" --uniform-bucket-level-access || true
gcloud storage buckets add-iam-policy-binding "gs://$BUCKET_NAME" --member=allUsers --role=roles/storage.objectViewer || true

cat > /tmp/cors-config-staging.json <<EOF
[
  {
    "origin": ["http://localhost:5173", "https://delux-plus-staging-488508.web.app", "https://delux-plus-staging-488508.firebaseapp.com"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"],
    "maxAgeSeconds": 3600
  }
]
EOF
gcloud storage buckets update "gs://$BUCKET_NAME" --cors-file=/tmp/cors-config-staging.json
rm /tmp/cors-config-staging.json

echo "Creating Service Account..."
gcloud iam service-accounts create "$SERVICE_ACCOUNT_NAME" --display-name="Delux+ Storage SA" || true
# Need to wait short time for SA propagation before IAM binding
sleep 5
gcloud storage buckets add-iam-policy-binding "gs://$BUCKET_NAME" --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" --role=roles/storage.objectAdmin || true

echo "Setting up Secret Manager..."
echo -n "$DB_PASSWORD" | gcloud secrets create delux-db-password --data-file=- --replication-policy="automatic" || \
  echo -n "$DB_PASSWORD" | gcloud secrets versions add delux-db-password --data-file=-

echo -n "$JWT_SECRET" | gcloud secrets create delux-jwt-secret --data-file=- --replication-policy="automatic" || \
  echo -n "$JWT_SECRET" | gcloud secrets versions add delux-jwt-secret --data-file=-

echo "Granting secret access..."
gcloud secrets add-iam-policy-binding delux-db-password --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" --role="roles/secretmanager.secretAccessor" || true
gcloud secrets add-iam-policy-binding delux-jwt-secret --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" --role="roles/secretmanager.secretAccessor" || true

echo "Building Backend Docker image..."
IMAGE_NAME="gcr.io/${PROJECT_ID}/${BACKEND_SERVICE}"
cd backend
gcloud builds submit --tag "$IMAGE_NAME" .

echo "Deploying Backend..."
SQL_CONNECTION=$(gcloud sql instances describe "$SQL_INSTANCE" --format="value(connectionName)")
FRONTEND_URL="https://delux-plus-staging-488508.web.app"

gcloud run deploy "$BACKEND_SERVICE" \
    --image="$IMAGE_NAME" \
    --region="$REGION" \
    --platform=managed \
    --allow-unauthenticated \
    --service-account="$SERVICE_ACCOUNT_EMAIL" \
    --add-cloudsql-instances="$SQL_CONNECTION" \
    --set-env-vars="NODE_ENV=staging" \
    --set-env-vars="CORS_ORIGIN=$FRONTEND_URL" \
    --set-env-vars="DB_HOST=/cloudsql/$SQL_CONNECTION" \
    --set-env-vars="DB_PORT=5432" \
    --set-env-vars="DB_NAME=$DB_NAME" \
    --set-env-vars="DB_USER=$DB_USER" \
    --set-env-vars="GCS_PROJECT_ID=$PROJECT_ID" \
    --set-env-vars="GCS_BUCKET_NAME=$BUCKET_NAME" \
    --set-secrets="DB_PASSWORD=delux-db-password:latest" \
    --set-secrets="JWT_SECRET=delux-jwt-secret:latest" \
    --memory=512Mi \
    --cpu=1

BACKEND_URL=$(gcloud run services describe "$BACKEND_SERVICE" --region="$REGION" --format="value(status.url)")
echo "Staging Backend URL: $BACKEND_URL"

echo "Setup script completed."
