#!/bin/bash

# Run database migrations on a target environment (staging or production)
# Usage: ./run-migrations.sh [staging|prod]
# Defaults to staging if no environment is specified.

set -e

ENV=${1:-staging}

if [ "$ENV" == "prod" ]; then
  PROJECT_ID="delux-plus-prod"
  INSTANCE_NAME="delux-plus-db"
  DB_NAME="delux_plus"
  echo "🚀 TARGETING PRODUCTION..."
elif [ "$ENV" == "staging" ]; then
  PROJECT_ID="delux-plus-staging-488508"
  INSTANCE_NAME="delux-plus-db-staging"
  DB_NAME="delux_plus_staging"
  echo "🚧 TARGETING STAGING..."
else
  echo "❌ Error: Invalid environment specified. Use 'staging' or 'prod'."
  exit 1
fi

REGION="asia-east1"

echo "🔄 Running database migrations on $ENV..."
echo "Project: $PROJECT_ID"
echo "Instance: $INSTANCE_NAME"
echo ""

# Get database credentials from secrets
# Use single quotes around the result to prevent shell expansion issues (e.g. if password contains '!')
echo "📝 Fetching database credentials..."
DB_PASSWORD=$(gcloud secrets versions access latest --secret="delux-db-password" --project=$PROJECT_ID)

if [ -z "$DB_PASSWORD" ]; then
  echo "❌ Error: Could not fetch DB_PASSWORD from Secret Manager."
  exit 1
fi

# Get the public IP of the Cloud SQL instance
echo "📝 Getting Cloud SQL instance IP..."
DB_HOST=$(gcloud sql instances describe $INSTANCE_NAME --project=$PROJECT_ID --format="value(ipAddresses[0].ipAddress)")

# Set environment variables for migration
export DB_HOST="$DB_HOST"
export DB_PORT="5432"
export DB_NAME="$DB_NAME"
export DB_USER="delux_admin" # Consistently use delux_admin for migrations to ensure table ownership
export DB_PASSWORD="$DB_PASSWORD"
export NODE_ENV="production"

echo "✅ Credentials loaded"
echo ""

# Start Cloud SQL Proxy in the background
echo "🔌 Starting Cloud SQL Proxy..."
# Use an available port to avoid conflicts
PROXY_PORT=5434
"$(dirname "$0")/../../../cloud_sql_proxy" --port $PROXY_PORT ${PROJECT_ID}:${REGION}:${INSTANCE_NAME} &
PROXY_PID=$!

# Wait for proxy to be ready
echo "⏳ Waiting for proxy to connect on port $PROXY_PORT..."
sleep 5

# Override DB_HOST and DB_PORT to use proxy
export DB_HOST="127.0.0.1"
export DB_PORT="$PROXY_PORT"

echo "✅ Cloud SQL Proxy connected"
echo ""

# Navigate to backend directory (script is in backend/src/migrations)
cd "$(dirname "$0")/../.."

# Ensure we're in the correct place
if [ ! -f "package.json" ]; then
  echo "❌ Error: Not in the backend root directory."
  kill $PROXY_PID
  exit 1
fi

# Build only if needed (or if dist is missing)
if [ ! -d "dist" ]; then
  echo "📦 Building project..."
  npm run build
fi

# Run migrations
echo "🚀 Executing migrations..."
# Use double quotes for env vars but ensure the password itself isn't expanded by using it in single quotes where possible in subcommands
npm run migrate

# Stop the proxy
echo ""
echo "🛑 Stopping Cloud SQL Proxy..."
kill $PROXY_PID

echo ""
echo "✅ Migrations for $ENV completed successfully!"
