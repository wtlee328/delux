# CI/CD Setup Checklist

Use this checklist to set up automated deployments from GitHub to GCP.

## Prerequisites

- [ ] GCP project created and configured
- [ ] Backend deployed to Cloud Run
- [ ] Frontend deployed to Firebase Hosting
- [ ] GitHub repository with code pushed
- [ ] `gcloud` CLI installed and authenticated
- [ ] Admin access to GitHub repository

## Setup Steps

### 1. Create Service Accounts

- [ ] Run setup script: `cd .github && ./setup-cicd.sh`
- [ ] Note the output (you'll need it for GitHub secrets)
- [ ] Verify service accounts created:
  ```bash
  gcloud iam service-accounts list | grep github-actions
  gcloud iam service-accounts list | grep firebase-github-actions
  ```

### 2. Configure GitHub Secrets

Go to: `https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions`

Add these 10 secrets:

- [ ] `GCP_PROJECT_ID` - Your GCP project ID
- [ ] `GCP_SA_KEY` - Contents of `github-actions-key.json` (entire JSON)
- [ ] `FIREBASE_SERVICE_ACCOUNT` - Contents of `firebase-github-actions-key.json` (entire JSON)
- [ ] `SQL_INSTANCE_NAME` - Cloud SQL instance name (e.g., `delux-plus-db`)
- [ ] `DB_NAME` - Database name (e.g., `delux_plus`)
- [ ] `DB_USER` - Database user (e.g., `delux_admin`)
- [ ] `GCS_BUCKET_NAME` - Storage bucket name (e.g., `delux-plus-products`)
- [ ] `SERVICE_ACCOUNT_EMAIL` - Backend service account email
- [ ] `BACKEND_URL` - Backend Cloud Run URL (e.g., `https://delux-plus-backend-xxx.a.run.app`)
- [ ] `FRONTEND_URL` - Frontend Firebase URL (e.g., `https://your-project.web.app`)

**Tip:** Copy-paste directly from the setup script output!

### 3. Security Cleanup

- [ ] Delete local key files:
  ```bash
  rm .github/github-actions-key.json
  rm .github/firebase-github-actions-key.json
  ```
- [ ] Verify files are deleted: `ls .github/*.json`
- [ ] Ensure `.gitignore` includes `*.json` in `.github/` directory

### 4. Test Deployment

#### Test Backend Deployment

- [ ] Make a small change to backend:
  ```bash
  echo "// CI/CD test" >> backend/src/index.ts
  ```
- [ ] Commit and push:
  ```bash
  git add backend/src/index.ts
  git commit -m "test: backend CI/CD"
  git push origin main
  ```
- [ ] Go to GitHub Actions tab and watch workflow
- [ ] Verify workflow completes successfully (green checkmark)
- [ ] Test backend health endpoint:
  ```bash
  curl https://your-backend-url.a.run.app/health
  ```

#### Test Frontend Deployment

- [ ] Make a small change to frontend:
  ```bash
  echo "// CI/CD test" >> frontend/src/App.tsx
  ```
- [ ] Commit and push:
  ```bash
  git add frontend/src/App.tsx
  git commit -m "test: frontend CI/CD"
  git push origin main
  ```
- [ ] Go to GitHub Actions tab and watch workflow
- [ ] Verify workflow completes successfully
- [ ] Visit frontend URL and verify it loads

### 5. Verify Configuration

- [ ] Check backend deployment:
  ```bash
  gcloud run services describe delux-plus-backend --region=asia-east1
  ```
- [ ] Check frontend deployment:
  ```bash
  firebase hosting:releases:list
  ```
- [ ] Verify both services are accessible
- [ ] Test a complete user flow (login, create product, etc.)

### 6. Documentation

- [ ] Update team documentation with CI/CD process
- [ ] Share GitHub Actions URL with team
- [ ] Document rollback procedures
- [ ] Add deployment notifications (optional)

## Verification

After setup, verify everything works:

### GitHub Actions

- [ ] Workflows appear in Actions tab
- [ ] Workflows have correct triggers
- [ ] Secrets are configured (check workflow runs for "secret not found" errors)

### Deployments

- [ ] Backend deploys successfully
- [ ] Frontend deploys successfully
- [ ] Health checks pass
- [ ] Application works end-to-end

### Security

- [ ] No key files in repository
- [ ] Service accounts have minimal permissions
- [ ] Secrets are encrypted in GitHub
- [ ] Audit logs enabled in GCP

## Troubleshooting

### If Backend Deployment Fails

- [ ] Check GitHub Actions logs for errors
- [ ] Verify `GCP_SA_KEY` secret is correct (entire JSON)
- [ ] Verify service account has Cloud Run Admin role
- [ ] Check Cloud Run logs: `gcloud run services logs read delux-plus-backend`
- [ ] Verify Docker build works locally: `cd backend && docker build .`

### If Frontend Deployment Fails

- [ ] Check GitHub Actions logs for errors
- [ ] Verify `FIREBASE_SERVICE_ACCOUNT` secret is correct
- [ ] Verify `BACKEND_URL` secret is set
- [ ] Check Firebase project ID matches
- [ ] Test build locally: `cd frontend && npm run build`

### If Tests Fail

- [ ] Run tests locally: `npm test`
- [ ] Check for missing dependencies
- [ ] Verify test environment variables
- [ ] Check for breaking changes in dependencies

### If Secrets Are Missing

- [ ] Re-run setup script: `.github/setup-cicd.sh`
- [ ] Copy output to GitHub secrets
- [ ] Verify secret names match exactly (case-sensitive)
- [ ] Check for extra spaces in secret values

## Post-Setup Tasks

### Immediate

- [ ] Test rollback procedure
- [ ] Set up branch protection on `main`
- [ ] Configure PR review requirements
- [ ] Test manual workflow dispatch

### Within 1 Week

- [ ] Monitor deployment costs
- [ ] Set up billing alerts
- [ ] Configure deployment notifications
- [ ] Document for team members

### Within 1 Month

- [ ] Review and optimize workflows
- [ ] Set up staging environment
- [ ] Schedule service account key rotation
- [ ] Review security audit logs

## Maintenance Schedule

### Weekly

- [ ] Review deployment logs
- [ ] Check for failed workflows
- [ ] Monitor resource usage

### Monthly

- [ ] Review costs
- [ ] Update dependencies
- [ ] Check for security updates
- [ ] Review access permissions

### Quarterly

- [ ] Rotate service account keys
- [ ] Review and update workflows
- [ ] Audit security settings
- [ ] Update documentation

## Success Criteria

You've successfully set up CI/CD when:

✅ Pushing to `main` automatically deploys  
✅ Deployments complete in 3-5 minutes  
✅ Health checks pass after deployment  
✅ Application works correctly after deployment  
✅ Team members can deploy by pushing code  
✅ Rollback procedures are documented and tested  
✅ No secrets are committed to repository  
✅ Deployment logs are accessible and monitored  

## Resources

- [Quick Start Guide](QUICK-START.md)
- [Complete Setup Guide](CICD-SETUP.md)
- [CI/CD Summary](../CICD-SUMMARY.md)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Cloud Run Docs](https://cloud.google.com/run/docs)
- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review GitHub Actions logs
3. Check GCP service logs
4. Consult the detailed setup guide
5. Check GitHub Actions community forums

## Notes

Use this space for project-specific notes:

---

**Setup completed by:** ________________  
**Date:** ________________  
**Verified by:** ________________  
**Date:** ________________
