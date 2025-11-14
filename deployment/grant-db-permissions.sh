#!/bin/bash

# Grant database permissions to delux_admin user
# This fixes the permission error when the application tries to access the database

set -e

PROJECT_ID="delux-plus-prod"
INSTANCE_NAME="delux-plus-db"
DB_NAME="delux_plus"

echo "🔐 Granting database permissions to delux_admin user..."
echo "Project: $PROJECT_ID"
echo "Instance: $INSTANCE_NAME"
echo ""

# Use gcloud sql connect to run SQL commands
echo "📝 Connecting to Cloud SQL and granting permissions..."

gcloud sql connect $INSTANCE_NAME --user=postgres --project=$PROJECT_ID --database=$DB_NAME << 'EOF'
-- Grant all privileges on existing tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO delux_admin;

-- Grant all privileges on existing sequences
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO delux_admin;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO delux_admin;

-- Grant default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO delux_admin;

-- Grant default privileges for future sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO delux_admin;

-- Verify permissions
\dp users
\dp products

\q
EOF

echo ""
echo "✅ Permissions granted successfully!"
echo ""
echo "The delux_admin user now has full access to all tables and sequences."
echo ""
echo "Next step: Test login at https://delux-plus-prod.web.app/login"
