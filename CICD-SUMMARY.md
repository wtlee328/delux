# CI/CD Setup Summary

Automated deployment from GitHub to Google Cloud Platform is now configured! 🎉

## What Was Created

### GitHub Actions Workflows

1. **`.github/workflows/deploy-backend.yml`**
   - Automatically deploys backend to Cloud Run
   - Triggers on push to `main` with backend changes
   - Builds Docker image → Pushes to GCR → Deploys to Cloud Run

2. **`.github/workflows/deploy-frontend.yml`**
   - Automatically deploys frontend to Firebase Hosting
   - Triggers on push to `main` with frontend changes
   - Builds React app → Deploys to Firebase

3. **`.github/workflows/run-tests.yml`**
   - Runs tests on push/PR to `main` or `develop`
   - Validates both backend and frontend builds

### Setup Tools

1. **`.github/setup-cicd.sh`**
   - Automated script to create service accounts
   - Generates keys for GitHub Actions
   - Displays all required secrets

2. **`.github/CICD-SETUP.md`**
   - Comprehensive setup guide
   - Troubleshooting section
   - Advanced configuration options

3. **`.github/QUICK-START.md`**
   - Quick reference for common tasks
   - 5-minute setup guide
   - Common issues and solutions

## How to Set Up (Quick Version)

### Step 1: Create Service Accounts (5 minutes)

```bash
cd .github
./setup-cicd.sh
```

Follow the prompts and save the output.

### Step 2: Add GitHub Secrets (5 minutes)

1. Go to: `https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions`
2. Click "New repository secret"
3. Add each secret from the setup script output:
   - `GCP_PROJECT_ID`
   - `GCP_SA_KEY` (paste entire JSON)
   - `FIREBASE_SERVICE_ACCOUNT` (paste entire JSON)
   - `SQL_INSTANCE_NAME`
   - `DB_NAME`
   - `DB_USER`
   - `GCS_BUCKET_NAME`
   - `SERVICE_ACCOUNT_EMAIL`
   - `BACKEND_URL`
   - `FRONTEND_URL`

### Step 3: Test Deployment (2 minutes)

```bash
# Make a small change
echo "// CI/CD test" >> backend/src/index.ts

# Commit and push
git add .
git commit -m "test: CI/CD deployment"
git push origin main

# Watch deployment
# Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/actions
```

### Step 4: Clean Up (1 minute)

```bash
# Delete the key files (IMPORTANT!)
rm .github/github-actions-key.json
rm .github/firebase-github-actions-key.json
```

## How It Works

### Automatic Deployment Flow

```
┌─────────────────────────────────────────────────────────┐
│  Developer pushes to main branch                        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  GitHub Actions detects changes                         │
│  - Backend changes? → Trigger backend workflow          │
│  - Frontend changes? → Trigger frontend workflow        │
└────────────────┬────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌──────────────┐  ┌──────────────┐
│   Backend    │  │   Frontend   │
│   Workflow   │  │   Workflow   │
└──────┬───────┘  └──────┬───────┘
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ Build Docker │  │ Build React  │
│    Image     │  │     App      │
└──────┬───────┘  └──────┬───────┘
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│  Push to GCR │  │  Deploy to   │
│              │  │   Firebase   │
└──────┬───────┘  └──────┬───────┘
       │                 │
       ▼                 │
┌──────────────┐         │
│  Deploy to   │         │
│  Cloud Run   │         │
└──────┬───────┘         │
       │                 │
       ▼                 ▼
┌─────────────────────────────────────────────────────────┐
│  ✅ Deployment Complete!                                │
│  - Backend: https://backend-url.a.run.app               │
│  - Frontend: https://project-id.web.app                 │
└─────────────────────────────────────────────────────────┘
```

## Usage Examples

### Deploy Backend Only

```bash
# Make backend changes
vim backend/src/routes/products.ts

# Commit and push
git add backend/
git commit -m "feat: add product filtering"
git push origin main

# Only backend workflow runs (~3-5 min)
```

### Deploy Frontend Only

