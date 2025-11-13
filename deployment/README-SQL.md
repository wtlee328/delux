# Google Cloud SQL Configuration Guide

This guide covers setting up and connecting to Google Cloud SQL for the Delux+ platform.

## Prerequisites

- Google Cloud Platform account
- `gcloud` CLI installed and authenticated
- Project with billing enabled
- Cloud SQL Admin API enabled

## Step 1: Create Cloud SQL Instance

Run the setup script:

```bash
cd deployment
chmod +x gcloud-sql-setup.sh
export GCP_PROJECT_ID="your-project-id"
export SQL_INSTANCE_NAME="delux-plus-db"
export GCP_REGION="asia-east1"
./gcloud-sql-setup.sh
```

The script will:
- Create a PostgreSQL 15 instance
- Configure automated backups
- Create the `delux_plus` database
- Create an application user
- Display connection information

**Save the connection credentials securely!**

## Step 2: Configure Connection

### For Cloud Run Deployment

Use Unix socket connection:

```env
DB_HOST=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
DB_PORT=5432
DB_NAME=delux_plus
DB_USER=delux_admin
DB_PASSWORD=your_secure_password
```

### For Local Development

#### Option A: Cloud SQL Proxy (Recommended)

1. Download the proxy:
```bash
chmod +x cloud-sql-proxy-setup.sh
./cloud-sql-proxy-setup.sh
```

2. Start the proxy:
```bash
./cloud_sql_proxy --port 5432 PROJECT_ID:REGION:INSTANCE_NAME
```

3. Configure backend `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=delux_plus
DB_USER=delux_admin
DB_PASSWORD=your_secure_password
```

#### Option B: Public IP (Not Recommended for Production)

Enable public IP on the instance and add your IP to authorized networks:

```bash
gcloud sql instances patch delux-plus-db \
    --assign-ip \
    --authorized-networks=YOUR_IP_ADDRESS
```

## Step 3: Run Database Migrations

Set environment variables and run migrations:

```bash
export DB_HOST=localhost  # or /cloudsql/... for Cloud Run
export DB_PORT=5432
export DB_NAME=delux_plus
export DB_USER=delux_admin
export DB_PASSWORD=your_secure_password

chmod +x run-migrations.sh
./run-migrations.sh
```

## Step 4: Verify Connection

Test the database connection:

```bash
cd ../backend
npm run dev
```

Check the health endpoint:
```bash
curl http://localhost:3000/health
```

## Security Best Practices

1. **Never commit credentials** - Use environment variables or Secret Manager
2. **Use private IP** - Disable public IP access in production
3. **Enable SSL** - Require SSL connections for all users
4. **Rotate passwords** - Change passwords regularly
5. **Limit permissions** - Grant only necessary database privileges
6. **Enable audit logging** - Monitor database access

## Monitoring

View instance metrics:
```bash
gcloud sql operations list --instance=delux-plus-db
```

Check logs:
```bash
gcloud sql operations describe OPERATION_ID
```

## Backup and Recovery

### Manual Backup
```bash
gcloud sql backups create --instance=delux-plus-db
```

### Restore from Backup
```bash
gcloud sql backups list --instance=delux-plus-db
gcloud sql backups restore BACKUP_ID --backup-instance=delux-plus-db
```

## Troubleshooting

### Connection Timeout
- Check firewall rules
- Verify Cloud SQL Proxy is running
- Confirm instance is running: `gcloud sql instances describe delux-plus-db`

### Authentication Failed
- Verify username and password
- Check user exists: `gcloud sql users list --instance=delux-plus-db`

### Migration Errors
- Check database exists
- Verify user has necessary permissions
- Review migration logs in `backend/dist/migrations/`

## Cost Optimization

- Use `db-f1-micro` tier for development/testing
- Scale up to `db-n1-standard-1` or higher for production
- Enable automatic storage increase
- Set up maintenance windows during low-traffic periods

## Additional Resources

- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Cloud SQL Proxy Guide](https://cloud.google.com/sql/docs/postgres/sql-proxy)
- [Best Practices](https://cloud.google.com/sql/docs/postgres/best-practices)
