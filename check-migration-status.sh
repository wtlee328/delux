#!/bin/bash

# Check if migration 005 has been run on production database

set -e

PROJECT_ID="delux-plus-prod"
REGION="asia-east1"
INSTANCE_NAME="delux-plus-db"

echo "🔍 Checking migration status on production database..."
echo ""

# Get database credentials
DB_PASSWORD=$(gcloud secrets versions access latest --secret="delux-db-password" --project=$PROJECT_ID)

# Start Cloud SQL Proxy
echo "🔌 Starting Cloud SQL Proxy..."
./cloud_sql_proxy --port 5433 ${PROJECT_ID}:${REGION}:${INSTANCE_NAME} &
PROXY_PID=$!

sleep 5

# Check migrations table
echo "📋 Checking executed migrations..."
PGPASSWORD=$DB_PASSWORD psql -h 127.0.0.1 -p 5433 -U delux_admin -d delux_plus -c "SELECT name, executed_at FROM migrations ORDER BY id;" || echo "❌ Could not list migrations"

echo ""
echo "📋 Checking product status constraint..."
PGPASSWORD=$DB_PASSWORD psql -h 127.0.0.1 -p 5433 -U postgres -d delux_plus -c "SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'products_status_check';" 2>/dev/null || echo "❌ Could not check constraint"

echo ""
echo "📋 Checking current product statuses..."
PGPASSWORD=$DB_PASSWORD psql -h 127.0.0.1 -p 5433 -U postgres -d delux_plus -c "SELECT DISTINCT status, COUNT(*) FROM products GROUP BY status;" 2>/dev/null || echo "❌ Could not check products"

# Stop proxy
kill $PROXY_PID

echo ""
echo "✅ Check complete!"