```bash
# Make frontend changes
vim frontend/src/pages/LoginPage.tsx

# Commit and push
git add frontend/
git commit -m "fix: improve login validation"
git push origin main

# Only frontend workflow runs (~2-3 min)
```

### Deploy Both

```bash
# Make changes to both
vim backend/src/routes/auth.ts
vim frontend/src/contexts/AuthContext.tsx

# Commit and push
git add .
git commit -m "feat: add password reset"
git push origin main

# Both workflows run in parallel (~5 min total)
```

### Manual Deployment

1. Go to: `https://github.com/YOUR_USERNAME/YOUR_REPO/actions`
2. Click on "Deploy Backend" or "Deploy Frontend"
3. Click "Run workflow"
4. Select branch (usually `main`)
5. Click "Run workflow" button

## Monitoring

### View Deployment Status

**GitHub Actions:**
```
https://github.com/YOUR_USERNAME/YOUR_REPO/actions
```

**Cloud Run (Backend):**
```bash
gcloud run services describe delux-plus-backend --region=asia-east1
```

**Firebase (Frontend):**
```bash
firebase hosting:releases:list
```

### View Logs

**GitHub Actions Logs:**
```bash
gh run list --limit 10
gh run view RUN_ID --log
```

**Backend Logs:**
```bash
gcloud run services logs tail delux-plus-backend --region=asia-east1
```

## Rollback

If a deployment breaks production:

### Backend
```bash
# List revisions
gcloud run revisions list --service=delux-plus-backend --region=asia-east1

# Rollback to previous
gcloud run services update-traffic delux-plus-backend \
    --to-revisions=PREVIOUS_REVISION=100 \
    --region=asia-east1
```

### Frontend
```bash
firebase hosting:rollback
```

## Security Notes

✅ **What's Secure:**
- Service account keys stored as GitHub secrets (encrypted)
- Secrets never exposed in logs
- Least privilege permissions granted
- Keys can be rotated easily

⚠️ **Important:**
- Delete local key files after setup
- Never commit keys to repository
- Rotate keys every 90 days
- Monitor deployment logs for suspicious activity

## Cost

**GitHub Actions:**
- Free for public repositories
- 2,000 minutes/month free for private repos
- $0.008/minute after that

**GCP Resources:**
- Cloud Run: Pay per request (very cheap for low traffic)
- Cloud Build: First 120 builds/day free
- Container Registry: Storage costs only

**Estimated Cost:**
- Small project: ~$0-5/month for CI/CD
- Medium project: ~$5-20/month

## Benefits

✅ **Faster Deployments**
- No manual steps
- Deploy in 3-5 minutes
- Deploy from anywhere

✅ **Fewer Errors**
- Consistent deployment process
- Automated testing
- No forgotten steps

✅ **Better Collaboration**
- Team members can deploy
- Clear deployment history
- Easy rollbacks

✅ **Improved Workflow**
- Focus on coding, not deploying
- Automatic testing on PRs
- Deploy multiple times per day

## Next Steps

After setting up CI/CD:

1. **Test thoroughly** - Deploy a few times to ensure it works
2. **Set up branch protection** - Require PR reviews before merging
3. **Add notifications** - Get Slack/Discord alerts on deployments
4. **Create staging environment** - Test before production
5. **Document for team** - Share this guide with team members
6. **Monitor costs** - Set up billing alerts
7. **Schedule key rotation** - Rotate service account keys quarterly

## Troubleshooting

### Common Issues

**"Secret not found"**
- Solution: Add the missing secret in GitHub settings

**"Permission denied"**
- Solution: Re-run `setup-cicd.sh` to grant permissions

**"Health check failed"**
- Solution: Check Cloud Run logs for backend errors

**"Build failed"**
- Solution: Test build locally first (`npm run build`)

### Get Help

- 📖 Full guide: [.github/CICD-SETUP.md](.github/CICD-SETUP.md)
- 🚀 Quick start: [.github/QUICK-START.md](.github/QUICK-START.md)
- 🐛 GitHub Issues: Report problems in your repo
- 💬 GCP Support: If you have a support plan

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Docker Documentation](https://docs.docker.com)

---

**Ready to deploy?** Push your code to `main` and watch the magic happen! ✨
