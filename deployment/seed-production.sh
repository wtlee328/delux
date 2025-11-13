#!/bin/bash

# Production Database Seeding Script
# This script seeds the production database with the initial admin user
# 
# Usage:
#   ./seed-production.sh
#
# Prerequisites:
#   - Database migrations completed
#   - Cloud SQL proxy running OR direct database access configured
#   - Environment variables set in backend/.env

set -e

echo "=========================================="
echo "Delux+ Production Database Seeding"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "backend/package.json" ]; then
  echo "❌ Error: Must run from project root directory"
  exit 1
fi

# Check if backend/.env exists
if [ ! -f "backend/.env" ]; then
  echo "❌ Error: backend/.env file not found"
  echo "Please create backend/.env with database credentials"
  exit 1
fi

# Confirm production environment
echo "⚠️  WARNING: This will seed the PRODUCTION database"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Seeding cancelled"
  exit 0
fi

echo ""
echo "Step 1: Creating admin user..."
echo "-----------------------------------"

cd backend

# Check if custom credentials are provided
if [ -z "$ADMIN_EMAIL" ]; then
  echo "Using default admin email: admin@deluxplus.com"
  echo "To use custom email, set ADMIN_EMAIL environment variable"
fi

if [ -z "$ADMIN_PASSWORD" ]; then
  echo "⚠️  Using default password. CHANGE THIS IMMEDIATELY AFTER FIRST LOGIN!"
  echo "To use custom password, set ADMIN_PASSWORD environment variable"
fi

# Run admin seed script
npm run seed:admin

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Admin user created successfully!"
  echo ""
  echo "=========================================="
  echo "IMPORTANT NEXT STEPS:"
  echo "=========================================="
  echo "1. Save the admin credentials securely"
  echo "2. Test login at your application URL"
  echo "3. Change the admin password immediately"
  echo "4. Document credentials in password manager"
  echo "5. Delete this output from terminal history"
  echo "=========================================="
else
  echo ""
  echo "❌ Failed to create admin user"
  echo "Check the error messages above"
  exit 1
fi

cd ..

echo ""
read -p "Do you want to create test data? (yes/no): " create_test

if [ "$create_test" = "yes" ]; then
  echo ""
  echo "Step 2: Creating test data..."
  echo "-----------------------------------"
  cd backend
  npm run seed:test
  
  if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Test data created successfully!"
  else
    echo ""
    echo "❌ Failed to create test data"
  fi
  cd ..
fi

echo ""
echo "=========================================="
echo "Seeding Complete!"
echo "=========================================="
