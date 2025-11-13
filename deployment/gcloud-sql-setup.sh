#!/bin/bash

# Delux+ Google Cloud SQL Setup Script
# This script creates and configures a PostgreSQL instance on Google Cloud SQL

set -e

# Configuration variables
PROJECT_ID="${GCP_PROJECT_ID:-your-project-id}"
INSTANCE_NAME="${SQL_INSTANCE_NAME:-delux-plus-db}"
REGION="${GCP_REGION:-asia-east1}"
DB_VERSION="POSTGRES_15"
TIER="db-f1-micro"
DATABASE_NAME="delux_plus"
DB_USER="delux_admin"

echo "=== Delux+ Cloud SQL Setup ==="
echo "Project: $PROJECT_ID"
echo "Instance: $INSTANCE_NAME"
echo "Region: $REGION"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud CLI is not installed"
    echo "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set the project
echo "Setting GCP project..."
gcloud config set project "$PROJECT_ID"

# Create Cloud SQL instance
echo "Creating Cloud SQL instance..."
gcloud sql instances create "$INSTANCE_NAME" \
    --database-version="$DB_VERSION" \
    --tier="$TIER" \
    --region="$REGION" \
    --database-flags=max_connections=100 \
    --backup-start-time=03:00 \
    --retained-backups-count=7 \
    || echo "Instance may already exist"

# Wait for instance to be ready
echo "Waiting for instance to be ready..."
gcloud sql instances describe "$INSTANCE_NAME" --format="value(state)"

# Set root password
echo "Setting root password..."
echo "Please enter a secure password for the postgres user:"
read -s ROOT_PASSWORD
gcloud sql users set-password postgres \
    --instance="$INSTANCE_NAME" \
    --password="$ROOT_PASSWORD"

# Create application database
echo "Creating database..."
gcloud sql databases create "$DATABASE_NAME" \
    --instance="$INSTANCE_NAME" \
    || echo "Database may already exist"

# Create application user
echo "Creating application user..."
echo "Please enter a secure password for the $DB_USER user:"
read -s APP_PASSWORD
gcloud sql users create "$DB_USER" \
    --instance="$INSTANCE_NAME" \
    --password="$APP_PASSWORD" \
    || echo "User may already exist"

# Get connection name
CONNECTION_NAME=$(gcloud sql instances describe "$INSTANCE_NAME" --format="value(connectionName)")

echo ""
echo "=== Setup Complete ==="
echo "Instance Connection Name: $CONNECTION_NAME"
echo "Database Name: $DATABASE_NAME"
echo "Database User: $DB_USER"
echo ""
echo "For Cloud Run deployment, use:"
echo "  DB_HOST=/cloudsql/$CONNECTION_NAME"
echo ""
echo "For local development with Cloud SQL Proxy:"
echo "  ./cloud_sql_proxy -instances=$CONNECTION_NAME=tcp:5432"
echo ""
echo "Save these credentials securely!"
