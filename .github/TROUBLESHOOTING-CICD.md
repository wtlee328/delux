# CI/CD Troubleshooting Guide

## Issue: Workflows Are Failing

Based on your diagnostic output, workflows are running but failing. Here's how to fix it.

### Problem Identified

The error message is:
```
google-github-actions/auth failed with: the GitHub Action workflow must specify 
exactly one of "workload_identity_provider" or "credentials_json"
```

This means the `GCP_SA_KEY` secret is either:
- Not set in GitHub
- Set with wrong name
- Empty/invalid

### Solution: Verify and Fix Secrets

#### Step 1: Test Secrets Configuration

```bash
# Push the test workflow
git add .github/workflows/test-secrets.yml
git commit -m "ci: add secrets test workflow"
git push origin main

# Run the test manually
# Go to: https://github.com/wtlee328/delux/actions/workflows/test-secrets.yml
# Click "Run workflow"
```

This will show you which secrets are missing.

#### Step 2: Check GitHub Secrets

Go to: https://github.com/wtlee328/delux/settings/secrets/actions

You should see 10 secrets:
- [ ] `GCP_PROJECT_ID`
- [ ] `GCP_SA_KEY`
- [ ] `FIREBASE_SERVICE_ACCOUNT`
- [ ] `SQL_INSTANCE_NAME`
- [ ] `DB_NAME`
- [ ] `DB_USER`
- [ ] `GCS_BUCKET_NAME`
- [ ] `SERVICE_ACCOUNT_EMAIL`
- [ ] `BACKEND_URL`
- [ ] `FRONTEND_URL`

#### Step 3: Re-run Setup Script

If secrets are missing, run the setup script again:

```bash
cd .github
./setup-cicd.sh
```

This will:
1. Create service accounts (if needed)
2. Generate new keys
3. Display all secret values

#### Step 4: Add/Update Secrets in GitHub

For each secret from the script output:

1. Go to: https://github.com/wtlee328/delux/settings/secrets/actions
2. Click "New repository secret" (or "Update" if it exists)
3. Name: Exact name from list above
4. Value: Copy from script output
5. Click "Add secret"

**IMPORTANT for JSON secrets (`GCP_SA_KEY` and `FIREBASE_SERVICE_ACCOUNT`):**
- Copy the ENTIRE JSON including `{` and `}`
- Don't add extra spaces or newlines
- Should start with `{` and end with `}`

#### Step 5: Delete Key Files

After adding secrets:
```bash
rm .github/github-actions-key.json
rm .github/firebase-github-actions-key.json
```

#### Step 6: Test Deployment

Make a small change to trigger deployment:

```bash
# Backend test
echo "// CI/CD test" >> backend/src/index.ts
git add backend/src/index.ts
git commit -m "test: trigger backend deployment"
git push origin main

# Watch at: https://github.com/wtlee328/delux/actions
```

## Common Issues

### Issue 1: "Secret not found"

**Symptom:** Workflow fails with secret not found error

**Solution:**
1. Check secret name matches exactly (case-sensitive)
2. Verify secret is set in repository (not organization)
3. Re-add the secret

### Issue 2: "Invalid credentials_json"

**Symptom:** Auth step fails with invalid JSON

**Solution:**
1. Verify you copied the ENTIRE JSON
2. Check for extra spaces/newlines
3. Regenerate the key:
   ```bash
   cd .github
   ./setup-cicd.sh
   ```
4. Copy the new JSON to GitHub secrets

### Issue 3: "Permission denied" during deployment

**Symptom:** Deployment fails with permission errors

**Solution:**
1. Verify service account has correct roles:
   ```bash
   gcloud projects get-iam-policy YOUR_PROJECT_ID \
       --flatten="bindings[].members" \
       --filter="bindings.members:serviceAccount:github-actions@*"
   ```

2. Re-run setup script to grant permissions:
   ```bash
   cd .github
   ./setup-cicd.sh
   ```

### Issue 4: "Permission denied on secret" - Secret Manager Access

**Symptom:** Cloud Run deployment fails with:
```
Permission denied on secret: projects/XXX/secrets/db-password/versions/latest 
for Revision service account XXX. The service account used must be granted 
the 'Secret Manager Secret Accessor' role
```

**Root Cause:** The Cloud Run service account doesn't have permission to access Secret Manager secrets.

**Solution:**

Run the fix script:
```bash
cd .github
./fix-secret-permissions.sh
```

