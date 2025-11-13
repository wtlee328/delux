# Cloud Run Deployment Guide

This guide covers deploying the Delux+ backend to Google Cloud Run.

## Prerequisites

- Google Cloud Platform account
- `gcloud` CLI installed and authenticated
- Docker installed (for local testing)
- Cloud SQL instance configured
- Cloud Storage bucket configured
- Cloud Build API enabled
- Cloud Run API enabled
- Secret Manager API enabled

## Architecture Overview

```
Internet → Cloud Run → Cloud SQL (via Unix socket)
                    → Cloud Storage (via service account)
```

## Step 1: Setup Secrets

Store sensitive configuration in Secret Manager:

```bash
cd deployment
chmod +x setup-secrets.sh
export GCP_PROJECT_ID="your-project-id"
./setup-secrets.sh
```

You'll be prompted to enter:
- Database password
- JWT secret (or auto-generate)

## Step 2: Configure Environment Variables

The deployment script will set these environment variables:

**Automatically Set:**
- `NODE_ENV=production`
- `DB_HOST=/cloudsql/PROJECT:REGION:INSTANCE`
- `DB_PORT=5432`
- `GCS_PROJECT_ID=your-project-id`

**From Secrets:**
- `DB_PASSWORD` (from Secret Manager)
- `JWT_SECRET` (from Secret Manager)

**You Need to Set:**
```bash
export GCP_PROJECT_ID="your-project-id"
export GCP_REGION="asia-east1"
export SQL_INSTANCE_NAME="delux-plus-db"
export DB_NAME="delux_plus"
export DB_USER="delux_admin"
export GCS_BUCKET_NAME="delux-plus-products"
export SERVICE_ACCOUNT_EMAIL="delux-plus-storage-sa@your-project-id.iam.gserviceaccount.com"
```

## Step 3: Deploy Backend

Run the deployment script:

```bash
chmod +x deploy-backend.sh
./deploy-backend.sh
```

The script will:
1. Build Docker image using Cloud Build
2. Push image to Container Registry
3. Deploy to Cloud Run with proper configuration
4. Connect to Cloud SQL via Unix socket
5. Attach service account for Cloud Storage access
6. Configure secrets from Secret Manager

## Step 4: Run Database Migrations

After deployment, run migrations against Cloud SQL:

```bash
# Option 1: Via Cloud SQL Proxy (recommended for first-time setup)
./cloud_sql_proxy --port 5432 PROJECT_ID:REGION:INSTANCE_NAME &
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=delux_plus
export DB_USER=delux_admin
export DB_PASSWORD="your-password"
./run-migrations.sh

# Option 2: Via Cloud Run Job (for automated migrations)
# See "Automated Migrations" section below
```

## Step 5: Verify Deployment

Test the health endpoint:

```bash
SERVICE_URL=$(gcloud run services describe delux-plus-backend \
    --region=asia-east1 \
    --format="value(status.url)")

curl $SERVICE_URL/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Step 6: Update Frontend Configuration

Update frontend environment to point to Cloud Run:

```env
VITE_API_BASE_URL=https://delux-plus-backend-xxxxx-xx.a.run.app
```

## Local Testing with Docker

Test the Docker image locally before deploying:

```bash
cd backend

# Build image
docker build -t delux-plus-backend .

# Run container
docker run -p 8080:8080 \
    -e PORT=8080 \
    -e NODE_ENV=development \
    -e DB_HOST=host.docker.internal \
    -e DB_PORT=5432 \
    -e DB_NAME=delux_plus \
    -e DB_USER=delux_admin \
    -e DB_PASSWORD=your_password \
    -e JWT_SECRET=your_jwt_secret \
    -e GCS_PROJECT_ID=your-project-id \
    -e GCS_BUCKET_NAME=delux-plus-products \
    -e GCS_KEYFILE_PATH=./gcs-keyfile.json \
    -v $(pwd)/gcs-keyfile.json:/app/gcs-keyfile.json \
    delux-plus-backend

# Test
curl http://localhost:8080/health
```

## Configuration Details

### Service Account Permissions

The service account needs:
- `roles/cloudsql.client` - Connect to Cloud SQL
- `roles/storage.objectAdmin` - Upload/manage images
- `roles/secretmanager.secretAccessor` - Access secrets

Grant permissions:
```bash
gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
    --role="roles/cloudsql.client"
