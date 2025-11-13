# Delux+ Deployment Guide

Complete guide for deploying the Delux+ B2B2B travel platform to Google Cloud Platform.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                             │
└────────────┬────────────────────────────────┬───────────────┘
             │                                 │
             │                                 │
    ┌────────▼────────┐              ┌────────▼────────┐
    │ Firebase Hosting │              │   Cloud Run     │
    │   (Frontend)     │              │   (Backend)     │
    └──────────────────┘              └────────┬────────┘
                                               │
                                    ┌──────────┴──────────┐
                                    │                     │
                           ┌────────▼────────┐  ┌────────▼────────┐
                           │   Cloud SQL     │  │ Cloud Storage   │
                           │  (PostgreSQL)   │  │   (Images)      │
                           └─────────────────┘  └─────────────────┘
```

## Prerequisites

### Required Tools

- **gcloud CLI**: [Install Guide](https://cloud.google.com/sdk/docs/install)
- **Firebase CLI**: `npm install -g firebase-tools`
- **Docker**: [Install Guide](https://docs.docker.com/get-docker/)
- **Node.js**: Version 18 or higher
- **Git**: For version control

### GCP Setup

1. Create a GCP project
2. Enable billing
3. Enable required APIs:
```bash
gcloud services enable \
    sqladmin.googleapis.com \
    storage.googleapis.com \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    secretmanager.googleapis.com
```

## Deployment Steps

### Step 1: Configure Environment Variables

Set these environment variables for all deployment scripts:

```bash
export GCP_PROJECT_ID="your-project-id"
export GCP_REGION="asia-east1"
export SQL_INSTANCE_NAME="delux-plus-db"
export GCS_BUCKET_NAME="delux-plus-products"
export GCS_LOCATION="asia-east1"
export DB_NAME="delux_plus"
export DB_USER="delux_admin"
```

### Step 2: Setup Cloud SQL

Create and configure PostgreSQL database:

```bash
cd deployment
chmod +x gcloud-sql-setup.sh
./gcloud-sql-setup.sh
```

**Important:** Save the database credentials securely!

See [README-SQL.md](./README-SQL.md) for detailed instructions.

### Step 3: Setup Cloud Storage

Create storage bucket for product images:

```bash
chmod +x gcloud-storage-setup.sh
./gcloud-storage-setup.sh
```

Move the generated key file:
```bash
mv gcs-keyfile.json ../backend/gcs-keyfile.json
```

See [README-STORAGE.md](./README-STORAGE.md) for detailed instructions.

### Step 4: Run Database Migrations

Connect to Cloud SQL and run migrations:

```bash
# Setup Cloud SQL Proxy
chmod +x cloud-sql-proxy-setup.sh
./cloud-sql-proxy-setup.sh

# Start proxy in background
./cloud_sql_proxy --port 5432 PROJECT_ID:REGION:INSTANCE_NAME &

# Set environment variables
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=delux_plus
export DB_USER=delux_admin
export DB_PASSWORD="your-password"

# Run migrations
chmod +x run-migrations.sh
./run-migrations.sh

# Stop proxy
pkill cloud_sql_proxy
```

### Step 5: Setup Secrets

Store sensitive configuration in Secret Manager:

```bash
chmod +x setup-secrets.sh
./setup-secrets.sh
```

You'll be prompted for:
- Database password
- JWT secret (or auto-generate)

### Step 6: Deploy Backend

Deploy Express backend to Cloud Run:

```bash
chmod +x deploy-backend.sh
export SERVICE_ACCOUNT_EMAIL="delux-plus-storage-sa@${GCP_PROJECT_ID}.iam.gserviceaccount.com"
./deploy-backend.sh
```

Test the deployment:
```bash
SERVICE_URL=$(gcloud run services describe delux-plus-backend \
    --region=asia-east1 \
    --format="value(status.url)")
