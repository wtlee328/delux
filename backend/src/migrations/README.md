# Database Migrations

This directory contains PostgreSQL database migrations for the Delux+ platform.

## Migration Files

Migrations are executed in alphabetical order:

1. `001_create_users_table.ts` - Creates users table with indexes
2. `002_create_products_table.ts` - Creates products table with indexes
3. `003_create_migrations_table.ts` - Creates migrations tracking table (auto-created by runner)

## Running Migrations

### Local Development (using ts-node)

```bash
# Run all pending migrations
npm run migrate:dev

# Rollback the last migration
npm run migrate:dev:down
```

### Production & Staging (using compiled JavaScript)

The `run-migrations.sh` script handles connecting to Cloud SQL via proxy and executing migrations.

```bash
# Run migrations on STAGING (Default)
./src/migrations/run-migrations.sh staging

# Run migrations on PRODUCTION
./src/migrations/run-migrations.sh prod
```

> [!IMPORTANT]
> Always run migrations using the `delux_admin` user (handled automatically by the script) to ensure table ownership and permissions are correct.

## Troubleshooting & Best Practices

### Shell & Password Safety
If you are running manual commands or setting up environment variables, be aware of **shell expansion**. 
- If the `DB_PASSWORD` or any secret contains special characters (like `!`), **ALWAYS** use single quotes to wrap the value.
- **Wrong**: `export DB_PASSWORD=mypass!word` (In zsh, `!` triggers event expansion)
- **Correct**: `export DB_PASSWORD='mypass!word'`

### Permission Denied
If you receive a `permission denied for table migrations` error, it means you are likely connected as the generic `postgres` user instead of the application owner (`delux_admin`). Use the provided `run-migrations.sh` script which selects the correct user.

## Environment Variables

Ensure these are set in your `.env` file for local development:

- `DB_HOST` - Database host
- `DB_PORT` - Database port (default: 5432)
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password

## Creating New Migrations

1. Create a new file with format: `00X_description.ts`
2. Export `up` and `down` functions:

```typescript
import { Pool } from 'pg';

export const up = async (pool: Pool): Promise<void> => {
  // Migration logic
};

export const down = async (pool: Pool): Promise<void> => {
  // Rollback logic
};
```
