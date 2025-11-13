# Delux+ Deployment Checklist

Use this checklist to ensure all deployment steps are completed correctly.

## Pre-Deployment

### Environment Setup
- [ ] GCP project created
- [ ] Billing enabled
- [ ] gcloud CLI installed and authenticated
- [ ] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] Docker installed (for local testing)
- [ ] Required APIs enabled:
  - [ ] Cloud SQL Admin API
  - [ ] Cloud Storage API
  - [ ] Cloud Run API
  - [ ] Cloud Build API
  - [ ] Secret Manager API

### Environment Variables Set
- [ ] `GCP_PROJECT_ID`
- [ ] `GCP_REGION`
- [ ] `SQL_INSTANCE_NAME`
- [ ] `GCS_BUCKET_NAME`
- [ ] `DB_NAME`
- [ ] `DB_USER`

## Initial Deployment

### 1. Cloud SQL Setup
- [ ] Run `gcloud-sql-setup.sh`
- [ ] Database instance created
- [ ] Database `delux_plus` created
- [ ] Application user created
- [ ] Credentials saved securely
- [ ] Connection name noted

### 2. Cloud Storage Setup
- [ ] Run `gcloud-storage-setup.sh`
- [ ] Storage bucket created
- [ ] Public read access configured
- [ ] CORS configured
- [ ] Service account created
- [ ] Key file generated and moved to `backend/gcs-keyfile.json`

### 3. Database Migrations
- [ ] Cloud SQL Proxy downloaded (`cloud-sql-proxy-setup.sh`)
- [ ] Proxy started
- [ ] Migrations run successfully (`run-migrations.sh`)
- [ ] Tables created (users, products)
- [ ] Indexes created

### 4. Secret Manager Setup
- [ ] Run `setup-secrets.sh`
- [ ] Database password stored
- [ ] JWT secret stored
- [ ] Service account granted access to secrets

### 5. Backend Deployment
- [ ] Dockerfile created
- [ ] `.dockerignore` configured
- [ ] Run `deploy-backend.sh`
- [ ] Image built and pushed
- [ ] Service deployed to Cloud Run
- [ ] Environment variables set
- [ ] Secrets configured
- [ ] Cloud SQL connection configured
- [ ] Service account attached
- [ ] Health check passes: `/health` returns `{"status":"ok"}`

### 6. Frontend Deployment
- [ ] Firebase project initialized
- [ ] `.firebaserc` configured with project ID
- [ ] `firebase.json` configured
- [ ] Backend URL set in `.env.production`
- [ ] Run `deploy-frontend.sh`
- [ ] Production build created
- [ ] Deployed to Firebase Hosting
- [ ] Site accessible at `https://PROJECT_ID.web.app`

### 7. CORS Configuration
- [ ] Backend CORS updated with frontend URL
- [ ] Cloud Storage CORS updated with frontend URL
- [ ] CORS tested from frontend

### 8. Initial Data Seeding
- [ ] Run `seed-production.sh` or manual seed scripts
- [ ] Admin user created successfully
- [ ] Admin credentials saved in password manager
- [ ] Admin login tested
- [ ] Admin password changed from default
- [ ] Test data created (optional, for staging/dev only)
- [ ] Credentials documented in secure location (not in git)
- [ ] See [SEEDING-QUICKSTART.md](./SEEDING-QUICKSTART.md) for details

## Post-Deployment Verification

### Functionality Tests
- [ ] Frontend loads correctly
- [ ] Login page accessible
- [ ] Can log in with admin credentials
- [ ] Role-based routing works
  - [ ] Admin redirects to `/admin/users`
  - [ ] Supplier redirects to `/supplier/dashboard`
  - [ ] Agency redirects to `/agency/dashboard`

### Admin Functions
- [ ] Can view user list
- [ ] Can create new users
- [ ] Duplicate email validation works
- [ ] Can view product list
- [ ] Can view product details
- [ ] Can update product status

