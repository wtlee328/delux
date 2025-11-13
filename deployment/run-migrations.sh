#!/bin/bash

# Delux+ Database Migration Runner
# This script runs database migrations against Cloud SQL

set -e

echo "=== Delux+ Database Migration ==="

# Check if required environment variables are set
if [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
    echo "Error: Required environment variables not set"
    echo "Required: DB_HOST, DB_NAME, DB_USER, DB_PASSWORD"
    exit 1
fi

echo "Database: $DB_NAME"
echo "Host: $DB_HOST"
echo "User: $DB_USER"
echo ""

# Navigate to backend directory
cd "$(dirname "$0")/../backend"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build TypeScript
echo "Building application..."
npm run build

# Run migrations
echo "Running migrations..."
npm run migrate

echo ""
echo "=== Migrations Complete ==="
