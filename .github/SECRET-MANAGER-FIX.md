# Secret Manager Permission Fix

## Problem

Cloud Run deployment fails with:
```
Permission denied on secret: projects/783822193090/secrets/db-password/versions/latest 
for Revision service account delux-plus-storage-sa@delux-plus-prod.iam.gserviceaccount.com. 
The service account used must be granted the 'Secret Manager Secret Accessor' role 
(roles/secretmanager.secretAccessor) at the secret, project or higher level.
```

## Root Cause

The Cloud Run service uses a service account (`delux-plus-storage-sa`) to run your application. This service account needs permission to read secrets from Secret Manager, but it doesn't have the required role.

## Quick Fix

Run this command:

```bash
cd .github
./fix-secret-permissions.sh
```

## Manual Fix

If the script doesn't work, run this command directly:

```bash
gcloud projects add-iam-policy-binding delux-plus-prod \
  --member="serviceAccount:delux-plus-storage-sa@delux-plus-prod.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## Verify the Fix

Check if the permission was granted:

```bash
gcloud projects get-iam-policy delux-plus-prod \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:delux-plus-storage-sa@*"
```

You should see output including:
```
roles/secretmanager.secretAccessor
```

## Redeploy

After fixing permissions, trigger a new deployment:

```bash
# Option 1: Make a small change and push
echo "// Permission fix" >> backend/src/index.ts
git add backend/src/index.ts
git commit -m "chore: trigger redeployment after fixing secret permissions"
git push origin main

# Option 2: Empty commit
git commit --allow-empty -m "chore: trigger redeployment after fixing permissions"
git push origin main

# Option 3: Manual deployment
cd deployment
./deploy-backend.sh
```

## Why This Happens

When you create a Cloud Run service, it uses a service account to run. This service account needs explicit permissions to access:

1. **Secret Manager** - to read database passwords and JWT secrets
2. **Cloud SQL** - to connect to the database
3. **Cloud Storage** - to store/retrieve files

The initial setup might not have granted all necessary permissions, or the service account was created after the secrets.

## Prevention

To avoid this in the future, ensure the service account has these roles:

```bash
# Secret Manager Secret Accessor
gcloud projects add-iam-policy-binding delux-plus-prod \
  --member="serviceAccount:delux-plus-storage-sa@delux-plus-prod.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Cloud SQL Client
gcloud projects add-iam-policy-binding delux-plus-prod \
  --member="serviceAccount:delux-plus-storage-sa@delux-plus-prod.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

# Storage Object Admin (for file uploads)
gcloud projects add-iam-policy-binding delux-plus-prod \
  --member="serviceAccount:delux-plus-storage-sa@delux-plus-prod.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"
```

## Related Issues

- If you see "Permission denied" for Cloud SQL, grant `roles/cloudsql.client`
- If you see "Permission denied" for Storage, grant `roles/storage.objectAdmin`
- If you see "Permission denied" for Logging, grant `roles/logging.logWriter`

## More Information

- [Secret Manager IAM Roles](https://cloud.google.com/secret-manager/docs/access-control)
- [Cloud Run Service Identity](https://cloud.google.com/run/docs/securing/service-identity)
- [Troubleshooting Guide](./TROUBLESHOOTING-CICD.md)
