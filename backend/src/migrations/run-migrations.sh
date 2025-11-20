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

# Start Cloud SQL Proxy in the background
echo "🔌 Starting Cloud SQL Proxy..."
/opt/homebrew/share/google-cloud-sdk/bin/cloud-sql-proxy --port 5433 ${PROJECT_ID}:${REGION}:${INSTANCE_NAME} &
PROXY_PID=$!

# Wait for proxy to be ready
echo "⏳ Waiting for proxy to connect..."
sleep 5

# Override DB_HOST and DB_PORT to use proxy
export DB_HOST="127.0.0.1"
export DB_PORT="5433"

echo "✅ Cloud SQL Proxy connected"
echo ""

# Navigate to backend directory (script is in backend/src/migrations)
cd "$(dirname "$0")/../.."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Run migrations
echo "🚀 Running migrations..."
npm run migrate

# Stop the proxy
echo ""
echo "🛑 Stopping Cloud SQL Proxy..."
kill $PROXY_PID

echo ""
echo "✅ Migrations completed successfully!"
echo ""
echo "Next steps:"
echo "1. Run: ./seed-production.sh"
echo "2. Or manually: cd backend && npm run seed:admin"
