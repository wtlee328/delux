# Firebase Hosting Deployment Guide

This guide covers deploying the Delux+ frontend to Firebase Hosting.

## Prerequisites

- Google Cloud Platform account
- Firebase project (can use same project as Cloud Run)
- Firebase CLI installed: `npm install -g firebase-tools`
- Backend deployed to Cloud Run
- Node.js and npm installed

## Step 1: Initialize Firebase

If this is your first time deploying:

```bash
# Login to Firebase
firebase login

# Initialize Firebase in the project (if not already done)
firebase init hosting
```

When prompted:
- Select your Firebase project
- Set public directory: `frontend/dist`
- Configure as single-page app: `Yes`
- Set up automatic builds: `No`
- Don't overwrite `index.html`: `No`

## Step 2: Configure Backend URL

Update the production environment file with your Cloud Run backend URL:

```bash
# Get backend URL
BACKEND_URL=$(gcloud run services describe delux-plus-backend \
    --region=asia-east1 \
    --format="value(status.url)")

echo "VITE_API_BASE_URL=$BACKEND_URL" > frontend/.env.production
```

## Step 3: Build Frontend

Build the production bundle:

```bash
cd frontend
npm install
npm run build
```

This creates an optimized production build in `frontend/dist/`.

## Step 4: Deploy to Firebase Hosting

### Option A: Using Deployment Script (Recommended)

```bash
cd deployment
chmod +x deploy-frontend.sh
export GCP_PROJECT_ID="your-project-id"
export BACKEND_URL="https://your-backend-url.a.run.app"
./deploy-frontend.sh
```

### Option B: Manual Deployment

```bash
# From project root
firebase deploy --only hosting
```

## Step 5: Verify Deployment

Visit your Firebase Hosting URL:
```
https://your-project-id.web.app
```

Test the application:
1. Login page loads correctly
2. Can log in with test credentials
3. Role-based routing works
4. API calls to backend succeed

## Step 6: Update CORS Configuration

Update backend CORS to allow your Firebase Hosting domain:

```bash
# Get hosting URL
HOSTING_URL="https://your-project-id.web.app"

# Update Cloud Run service
gcloud run services update delux-plus-backend \
    --region=asia-east1 \
    --set-env-vars="CORS_ORIGIN=$HOSTING_URL"

# Update Cloud Storage CORS
cd deployment
# Edit cors-config.json to add your hosting URL
gcloud storage buckets update gs://delux-plus-products \
    --cors-file=cors-config.json
```

## Configuration Files

### firebase.json

```json
{
  "hosting": {
    "public": "frontend/dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "index.html",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache, no-store, must-revalidate"
          }
        ]
      }
    ]
  }
}
```

### .firebaserc

```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

### frontend/.env.production

```env
VITE_API_BASE_URL=https://delux-plus-backend-xxxxx-xx.a.run.app
```

## Custom Domain (Optional)

### Add Custom Domain

1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Enter your domain (e.g., `delux-plus.com`)
4. Follow DNS configuration instructions
5. Wait for SSL certificate provisioning (can take up to 24 hours)

### Update CORS After Adding Domain

```bash
# Update backend CORS
gcloud run services update delux-plus-backend \
    --region=asia-east1 \
    --set-env-vars="CORS_ORIGIN=https://delux-plus.com"

# Update Storage CORS
# Add your domain to cors-config.json
gcloud storage buckets update gs://delux-plus-products \
    --cors-file=cors-config.json
```

## Preview Channels

Test changes before deploying to production:

```bash
# Create preview channel
firebase hosting:channel:deploy preview-feature-x

# Deploy to preview
firebase deploy --only hosting:preview-feature-x

# Delete preview when done
firebase hosting:channel:delete preview-feature-x
```

## Rollback

Rollback to a previous deployment:

```bash
# List previous deployments
firebase hosting:releases:list

# Rollback to specific version
firebase hosting:rollback
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Build
        env:
          VITE_API_BASE_URL: ${{ secrets.BACKEND_URL }}
        run: |
          cd frontend
          npm run build
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
          projectId: ${{ secrets.FIREBASE_PROJECT_ID }}
```

## Monitoring

### View Hosting Metrics

Firebase Console → Hosting → Usage tab:
- Bandwidth usage
- Request count
- Storage usage

### View Logs

```bash
# View deployment history
firebase hosting:releases:list

# View specific release
firebase hosting:releases:view RELEASE_ID
```

## Performance Optimization

### Current Optimizations

1. **Asset Caching**
   - Static assets: 1 year cache
   - index.html: No cache (always fresh)

2. **Build Optimization**
   - Code splitting
   - Tree shaking
   - Minification
   - Gzip compression (automatic)

3. **CDN**
   - Global CDN (automatic)
   - HTTP/2 support
   - Brotli compression

### Additional Optimizations

1. **Lazy Loading**
```typescript
// In App.tsx
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
```

2. **Image Optimization**
- Use WebP format
- Implement lazy loading
- Add loading placeholders

3. **Bundle Analysis**
```bash
npm run build -- --mode analyze
```

## Security

### Headers Configuration

Already configured in `firebase.json`:
- Cache-Control headers
- SPA rewrites

### Additional Security Headers

Add to `firebase.json`:
```json
{
  "headers": [
    {
      "source": "**",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

## Troubleshooting

### Build Fails

Check:
- Node.js version (should be 18+)
- Dependencies installed: `npm install`
- Environment variables set correctly
- TypeScript errors: `npm run build`

### Deployment Fails

Check:
- Firebase CLI logged in: `firebase login`
- Correct project selected: `firebase use PROJECT_ID`
- Build directory exists: `frontend/dist`
- Firebase.json configuration correct

### 404 Errors

Verify:
- SPA rewrites configured in `firebase.json`
- Build includes all routes
- React Router configured correctly

### API Calls Fail

Check:
- Backend URL in `.env.production`
- CORS configured on backend
- Backend is running and accessible
- Network tab in browser DevTools

### Images Not Loading

Verify:
- Cloud Storage CORS includes hosting domain
- Image URLs are correct
- Images exist in bucket
- Public read access enabled

## Cost Optimization

Firebase Hosting pricing:
- **Free tier:** 10 GB storage, 360 MB/day transfer
- **Paid tier:** $0.026/GB storage, $0.15/GB transfer

Tips:
- Use CDN caching effectively
- Optimize image sizes
- Enable compression
- Monitor bandwidth usage

## Additional Resources

- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Vite Build Guide](https://vitejs.dev/guide/build.html)
- [React Router Deployment](https://reactrouter.com/en/main/guides/deployment)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
