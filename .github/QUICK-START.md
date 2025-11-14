# CI/CD Quick Start

Get automated deployments running in 5 minutes.

## Prerequisites

- ✅ GCP project with backend and frontend deployed
- ✅ GitHub repository with your code
- ✅ Admin access to both

## Setup (One-Time)

### 1. Run Setup Script

```bash
cd .github
./setup-cicd.sh
```

This creates service accounts and generates keys.

### 2. Add GitHub Secrets

Go to: `https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions`

Click "New repository secret" and add each secret from the script output.

**Required Secrets (10 total):**
- `GCP_PROJECT_ID`
- `GCP_SA_KEY`
- `FIREBASE_SERVICE_ACCOUNT`
- `SQL_INSTANCE_NAME`
- `DB_NAME`
- `DB_USER`
- `GCS_BUCKET_NAME`
- `SERVICE_ACCOUNT_EMAIL`
- `BACKEND_URL`
- `FRONTEND_URL`

### 3. Delete Key Files

```bash
rm github-actions-key.json
rm firebase-github-actions-key.json
```

## Usage

### Automatic Deployment

Just push to `main` branch:

```bash
git add .
git commit -m "your changes"
git push origin main
```

**What happens:**
- Changes in `backend/` → Deploys backend to Cloud Run
- Changes in `frontend/` → Deploys frontend to Firebase
- Changes in both → Deploys both

### Manual Deployment

1. Go to GitHub Actions tab
2. Select workflow (Deploy Backend or Deploy Frontend)
3. Click "Run workflow"
4. Select branch and run

### Monitor Deployment

Watch progress at:
```
https://github.com/YOUR_USERNAME/YOUR_REPO/actions
```

## Workflows

### 🚀 Deploy Backend
- **Trigger:** Push to `main` with backend changes
- **Duration:** ~3-5 minutes
- **Output:** New Cloud Run revision

### 🎨 Deploy Frontend
- **Trigger:** Push to `main` with frontend changes
- **Duration:** ~2-3 minutes
- **Output:** New Firebase Hosting deployment

### ✅ Run Tests
- **Trigger:** Push or PR to `main`/`develop`
- **Duration:** ~2-4 minutes
- **Output:** Test results

## Verify Deployment

After deployment completes:

```bash
# Check backend
curl https://your-backend-url.a.run.app/health

# Check frontend
open https://your-project-id.web.app
```

## Troubleshooting

### Deployment Fails

1. Check GitHub Actions logs
2. Verify all secrets are set correctly
3. Check GCP service account permissions

### Quick Fixes

```bash
# Re-run failed workflow
gh run rerun RUN_ID

# View logs
gh run view RUN_ID --log

# List recent runs
gh run list --limit 5
```

## Common Issues

**"Secret not found"**
→ Add missing secret in GitHub settings

**"Permission denied"**
→ Run setup script again to grant permissions

**"Health check failed"**
→ Check Cloud Run logs for backend errors

## Need Help?

- 📖 Full guide: [CICD-SETUP.md](./CICD-SETUP.md)
- 🔧 Troubleshooting: [CICD-SETUP.md#troubleshooting](./CICD-SETUP.md#troubleshooting)
- 🌐 GitHub Actions: https://docs.github.com/en/actions

## Rollback

If deployment breaks production:

### Backend Rollback
```bash
gcloud run revisions list --service=delux-plus-backend --region=asia-east1
gcloud run services update-traffic delux-plus-backend \
    --to-revisions=PREVIOUS_REVISION=100 \
    --region=asia-east1
```

### Frontend Rollback
```bash
firebase hosting:rollback
```

## Tips

- 💡 Test in a branch before merging to `main`
- 💡 Use pull requests for code review
- 💡 Monitor first few deployments closely
- 💡 Set up Slack/Discord notifications (optional)
- 💡 Keep service account keys secure

## What's Next?

- [ ] Set up staging environment
- [ ] Add deployment notifications
- [ ] Configure branch protection
- [ ] Set up automated rollbacks
- [ ] Add performance monitoring
