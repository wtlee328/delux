# Delux+ End-to-End Development Workflow

This guide details the standard development lifecycle for the Delux+ B2B2B
platform, taking code from local development all the way through staging
validation and production deployment.

## 1. Environments & Branching Strategy

Our infrastructure relies on three distinct environments, completely isolated
from one another to prevent test data from colliding with production B2B
supplies.

| Environment    | Purpose                                  | GCP Project                 | Frontend URL                        | Database                                 |
| -------------- | ---------------------------------------- | --------------------------- | ----------------------------------- | ---------------------------------------- |
| **Local**      | Day-to-day development                   | None (Local machine)        | `localhost:5173`                    | Local SQLite or isolated Docker Postgres |
| **Staging**    | Feature validation & Integration testing | `delux-plus-staging-488508` | `delux-plus-staging-488508.web.app` | `delux_plus_staging` (Cloud SQL Proxy)   |
| **Production** | Live B2B operations                      | `delux-plus-prod`           | `delux-plus-production...`          | `delux_plus` (Cloud SQL)                 |

### Branching Strategy

- **`main`**: The source of truth for Production. Only perfectly tested code is
  merged here. Protected branch.
- **`staging` / `develop`**: The integration branch. Features are merged here to
  trigger staging deployments.
- **`feature/*` or `fix/*`**: Used by developers to build features locally
  before opening a Pull Request (PR).

---

## 2. Local Development Process

### Step 1: Branch Creation

Start by checking out a new feature branch from the main/develop branch.

```bash
git checkout -b feature/new-admin-dashboard
```

### Step 2: Environment Configuration

Ensure your local environment configuration expects local requests.

- Backend: `.env` uses a local mock or a local DB.
- Frontend: `.env.local` points to `VITE_API_BASE_URL=http://localhost:8080`.

### Step 3: Running Locally

Run the backend and frontend simultaneously:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Step 4: Commit Changes

Commit your changes logically with descriptive messages:

```bash
git commit -m "feat: implemented new admin dashboard layout"
```

---

## 3. Deploying to Staging

Once a feature works locally, it must be validated in an environment that
heavily mimics production infrastructure. This ensures no Cloud permissions or
CORS issues arise later.

### Option A: CI/CD Automated Staging (Recommended)

If CI/CD is configured for the `staging` branch:

1. Open a Pull Request from `feature/*` into `staging`.
2. Upon merging into `staging`, GitHub Actions automatically builds the Docker
   images and pushes to the staging GCP project.

### Option B: Manual Staging Deployment (Checkpoints)

If automating manually or iterating on infrastructure quickly:

**1. Deploy Staging Backend:**

```bash
# Deploy to delux-plus-staging-488508 Cloud Run
cd deployment
./deploy-backend.sh
# Ensure you specify the staging Project ID and DB configurations!
```

**2. Deploy Staging Frontend:**

```bash
cd frontend
# Build the UI packing the Staging endpoint
npm run build:staging

# Deploy only to the staging target in Firebase
cd ..
npx firebase-tools deploy --only hosting:staging --project delux-plus-staging-488508
```

---

## 4. Validation & Testing Procedures in Staging

Validation must occur before any code moves to production. Use the live Staging
URLs (e.g., `delux-plus-staging-488508.web.app`).

### Routine Checks:

- **Authentication**: Can users successfully log in and rotate tokens?
- **IAM / Role Binding**: Does a user with `agency` see different endpoints than
  a `supplier`? Test UI blocks and API security intercepts.
- **Database Migrations**: Log into the staging Cloud SQL tunnel if necessary to
  verify table schema integrity.
  ```bash
  # Opening local tunnel to staging DB
  ./cloud_sql_proxy --port 5432 delux-plus-staging-488508:asia-east1:delux-plus-db-staging
  ```
- **File Uploads**: Ensure the backend's Staging Service Account
  (`delux-plus-storage-sa`) successfully uploads images to the Staging Storage
  Bucket without CORS rejections.

---

## 5. Promotion to Production

When all changes in the `staging` environment are signed-off by the Product
Manager/QA:

### Step 1: Pull Request to Main

Open a PR to merge `staging` (or your completed feature branch) into `main`.

### Step 2: Review and Merge

The team reviews code syntax, linting, and approves the merge.

### Step 3: Run Database Migrations on Production (Critical)

Before deploying code that depends on new tables/columns, the Production DB
schema must be seamlessly updated:

```bash
# Connect proxy tunnel to Production
./cloud_sql_proxy --port 5433 delux-plus-prod:asia-east1:delux-plus-db

# Target the tunnel and run backend migrations
export DB_HOST=127.0.0.1
export DB_PORT=5433
# DO NOT RUN SEED FILES HERE - THAT COULD OVERWRITE PROD DATA!
cd backend
npm run migrate:dev
```

### Step 4: Trigger Live Deployment

> [!IMPORTANT]
> **Production deployment should ideally be automated via GitHub Actions by pushing to the `main` branch.**
> 
> Manually deploying to production using local scripts without pushing your changes to GitHub is **STRICTLY PROHIBITED** as it leads to "hidden" code in production that is missing from the repository.

1.  **Automated**: Pushing to `main` triggers `.github/workflows/deploy-backend.yml` and `deploy-frontend.yml`.
2.  **Manual (Emergency ONLY)**: If you MUST deploy manually, you are **REQUIRED** to push your changes to GitHub first:
    ```bash
    git checkout main
    git merge staging
    git push origin main  # MUST BE DONE FIRST
    
    # Then run local scripts if necessary
    cd deployment
    ./deploy-backend.sh
    ./deploy-frontend.sh
    ```

### Step 5: Post-Deployment Smoke Test

- Verify prod site is up.
- Verify basic login flow.
- Look out for rapid 500 logs in Google Cloud Console Logs Explorer.
- Rollback immediately (`firebase hosting:rollback` or Cloud Run
  `update-traffic`) if fatal issues are detected.
