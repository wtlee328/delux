# Database Migrations

This directory contains PostgreSQL database migrations for the Delux+ platform.

## Migration Files

Migrations are executed in alphabetical order:

1. `001_create_users_table.ts` - Creates users table with indexes
2. `002_create_products_table.ts` - Creates products table with indexes
3. `003_create_migrations_table.ts` - Creates migrations tracking table (auto-created by runner)

## Running Migrations

### Development (using ts-node)

```bash
# Run all pending migrations
npm run migrate:dev

# Rollback the last migration
npm run migrate:dev:down
```

### Production (using compiled JavaScript)

```bash
# Build and run migrations
npm run migrate

# Build and rollback last migration
npm run migrate:down
```

## Database Schema

### Users Table

- `id` (UUID, Primary Key)
- `email` (VARCHAR, Unique, Indexed)
- `password_hash` (VARCHAR)
- `name` (VARCHAR)
- `role` (VARCHAR, Indexed) - Values: 'admin', 'supplier', 'agency'
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Products Table

- `id` (UUID, Primary Key)
- `supplier_id` (UUID, Foreign Key → users.id, Indexed)
- `title` (VARCHAR)
- `destination` (VARCHAR, Indexed)
- `duration_days` (INTEGER, Indexed)
- `description` (TEXT)
- `cover_image_url` (VARCHAR)
- `net_price` (DECIMAL)
- `status` (VARCHAR, Indexed) - Values: 'pending', 'published'
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

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

## Environment Variables

Ensure these are set in your `.env` file:

- `DB_HOST` - Database host
- `DB_PORT` - Database port (default: 5432)
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
