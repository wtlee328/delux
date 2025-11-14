#!/bin/bash

# Run database migrations on production
# This script connects to Cloud SQL and runs all pending migrations

set -e

PROJECT_ID="delux-plus-prod"
REGION="asia-east1"
INSTANCE_NAME="delux-plus-db"

echo "🔄 Running database migrations on production..."
echo "Project: $PROJECT_ID"
echo "Instance: $INSTANCE_NAME"
echo ""

# Get database credentials from secrets
echo "📝 Fetching database credentials..."
DB_PASSWORD=$(gcloud secrets versions access latest --secret="delux-db-password" --project=$PROJECT_ID)

# Get the public IP of the Cloud SQL instance
echo "📝 Getting Cloud SQL instance IP..."
DB_HOST=$(gcloud sql instances describe $INSTANCE_NAME --project=$PROJECT_ID --format="value(ipAddresses[0].ipAddress)")

# Set environment variables for migration
export DB_HOST="$DB_HOST"
export DB_PORT="5432"
export DB_NAME="delux_plus"
export DB_USER="postgres"
export DB_PASSWORD="$DB_PASSWORD"
export NODE_ENV="production"

echo "✅ Credentials loaded"
echo ""

# Navigate to backend directory
cd "$(dirname "$0")/../backend"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Run migrations
echo "🚀 Running migrations..."
npm run migrate

echo ""
echo "✅ Migrations completed successfully!"
echo ""
echo "Next steps:"
echo "1. Run: ./seed-production.sh"
echo "2. Or manually: cd backend && npm run seed:admin"