```

### Cloud SQL Connection

Cloud Run connects to Cloud SQL via Unix socket:
- Connection string: `/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME`
- No need for Cloud SQL Proxy
- Automatic connection pooling
- Secure private connection

### Resource Limits

Current configuration:
- **Memory:** 512Mi (sufficient for Node.js app)
- **CPU:** 1 (1 vCPU)
- **Timeout:** 300s (5 minutes)
- **Concurrency:** 80 requests per instance
- **Min instances:** 0 (scales to zero)
- **Max instances:** 10

Adjust based on load:
```bash
gcloud run services update delux-plus-backend \
    --region=asia-east1 \
    --memory=1Gi \
    --cpu=2 \
    --max-instances=20
```

## Monitoring and Logging

### View Logs

```bash
# Real-time logs
gcloud run services logs tail delux-plus-backend --region=asia-east1

# Recent logs
gcloud run services logs read delux-plus-backend --region=asia-east1 --limit=50
```

### View Metrics

```bash
# Service details
gcloud run services describe delux-plus-backend --region=asia-east1

# Revisions
gcloud run revisions list --service=delux-plus-backend --region=asia-east1
```

### Cloud Console

- Logs: Cloud Run → Service → Logs tab
- Metrics: Cloud Run → Service → Metrics tab
- Revisions: Cloud Run → Service → Revisions tab

## Automated Migrations

Create a Cloud Run Job for migrations:

```bash
# Build migration image
gcloud builds submit --tag gcr.io/PROJECT_ID/delux-plus-migrations \
    --config=cloudbuild-migrations.yaml

# Create job
gcloud run jobs create delux-plus-migrations \
    --image=gcr.io/PROJECT_ID/delux-plus-migrations \
    --region=asia-east1 \
    --service-account=SERVICE_ACCOUNT_EMAIL \
    --add-cloudsql-instances=SQL_CONNECTION \
    --set-env-vars="DB_HOST=/cloudsql/SQL_CONNECTION" \
    --set-secrets="DB_PASSWORD=delux-db-password:latest"

# Run migrations
gcloud run jobs execute delux-plus-migrations --region=asia-east1
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      
      - name: Deploy
        run: |
          cd deployment
          export GCP_PROJECT_ID=${{ secrets.GCP_PROJECT_ID }}
          ./deploy-backend.sh
```

## Rollback

Rollback to previous revision:

```bash
# List revisions
gcloud run revisions list --service=delux-plus-backend --region=asia-east1

# Rollback
gcloud run services update-traffic delux-plus-backend \
    --region=asia-east1 \
    --to-revisions=REVISION_NAME=100
```

## Troubleshooting

### Container Fails to Start

Check logs:
```bash
gcloud run services logs read delux-plus-backend --region=asia-east1
```

Common issues:
- Missing environment variables
- Database connection failure
- Port not set correctly (must use $PORT)

### Database Connection Errors

Verify:
- Cloud SQL instance is running
- Service account has `cloudsql.client` role
- Connection name is correct
- Database credentials are correct

### Image Upload Fails

Verify:
- Service account has storage permissions
- Bucket exists and is accessible
- CORS is configured correctly

### High Latency

Consider:
- Increasing min instances to avoid cold starts
- Increasing memory/CPU allocation
- Optimizing database queries
- Adding connection pooling

## Security Best Practices

1. **Use Secret Manager** - Never hardcode secrets
2. **Limit IAM permissions** - Grant minimum required roles
3. **Enable VPC** - Use VPC connector for private resources
4. **Set up Cloud Armor** - Protect against DDoS
5. **Enable audit logging** - Track all access
6. **Use HTTPS only** - Cloud Run enforces this by default
7. **Implement rate limiting** - Protect API endpoints
8. **Regular updates** - Keep dependencies updated

## Cost Optimization

- **Scale to zero** - No charges when idle
- **Right-size resources** - Start small, scale as needed
- **Use min instances wisely** - Only if cold starts are critical
- **Monitor usage** - Set up billing alerts
- **Use committed use discounts** - For predictable workloads

## Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Connections](https://cloud.google.com/sql/docs/postgres/connect-run)
- [Secret Manager](https://cloud.google.com/secret-manager/docs)
- [Best Practices](https://cloud.google.com/run/docs/best-practices)