curl $SERVICE_URL/health
```

See [README-CLOUDRUN.md](./README-CLOUDRUN.md) for detailed instructions.

### Step 7: Deploy Frontend

Deploy React frontend to Firebase Hosting:

```bash
chmod +x deploy-frontend.sh
export BACKEND_URL="https://your-backend-url.a.run.app"
./deploy-frontend.sh
```

See [README-FIREBASE.md](./README-FIREBASE.md) for detailed instructions.

### Step 8: Update CORS Configuration

Update backend CORS to allow frontend domain:

```bash
HOSTING_URL="https://${GCP_PROJECT_ID}.web.app"

# Update Cloud Run
gcloud run services update delux-plus-backend \
    --region=asia-east1 \
    --set-env-vars="CORS_ORIGIN=$HOSTING_URL"

# Update Cloud Storage CORS
# Edit cors-config.json to add hosting URL
gcloud storage buckets update gs://${GCS_BUCKET_NAME} \
    --cors-file=cors-config.json
```

### Step 9: Seed Initial Data

Create the initial admin user and optionally test data:

```bash
chmod +x seed-production.sh
./seed-production.sh
```

This script will:
1. Create the initial admin user
2. Optionally create test data (suppliers, agencies, sample products)
3. Display credentials securely

**Alternative: Manual seeding via backend scripts**

```bash
# Connect via Cloud SQL Proxy
./cloud_sql_proxy --port 5432 PROJECT_ID:REGION:INSTANCE_NAME &

# Set environment variables
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=delux_plus
export DB_USER=delux_admin
export DB_PASSWORD="your-password"

# Create admin user
cd ../backend
npm run seed:admin

# Optionally create test data
npm run seed:test
```

**Important Security Notes:**
- Save admin credentials immediately in a password manager
- Change the default password after first login
- Never commit credentials to version control
- See [../backend/SEEDING.md](../backend/SEEDING.md) for detailed instructions

### Step 10: Verify Deployment

Test the complete system:

1. **Frontend Access**
   - Visit: `https://your-project-id.web.app`
   - Login page loads

2. **Backend Health**
   - Visit: `https://your-backend-url.a.run.app/health`
   - Returns: `{"status":"ok"}`

3. **Database Connection**
   - Login with admin credentials
   - Navigate to user management

4. **Storage Integration**
   - Create a supplier account
   - Upload a product with image
   - Verify image displays

## Quick Deployment Script

For subsequent deployments, use this script:

```bash
#!/bin/bash
# quick-deploy.sh

set -e

echo "=== Deploying Delux+ Platform ==="

# Deploy backend
cd deployment
./deploy-backend.sh

# Deploy frontend
./deploy-frontend.sh

echo "=== Deployment Complete ==="
```

## Environment-Specific Configuration

### Development

```bash
# Backend (.env)
NODE_ENV=development
DB_HOST=localhost
CORS_ORIGIN=http://localhost:5173

# Frontend (.env)
VITE_API_BASE_URL=http://localhost:3000
```

### Production

```bash
# Backend (Cloud Run env vars)
NODE_ENV=production
DB_HOST=/cloudsql/PROJECT:REGION:INSTANCE
CORS_ORIGIN=https://your-project-id.web.app

# Frontend (.env.production)
VITE_API_BASE_URL=https://your-backend-url.a.run.app
```

## Monitoring and Maintenance

### View Logs

```bash
# Backend logs
gcloud run services logs tail delux-plus-backend --region=asia-east1

# Frontend logs (via Firebase Console)
firebase hosting:releases:list
```

### Monitor Resources

```bash
# Cloud SQL
gcloud sql operations list --instance=delux-plus-db

# Cloud Storage
gcloud storage du gs://delux-plus-products --summarize

# Cloud Run
gcloud run services describe delux-plus-backend --region=asia-east1
```

### Database Backups

```bash
# Manual backup
gcloud sql backups create --instance=delux-plus-db

# List backups
gcloud sql backups list --instance=delux-plus-db

# Restore
gcloud sql backups restore BACKUP_ID --backup-instance=delux-plus-db
```

## Troubleshooting

