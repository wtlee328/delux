# CI/CD Setup Guide

This guide explains how to set up automated deployments from GitHub to Google Cloud Platform.

## Overview

The CI/CD pipeline automatically deploys your application when you push to the `main` branch:

- **Backend**: Builds Docker image → Pushes to GCR → Deploys to Cloud Run
- **Frontend**: Builds React app → Deploys to Firebase Hosting
- **Tests**: Runs on all pushes and pull requests

## Prerequisites

- GitHub repository with your code
- GCP project with services enabled
- Firebase project initialized
- Admin access to both GitHub and GCP

## Setup Steps

### 1. Create GCP Service Account

Create a service account with necessary permissions for deployment:

```bash
# Set your project ID
export GCP_PROJECT_ID="your-project-id"

# Create service account
gcloud iam service-accounts create github-actions \
    --display-name="GitHub Actions Deployment" \
    --project=$GCP_PROJECT_ID

# Get service account email
export SA_EMAIL="github-actions@${GCP_PROJECT_ID}.iam.gserviceaccount.com"

# Grant necessary roles
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/cloudsql.client"

# Create and download key
gcloud iam service-accounts keys create github-actions-key.json \
    --iam-account=$SA_EMAIL

# Display the key (you'll need this for GitHub secrets)
cat github-actions-key.json
```

**Important:** Save this key securely and delete the local file after adding to GitHub secrets.

### 2. Create Firebase Service Account

```bash
# Go to Firebase Console
# Project Settings → Service Accounts → Generate New Private Key

# Or use gcloud:
gcloud iam service-accounts create firebase-github-actions \
    --display-name="Firebase GitHub Actions" \
    --project=$GCP_PROJECT_ID

export FIREBASE_SA_EMAIL="firebase-github-actions@${GCP_PROJECT_ID}.iam.gserviceaccount.com"

# Grant Firebase Admin role
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
    --member="serviceAccount:${FIREBASE_SA_EMAIL}" \
    --role="roles/firebase.admin"

# Create key
gcloud iam service-accounts keys create firebase-github-actions-key.json \
    --iam-account=$FIREBASE_SA_EMAIL

cat firebase-github-actions-key.json
```

### 3. Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add the following secrets:

#### Required Secrets

| Secret Name | Description | Example/How to Get |
|-------------|-------------|-------------------|
| `GCP_PROJECT_ID` | Your GCP project ID | `delux-plus-prod` |
| `GCP_SA_KEY` | GCP service account key (JSON) | Contents of `github-actions-key.json` |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase service account key (JSON) | Contents of `firebase-github-actions-key.json` |
| `SQL_INSTANCE_NAME` | Cloud SQL instance name | `delux-plus-db` |
| `DB_NAME` | Database name | `delux_plus` |
| `DB_USER` | Database user | `delux_admin` |
| `GCS_BUCKET_NAME` | Storage bucket name | `delux-plus-products` |
| `SERVICE_ACCOUNT_EMAIL` | Backend service account email | `delux-plus-storage-sa@PROJECT.iam.gserviceaccount.com` |
| `BACKEND_URL` | Backend Cloud Run URL | `https://delux-plus-backend-xxx.a.run.app` |
| `FRONTEND_URL` | Frontend Firebase URL | `https://your-project.web.app` |

#### How to Get Values

```bash
# Get backend URL
gcloud run services describe delux-plus-backend \
    --region=asia-east1 \
    --format="value(status.url)"

# Get service account email
gcloud iam service-accounts list --filter="delux-plus-storage"

# Get SQL instance name
gcloud sql instances list --format="value(name)"
```

### 4. Test the Workflows

#### Test Backend Deployment

```bash
# Make a change to backend
echo "// Test change" >> backend/src/index.ts

# Commit and push
git add backend/src/index.ts
git commit -m "test: trigger backend deployment"
git push origin main

# Watch the workflow
# Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/actions
```

#### Test Frontend Deployment

```bash
# Make a change to frontend
echo "// Test change" >> frontend/src/App.tsx

# Commit and push
git add frontend/src/App.tsx
git commit -m "test: trigger frontend deployment"
git push origin main
```

### 5. Verify Deployments

After pushing, check:

1. **GitHub Actions Tab**: See workflow progress
2. **Cloud Run Console**: Verify new backend revision
3. **Firebase Console**: Verify new hosting deployment
4. **Application URLs**: Test the deployed apps

## Workflow Details

### Backend Deployment Workflow

**Triggers:**
- Push to `main` branch with changes in `backend/` directory
- Manual trigger via GitHub Actions UI

**Steps:**
1. Checkout code
2. Authenticate to GCP
3. Build Docker image
4. Push to Google Container Registry
5. Deploy to Cloud Run
6. Test health endpoint

**Duration:** ~3-5 minutes

### Frontend Deployment Workflow

**Triggers:**
- Push to `main` branch with changes in `frontend/` directory
- Manual trigger via GitHub Actions UI

**Steps:**
1. Checkout code
2. Install dependencies
3. Create production environment file
4. Build React application
5. Deploy to Firebase Hosting

**Duration:** ~2-3 minutes

### Test Workflow

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**Steps:**
1. Run backend tests
2. Run frontend tests
3. Verify builds succeed

**Duration:** ~2-4 minutes

## Manual Deployment

You can manually trigger deployments from GitHub:

