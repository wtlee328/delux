#!/bin/bash

# Cloud SQL Proxy Setup for Local Development
# This script downloads and configures the Cloud SQL Proxy

set -e

PROXY_VERSION="v2.8.0"
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

echo "=== Cloud SQL Proxy Setup ==="
echo "OS: $OS"
echo "Architecture: $ARCH"
echo ""

# Determine download URL based on OS and architecture
case "$OS" in
    darwin)
        if [ "$ARCH" = "arm64" ]; then
            DOWNLOAD_URL="https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/${PROXY_VERSION}/cloud-sql-proxy.darwin.arm64"
        else
            DOWNLOAD_URL="https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/${PROXY_VERSION}/cloud-sql-proxy.darwin.amd64"
        fi
        ;;
    linux)
        if [ "$ARCH" = "aarch64" ]; then
            DOWNLOAD_URL="https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/${PROXY_VERSION}/cloud-sql-proxy.linux.arm64"
        else
            DOWNLOAD_URL="https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/${PROXY_VERSION}/cloud-sql-proxy.linux.amd64"
        fi
        ;;
    *)
        echo "Unsupported OS: $OS"
        exit 1
        ;;
esac

# Download proxy
echo "Downloading Cloud SQL Proxy..."
curl -o cloud_sql_proxy "$DOWNLOAD_URL"

# Make executable
chmod +x cloud_sql_proxy

echo ""
echo "=== Setup Complete ==="
echo "Cloud SQL Proxy installed: ./cloud_sql_proxy"
echo ""
echo "To connect to your Cloud SQL instance:"
echo "  ./cloud_sql_proxy --port 5432 <INSTANCE_CONNECTION_NAME>"
echo ""
echo "Example:"
echo "  ./cloud_sql_proxy --port 5432 my-project:asia-east1:delux-plus-db"