Or manually grant the role:
```bash
gcloud projects add-iam-policy-binding delux-plus-prod \
  --member="serviceAccount:delux-plus-storage-sa@delux-plus-prod.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

**Verify the fix:**
```bash
# Check if the service account has the role
gcloud projects get-iam-policy delux-plus-prod \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:delux-plus-storage-sa@*"
```

**Then redeploy:**
```bash
# Trigger a new deployment by pushing a commit
git commit --allow-empty -m "chore: trigger redeployment after fixing permissions"
git push origin main
```

### Issue 5: Workflows don't trigger

**Symptom:** No workflows run when you push

**Solution:**
1. Check if workflows are enabled:
   - Go to: https://github.com/wtlee328/delux/settings/actions
   - Ensure "Allow all actions and reusable workflows" is selected

2. Check branch protection rules don't block Actions

3. Verify you're pushing to `main` branch:
   ```bash
   git branch --show-current
   ```

4. Make changes in `backend/` or `frontend/` directories

### Issue 6: "Resource not found" errors

**Symptom:** Deployment fails because Cloud Run service or SQL instance not found

**Solution:**
1. Verify resources exist:
   ```bash
   # Check Cloud Run
   gcloud run services list
   
   # Check Cloud SQL
   gcloud sql instances list
   
   # Check Storage bucket
   gcloud storage buckets list
   ```

2. Update secrets with correct names

3. If resources don't exist, deploy manually first:
   ```bash
   cd deployment
   ./deploy-backend.sh
   ./deploy-frontend.sh
   ```

## Debugging Workflow Failures

### View Detailed Logs

```bash
# List recent runs
gh run list --limit 10

# View specific run
gh run view RUN_ID --log

# View failed jobs only
gh run list --status failure --limit 5
```

### Check Specific Steps

1. Go to: https://github.com/wtlee328/delux/actions
2. Click on the failed workflow run
3. Click on the failed job
4. Expand each step to see detailed logs
5. Look for red ❌ marks

### Common Error Patterns

**"Secret not found"**
→ Add the missing secret in GitHub settings

**"Invalid JSON"**
→ Re-copy the service account key JSON

**"Permission denied"**
→ Re-run setup script to grant IAM roles

**"Resource not found"**
→ Verify resource names in secrets match actual GCP resources

**"Quota exceeded"**
→ Check GCP quotas and billing

## Manual Deployment (Fallback)

If CI/CD continues to fail, you can deploy manually:

```bash
# Backend
cd deployment
./deploy-backend.sh

# Frontend
./deploy-frontend.sh
```

## Getting Help

### Collect Debug Information

When asking for help, provide:

1. **Workflow run URL:**
   ```
   https://github.com/wtlee328/delux/actions/runs/RUN_ID
   ```

2. **Error message:**
   Copy the specific error from the logs

3. **Secrets status:**
   Run the test-secrets workflow and share results

4. **GCP resources:**
   ```bash
   gcloud run services list
   gcloud sql instances list
   gcloud storage buckets list
   ```

### Useful Commands

```bash
# Check workflow status
gh run list --limit 5

# View logs
gh run view --log

# Re-run failed workflow
gh run rerun RUN_ID

# List secrets (names only, not values)
gh secret list

# Test GCP authentication locally
gcloud auth list
gcloud config get-value project
```

## Prevention

To avoid future issues:

1. ✅ **Test secrets after adding** - Run test-secrets workflow
2. ✅ **Keep keys secure** - Delete local key files immediately
3. ✅ **Document changes** - Update this guide if you find new issues
4. ✅ **Monitor workflows** - Check Actions tab after each push
5. ✅ **Rotate keys regularly** - Every 90 days

## Quick Fix Checklist

When workflows fail:

- [ ] Run diagnostic script: `.github/diagnose-cicd.sh`
- [ ] Run test-secrets workflow
- [ ] Check GitHub Actions tab for error messages
- [ ] Verify all 10 secrets are set
- [ ] Verify secret values are correct (especially JSON secrets)
- [ ] Check GCP resources exist
- [ ] Verify service account permissions
- [ ] Try manual deployment as fallback
- [ ] Check GCP billing and quotas

## Success Criteria

Workflows are working when:

✅ Test-secrets workflow passes  
✅ Backend deployment completes successfully  
✅ Frontend deployment completes successfully  
✅ Health check passes after backend deployment  
✅ Application works correctly after deployment  

## Next Steps

Once workflows are passing:

1. Test with a real feature change
2. Set up branch protection rules
3. Configure deployment notifications
4. Document the process for your team
5. Set up staging environment (optional)

---

**Still having issues?** Check the main setup guide: [CICD-SETUP.md](./CICD-SETUP.md)