### Backend Won't Start

1. Check logs: `gcloud run services logs read delux-plus-backend`
2. Verify environment variables
3. Test database connection
4. Check service account permissions

### Frontend Can't Connect to Backend

1. Verify CORS configuration
2. Check backend URL in `.env.production`
3. Test backend health endpoint
4. Check browser console for errors

### Database Connection Fails

1. Verify Cloud SQL instance is running
2. Check connection string format
3. Verify service account has `cloudsql.client` role
4. Test with Cloud SQL Proxy

### Image Upload Fails

1. Check service account permissions
2. Verify bucket exists
3. Check CORS configuration
4. Test direct upload to bucket

## Security Checklist

- [ ] Database passwords stored in Secret Manager
- [ ] JWT secret stored in Secret Manager
- [ ] Service account key file not committed to git
- [ ] CORS configured for specific domains only
- [ ] Cloud SQL uses private IP
- [ ] Storage bucket has appropriate IAM policies
- [ ] Cloud Run service uses least-privilege service account
- [ ] Environment variables don't contain secrets
- [ ] Audit logging enabled
- [ ] Regular security updates scheduled

## Cost Estimation

### Monthly Costs (Estimated)

**Development/Testing:**
- Cloud SQL (db-f1-micro): ~$10
- Cloud Storage (10 GB): ~$0.26
- Cloud Run (minimal traffic): ~$0-5
- Firebase Hosting (free tier): $0
- **Total: ~$10-15/month**

**Production (Low Traffic):**
- Cloud SQL (db-n1-standard-1): ~$50
- Cloud Storage (50 GB): ~$1.30
- Cloud Run (moderate traffic): ~$20-50
- Firebase Hosting (paid tier): ~$5-10
- **Total: ~$75-110/month**

### Cost Optimization Tips

1. Use Cloud SQL proxy for development
2. Scale Cloud Run to zero when idle
3. Optimize image sizes
4. Use appropriate storage classes
5. Set up billing alerts

## Rollback Procedures

### Backend Rollback

```bash
# List revisions
gcloud run revisions list --service=delux-plus-backend --region=asia-east1

# Rollback to previous
gcloud run services update-traffic delux-plus-backend \
    --region=asia-east1 \
    --to-revisions=PREVIOUS_REVISION=100
```

### Frontend Rollback

```bash
firebase hosting:rollback
```

### Database Rollback

```bash
# Restore from backup
gcloud sql backups restore BACKUP_ID --backup-instance=delux-plus-db
```

## CI/CD Setup

See individual README files for CI/CD integration examples:
- [Backend CI/CD](./README-CLOUDRUN.md#cicd-integration)
- [Frontend CI/CD](./README-FIREBASE.md#cicd-integration)

## Support and Resources

### Documentation

- [Cloud SQL Guide](./README-SQL.md)
- [Cloud Storage Guide](./README-STORAGE.md)
- [Cloud Run Guide](./README-CLOUDRUN.md)
- [Firebase Hosting Guide](./README-FIREBASE.md)

### GCP Resources

- [Cloud Console](https://console.cloud.google.com)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud Storage Documentation](https://cloud.google.com/storage/docs)
- [Firebase Console](https://console.firebase.google.com)

## Next Steps

After successful deployment:

1. **Create test accounts** for each role (admin, supplier, agency)
2. **Test complete workflows** (product creation → review → discovery)
3. **Set up monitoring** and alerts
4. **Configure custom domain** (optional)
5. **Implement CI/CD** for automated deployments
6. **Schedule regular backups**
7. **Plan scaling strategy** based on usage

## Maintenance Schedule

### Daily
- Monitor error logs
- Check service health

### Weekly
- Review resource usage
- Check backup status
- Update dependencies (if needed)

### Monthly
- Review costs
- Security updates
- Performance optimization
- Backup verification

## Contact

For deployment issues or questions, refer to:
- GCP Support (if you have a support plan)
- Firebase Support
- Project documentation
- Team lead or DevOps engineer