### Supplier Functions
- [ ] Can view dashboard
- [ ] Can create new product
- [ ] Image upload works
- [ ] Rich text editor works
- [ ] Can edit existing product
- [ ] Product status displays correctly

### Agency Functions
- [ ] Can view product catalog
- [ ] Product cards display correctly
- [ ] Can filter by destination
- [ ] Can filter by duration
- [ ] Can view product details
- [ ] Images load correctly
- [ ] Price displays in TWD format

### Integration Tests
- [ ] Complete workflow: Create product → Admin review → Agency view
- [ ] Image upload and display
- [ ] Authentication and authorization
- [ ] Error handling

## Security Verification

- [ ] No secrets in code repository
- [ ] Service account key file not committed
- [ ] Environment variables properly configured
- [ ] CORS restricted to specific domains
- [ ] Cloud SQL uses private IP (or authorized networks only)
- [ ] Storage bucket IAM policies correct
- [ ] Secret Manager access restricted
- [ ] HTTPS enforced (automatic with Cloud Run and Firebase)

## Monitoring Setup

- [ ] Cloud Run logs accessible
- [ ] Firebase Hosting logs accessible
- [ ] Cloud SQL monitoring enabled
- [ ] Billing alerts configured
- [ ] Error tracking set up (optional)

## Documentation

- [ ] Deployment credentials documented
- [ ] Admin credentials documented
- [ ] Backend URL documented
- [ ] Frontend URL documented
- [ ] Service account emails documented
- [ ] Runbook created for common operations

## Backup Verification

- [ ] Cloud SQL automated backups enabled
- [ ] Backup retention configured (7 days)
- [ ] Manual backup tested
- [ ] Restore procedure documented

## Performance Baseline

- [ ] Backend response time measured
- [ ] Frontend load time measured
- [ ] Database query performance checked
- [ ] Image load time measured

## Cost Monitoring

- [ ] Current resource usage noted
- [ ] Billing dashboard reviewed
- [ ] Budget alerts configured
- [ ] Cost optimization opportunities identified

## Rollback Plan

- [ ] Previous backend revision noted
- [ ] Previous frontend deployment noted
- [ ] Database backup before deployment
- [ ] Rollback procedure tested (in staging)

## Subsequent Deployments

For updates after initial deployment:

### Backend Updates
- [ ] Code changes tested locally
- [ ] Tests passing
- [ ] Run `deploy-backend.sh`
- [ ] Health check passes
- [ ] Smoke tests pass

### Frontend Updates
- [ ] Code changes tested locally
- [ ] Build succeeds
- [ ] Run `deploy-frontend.sh`
- [ ] Site loads correctly
- [ ] Functionality verified

### Database Changes
- [ ] Migration script created
- [ ] Migration tested locally
- [ ] Backup created before migration
- [ ] Run `run-migrations.sh`
- [ ] Migration verified

### Quick Deployment
- [ ] Run `quick-deploy.sh` for both backend and frontend
- [ ] Verify both services

## Troubleshooting Reference

If issues occur, check:

1. **Backend won't start**
   - View logs: `gcloud run services logs read delux-plus-backend`
   - Check environment variables
   - Verify database connection
   - Check service account permissions

2. **Frontend can't connect**
   - Verify backend URL in `.env.production`
   - Check CORS configuration
   - Test backend health endpoint
   - Check browser console

3. **Database connection fails**
   - Verify Cloud SQL instance running
   - Check connection string
   - Verify service account role
   - Test with Cloud SQL Proxy

4. **Image upload fails**
   - Check service account permissions
   - Verify bucket exists
   - Check CORS configuration
   - Test direct bucket access

## Sign-Off

- [ ] Deployment completed by: ________________
- [ ] Date: ________________
- [ ] Verified by: ________________
- [ ] Date: ________________

## Notes

Use this section to document any issues encountered or deviations from the standard process:

---

---

---
