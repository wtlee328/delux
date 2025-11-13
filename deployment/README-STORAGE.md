# Google Cloud Storage Configuration Guide

This guide covers setting up Google Cloud Storage for product images in the Delux+ platform.

## Prerequisites

- Google Cloud Platform account
- `gcloud` CLI installed and authenticated
- Project with billing enabled
- Cloud Storage API enabled

## Step 1: Create Storage Bucket

Run the setup script:

```bash
cd deployment
chmod +x gcloud-storage-setup.sh
export GCP_PROJECT_ID="your-project-id"
export GCS_BUCKET_NAME="delux-plus-products"
export GCS_LOCATION="asia-east1"
./gcloud-storage-setup.sh
```

The script will:
- Create a storage bucket with uniform access control
- Configure public read access for all objects
- Set up CORS for frontend uploads
- Create a service account with storage permissions
- Generate a service account key file

**Important:** Move the generated key file to a secure location:
```bash
mv gcs-keyfile.json ../backend/gcs-keyfile.json
```

## Step 2: Configure Backend

Update `backend/.env`:

```env
GCS_PROJECT_ID=your-project-id
GCS_BUCKET_NAME=delux-plus-products
GCS_KEYFILE_PATH=./gcs-keyfile.json
```

## Step 3: Update CORS Configuration (if needed)

If you need to add additional origins (e.g., production domain):

1. Edit `cors-config.json`:
```json
[
  {
    "origin": [
      "http://localhost:5173",
      "https://your-production-domain.com",
      "https://*.web.app",
      "https://*.firebaseapp.com"
    ],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"],
    "maxAgeSeconds": 3600
  }
]
```

2. Apply the configuration:
```bash
gcloud storage buckets update gs://delux-plus-products \
    --cors-file=cors-config.json
```

## Step 4: Test Upload

Test image upload from the backend:

```bash
cd ../backend
npm run dev
```

Use the supplier product creation endpoint to upload a test image.

## Public Access Configuration

All objects in the bucket are publicly readable by default. This is required for:
- Displaying product images to agencies
- Showing cover images in product listings
- Product detail pages

### Verify Public Access

Test accessing an uploaded image:
```
https://storage.googleapis.com/delux-plus-products/your-image.jpg
```

## Security Considerations

### Service Account Permissions

The service account has `storage.objectAdmin` role, which allows:
- Creating objects (uploading images)
- Reading objects
- Deleting objects
- Updating object metadata

### Key File Security

**Never commit the key file to version control!**

Add to `.gitignore`:
```
gcs-keyfile.json
*.json
!package.json
!tsconfig.json
```

### For Cloud Run Deployment

Use Workload Identity instead of key files:

1. Attach the service account to Cloud Run:
```bash
gcloud run services update delux-plus-backend \
    --service-account=delux-plus-storage-sa@PROJECT_ID.iam.gserviceaccount.com
```

2. Update backend code to use default credentials:
```typescript
// In production, don't specify keyFilename
const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  // keyFilename is only needed for local development
});
```

## File Organization

Recommended bucket structure:

```
delux-plus-products/
├── products/
│   ├── {product-id}-{timestamp}.jpg
│   ├── {product-id}-{timestamp}.png
│   └── ...
└── temp/
    └── (temporary uploads, auto-deleted after 365 days)
```

## Image Specifications

- **Accepted formats:** JPEG, PNG, WebP
- **Maximum size:** 5MB
- **Recommended dimensions:** 1200x800px
- **Naming convention:** `{productId}-{timestamp}.{ext}`

## Monitoring and Logging

### View Bucket Usage

```bash
gcloud storage du gs://delux-plus-products --summarize
```

### Check Access Logs

Enable logging:
```bash
gcloud storage buckets update gs://delux-plus-products \
    --log-bucket=gs://your-logging-bucket \
    --log-object-prefix=storage-logs/
```

### Monitor Costs

View storage costs in Cloud Console:
- Navigation: Billing → Reports
- Filter by: Cloud Storage

## Backup Strategy

Cloud Storage provides 11 9's of durability, but consider:

1. **Versioning** (optional):
```bash
gcloud storage buckets update gs://delux-plus-products \
    --versioning
```

2. **Cross-region replication** (for disaster recovery):
```bash
# Create a multi-region bucket
gcloud storage buckets create gs://delux-plus-products-backup \
    --location=asia \
    --storage-class=NEARLINE
```

## Lifecycle Management

Current lifecycle policy:
- Temporary files in `temp/` folder are deleted after 365 days

To update lifecycle rules, edit and apply:
```bash
gcloud storage buckets update gs://delux-plus-products \
    --lifecycle-file=lifecycle-config.json
```

## Troubleshooting

### Upload Fails with 403 Error
- Verify service account has `storage.objectAdmin` role
- Check key file path in `.env`
- Ensure bucket exists

### CORS Errors in Browser
- Verify CORS configuration includes your frontend origin
- Check browser console for specific CORS error
- Reapply CORS config if needed

### Images Not Loading
- Verify public access is enabled
- Check image URL format
- Ensure object exists in bucket

### Permission Denied
- Verify service account email
- Check IAM bindings: `gcloud storage buckets get-iam-policy gs://delux-plus-products`
- Regenerate key file if corrupted

## Cost Optimization

- Use `STANDARD` storage class for frequently accessed images
- Consider `NEARLINE` for archived products
- Enable lifecycle policies to delete old temporary files
- Monitor egress costs (data transfer out)

## Additional Resources

- [Cloud Storage Documentation](https://cloud.google.com/storage/docs)
- [CORS Configuration](https://cloud.google.com/storage/docs/configuring-cors)
- [Access Control](https://cloud.google.com/storage/docs/access-control)
- [Best Practices](https://cloud.google.com/storage/docs/best-practices)