1. Go to Actions tab
2. Select the workflow (Deploy Backend or Deploy Frontend)
3. Click "Run workflow"
4. Select branch and click "Run workflow"

## Troubleshooting

### Deployment Fails with "Permission Denied"

**Solution:** Verify service account has correct roles:

```bash
gcloud projects get-iam-policy $GCP_PROJECT_ID \
    --flatten="bindings[].members" \
    --filter="bindings.members:serviceAccount:github-actions@*"
```

### "Secret not found" Error

**Solution:** Verify all required secrets are set in GitHub:

```bash
# List secrets (names only, not values)
gh secret list
```

### Backend Health Check Fails

**Solution:** Check Cloud Run logs:

```bash
gcloud run services logs read delux-plus-backend \
    --region=asia-east1 \
    --limit=50
```

### Frontend Build Fails

**Solution:** Check if `BACKEND_URL` secret is set correctly:

```bash
# Verify in GitHub UI or using gh CLI
gh secret list | grep BACKEND_URL
```

### Docker Build Fails

**Solution:** Test build locally:

```bash
cd backend
docker build -t test-build .
```

### Firebase Deployment Fails

**Solution:** Verify Firebase service account permissions:

```bash
gcloud projects get-iam-policy $GCP_PROJECT_ID \
    --flatten="bindings[].members" \
    --filter="bindings.members:serviceAccount:firebase-github-actions@*"
```

## Advanced Configuration

### Deploy to Staging Environment

Create a separate workflow for staging:

```yaml
# .github/workflows/deploy-staging.yml
on:
  push:
    branches:
      - develop
```

Update secrets for staging environment:
- `STAGING_GCP_PROJECT_ID`
- `STAGING_BACKEND_URL`
- etc.

### Add Deployment Notifications

Add Slack/Discord notifications:

```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Add Database Migrations

Add migration step before backend deployment:

```yaml
- name: Run Migrations
  run: |
    # Start Cloud SQL Proxy
    wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O cloud_sql_proxy
    chmod +x cloud_sql_proxy
    ./cloud_sql_proxy -instances=${{ secrets.GCP_PROJECT_ID }}:${{ env.GCP_REGION }}:${{ secrets.SQL_INSTANCE_NAME }}=tcp:5432 &
    
    # Wait for proxy
    sleep 5
    
    # Run migrations
    cd backend
    npm run migrate
```

### Add Rollback Capability

Create a rollback workflow:

```yaml
# .github/workflows/rollback.yml
name: Rollback Deployment

on:
  workflow_dispatch:
    inputs:
      revision:
        description: 'Revision to rollback to'
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    steps:
      - name: Rollback Cloud Run
        run: |
          gcloud run services update-traffic delux-plus-backend \
            --to-revisions=${{ github.event.inputs.revision }}=100 \
            --region=asia-east1
```

## Security Best Practices

1. **Rotate Service Account Keys** regularly (every 90 days)
2. **Use least privilege** - only grant necessary permissions
3. **Never commit secrets** to repository
4. **Enable branch protection** on `main` branch
5. **Require PR reviews** before merging
6. **Use environment-specific secrets** for staging/production
7. **Monitor deployment logs** for suspicious activity
8. **Enable audit logging** in GCP

## Monitoring Deployments

### View Deployment History

```bash
# Backend (Cloud Run)
gcloud run revisions list \
    --service=delux-plus-backend \
    --region=asia-east1

# Frontend (Firebase)
firebase hosting:releases:list
```

### Check Deployment Status

```bash
# Backend
gcloud run services describe delux-plus-backend \
    --region=asia-east1 \
    --format="value(status.conditions)"

# Frontend
firebase hosting:sites:get $GCP_PROJECT_ID
```

### View Logs

```bash
# Backend logs
gcloud run services logs tail delux-plus-backend --region=asia-east1

# GitHub Actions logs
gh run list --limit 10
gh run view RUN_ID --log
```

## Cost Optimization

- Workflows run on GitHub-hosted runners (free for public repos, limited for private)
- Consider self-hosted runners for private repos with high usage
- Use caching to speed up builds and reduce costs
- Set up deployment schedules for non-critical environments

## Next Steps

After setting up CI/CD:

1. ✅ Test deployments with small changes
2. ✅ Set up branch protection rules
3. ✅ Configure deployment notifications
4. ✅ Document deployment process for team
5. ✅ Set up staging environment (optional)
6. ✅ Configure automated rollbacks (optional)
7. ✅ Set up monitoring and alerts

## Support

For issues with:
- **GitHub Actions**: Check [GitHub Actions documentation](https://docs.github.com/en/actions)
- **Cloud Run**: Check [Cloud Run documentation](https://cloud.google.com/run/docs)
- **Firebase Hosting**: Check [Firebase documentation](https://firebase.google.com/docs/hosting)

## Cleanup

To remove CI/CD setup:

```bash
# Delete service accounts
gcloud iam service-accounts delete github-actions@${GCP_PROJECT_ID}.iam.gserviceaccount.com
gcloud iam service-accounts delete firebase-github-actions@${GCP_PROJECT_ID}.iam.gserviceaccount.com

# Delete GitHub secrets (via UI or gh CLI)
gh secret delete GCP_SA_KEY
gh secret delete FIREBASE_SERVICE_ACCOUNT
# ... delete other secrets

# Delete workflow files
rm -rf .github/workflows/
```
