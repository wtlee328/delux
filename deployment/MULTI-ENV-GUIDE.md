# Delux+ Multi-Environment GCP & Firebase Setup Guide

This guide details the necessary GCP and Firebase configuration updates required after introducing our multi-environment setup (Local, Staging, Production). Implementing these changes ensures isolated testing, proper cross-origin routing, and safe deployment guardrails.

## Table of Contents
1. [Prerequisite Strategy](#1-prerequisite-strategy)
2. [Required Updates](#2-required-updates)
   - [A. Google Cloud Run (Backend)](#a-google-cloud-run-backend)
   - [B. Firebase Hosting (Frontend)](#b-firebase-hosting-frontend)
   - [C. Database & Cloud Storage (Isolation)](#c-database--cloud-storage-isolation)
3. [Recommended Order & Precautions](#3-recommended-order--precautions)

---

## 1. Prerequisite Strategy

Currently, you operate a single production instance. The **safest** and most professional way to handle a multi-environment CI/CD pipeline is **Project Isolation**.
You should create a completely separate Google Cloud/Firebase project for Staging.

- **Production Project**: `delux-plus-prod`
- **Staging Project**: `delux-plus-staging`

*Why?* It prevents developers or automated staging tests from accidentally dropping production databases, polluting Cloud Storage with test images, or leaking production JWT secrets.

---

## 2. Required Updates

If you choose *not* to create a fully separate GCP project and just want to run two environments on the *same* GCP project, here are the required configurations:

### A. Google Cloud Run (Backend)

We need to spin up a new Cloud Run service specifically for staging, and update the Production service's CORS variables.

#### 1. Setup Staging Cloud Run Service
- **Why**: You need an isolated compute instance so `build:staging` doesn't overwrite the production API.
- **Console Path**: GCP Console -> Cloud Run -> Create Service
- **Values**:
  - Name: `delux-plus-backend-staging`
  - Allow unauthenticated invocations (Assuming you manage auth via JWT in Express)
- **Environment Variables**:
  - `NODE_ENV`: `staging`
  - `CORS_ORIGIN`: `https://staging.delux-plus.web.app,http://localhost:5173`
  - `DB_NAME`: `delux_plus_staging` (Crucial: Use a different database schema!)

#### 2. Update Production CORS Environment Variable
- **Why**: To lock down the production API so it only accepts traffic from the production frontend (and the new Firebase rewrite).
- **Console Path**: GCP Console -> Cloud Run -> `delux-plus-backend` -> Edit & Deploy New Revision -> Variables & Secrets
- **Values**:
  - Update `CORS_ORIGIN` to: `https://delux-plus.web.app` (Remove `localhost:5173` from production).

### B. Firebase Hosting (Frontend)

We need to create a new Firebase Hosting site for staging, and apply the `firebase.json` rewrite rules.

#### 1. Create a Staging Hosting Site
- **Why**: Allows you to host `staging.delux-plus.web.app` alongside `delux-plus.web.app`.
- **Console Path**: Firebase Console -> Hosting -> Advanced -> Add another site
- **Values**:
  - Name: `delux-plus-staging`

#### 2. Update GitHub Actions (`.github/workflows`)
- **Why**: Your CI/CD needs to know which Firebase site to deploy to based on the Git branch.
- **Action**: Modify your `.yml` deployment scripts.
  - Push to `main` branch -> deploys to production site (`delux-plus-backend` and Firebase `delux-plus`).
  - Push to `staging` branch -> runs `npm run build:staging`, deploys to `delux-plus-backend-staging` and Firebase `delux-plus-staging`.

### C. Database & Cloud Storage (Isolation)

Testing environments **must** operate on dummy data.

#### 1. Provision a Staging Database
- **Why**: Running tests or seeding data on the production database will destroy live B2B supply chain data.
- **Console Path**: GCP Console -> SQL -> Your Instance -> Databases -> Create Database
- **Values**:
  - Database Name: `delux_plus_staging`
- **Action**: Point the Staging Cloud Run service to this new database using the `DB_NAME` environment variable.

#### 2. Provision Staging Cloud Storage Bucket
- **Why**: So image uploads from the staging app don't pollute the production bucket.
- **Console Path**: GCP Console -> Cloud Storage -> Buckets -> Create
- **Values**:
  - Bucket Name: `delux-plus-products-staging`
- **Action**: Point the Staging Cloud Run service to this new bucket using the `GCS_BUCKET_NAME` env var.

---

## 3. Recommended Order & Precautions

**DO NOT apply all these changes at once.** Follow this rollout order to protect production:

### Rollout Order:
1. **Infrastructure Prep**: Create the new Staging DB, Staging GCS Bucket, and Staging Firebase Site. Production is untouched.
2. **Deploy Staging**: Deploy the backend to `delux-plus-backend-staging` and the frontend proxy to `delux-plus-staging`.
3. **Validate Staging**: Test the entire flow on `staging.delux-plus.web.app`. Verify that it connects to the dummy database block, not production.
4. **Lockdown Production**: ONLY if Step 3 succeeds, go into the Production Cloud Run service and remove `http://localhost:5173` from its `CORS_ORIGIN` environment variable.

### Rollback Strategy:
If production goes down after deploying the Firebase Rewrite rules:
1. Immediately run `firebase deploy --only hosting` using the previous `firebase.json` (the one without the `rewrites` block targeting Cloud Run).
2. If Cloud Run CORS acts up, go to GCP Console -> Cloud Run -> Revisions, and click "Rollback" to instantly revert to the previous revision that had the old environment variables.
