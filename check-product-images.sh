#!/bin/bash

# Check product image URLs in database

set -e

PROJECT_ID="delux-plus-prod"
REGION="asia-east1"
INSTANCE_NAME="delux-plus-db"

echo "🔍 Checking product image URLs..."
echo ""

# Get database credentials
DB_PASSWORD=$(gcloud secrets versions access latest --secret="delux-db-password" --project=$PROJECT_ID)

# Start Cloud SQL Proxy
echo "🔌 Starting Cloud SQL Proxy..."
deployment/cloud_sql_proxy --port 5433 ${PROJECT_ID}:${REGION}:${INSTANCE_NAME} &
PROXY_PID=$!

sleep 5

# Check product image URLs
echo "📋 Checking product cover_image_url..."
PGPASSWORD=$DB_PASSWORD psql -h 127.0.0.1 -p 5433 -U postgres -d delux_plus -c "SELECT id, title, cover_image_url, status FROM products ORDER BY created_at DESC LIMIT 5;" 2>/dev/null || echo "❌ Could not query products"

# Stop proxy
kill $PROXY_PID

echo ""
echo "✅ Check complete!"
