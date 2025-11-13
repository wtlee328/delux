# Database Seeding Guide

This guide explains how to seed the Delux+ database with initial data.

## Overview

The seeding process includes:
1. **Admin User**: Initial administrator account for platform management
2. **Test Data** (Optional): Sample suppliers, agencies, and products for development/testing

## Prerequisites

- Database migrations must be completed
- Database connection configured in `.env` file
- Backend dependencies installed (`npm install`)

## Creating the Initial Admin User

### Method 1: Using TypeScript Seed Script (Recommended)

Run the admin seed script:

```bash
cd backend
npm run seed:admin
```

Or using ts-node directly:

```bash
cd backend
npx ts-node src/scripts/seed-admin.ts
```

### Method 2: Using Environment Variables

You can customize the admin credentials using environment variables:

```bash
cd backend
ADMIN_EMAIL="your-admin@example.com" \
ADMIN_PASSWORD="YourSecurePassword123!" \
ADMIN_NAME="Your Admin Name" \
npx ts-node src/scripts/seed-admin.ts
```

### Method 3: Using SQL Script

If you prefer direct SQL execution:

1. Generate a password hash using bcrypt (10 salt rounds)
2. Update the hash in `backend/sql/seed-admin.sql`
3. Execute the SQL script:

```bash
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DATABASE -f backend/sql/seed-admin.sql
```

## Default Admin Credentials

**⚠️ SECURITY WARNING: Change these credentials immediately after first login!**

```
Email: admin@deluxplus.com
Password: DeluxAdmin2024!
Name: 帝樂管理員
Role: admin
```

## Creating Test Data (Optional)

For development and testing purposes, you can seed the database with sample data:

```bash
cd backend
npm run seed:test
```

Or using ts-node:

```bash
cd backend
npx ts-node src/scripts/seed-test-data.ts
```

### Test Data Includes

**Suppliers:**
- supplier1@test.com - 東京旅遊供應商
- supplier2@test.com - 首爾旅遊供應商
- supplier3@test.com - 曼谷旅遊供應商

**Agencies:**
- agency1@test.com - 台北旅行社
- agency2@test.com - 高雄旅行社

**All test users have the same password:** `Test1234!`

**Sample Products:**
- 6 tour products across different destinations
- Mix of published and pending status
- Various durations (1-5 days)
- Price range: NT$3,500 - NT$25,000

## NPM Scripts

Add these scripts to `backend/package.json`:

```json
{
  "scripts": {
    "seed:admin": "ts-node src/scripts/seed-admin.ts",
    "seed:test": "ts-node src/scripts/seed-test-data.ts",
    "seed:all": "npm run seed:admin && npm run seed:test"
  }
}
```

## Production Deployment

### Initial Setup

1. Run database migrations:
   ```bash
   npm run migrate
   ```

2. Create admin user with secure credentials:
   ```bash
   ADMIN_EMAIL="admin@deluxplus.com" \
   ADMIN_PASSWORD="$(openssl rand -base64 32)" \
   ADMIN_NAME="帝樂管理員" \
   npm run seed:admin
   ```

3. **IMPORTANT**: Save the generated password securely (password manager, secrets vault)

4. After first login, change the admin password through the UI

### Security Best Practices

1. **Never commit credentials** to version control
2. **Use strong passwords** (minimum 12 characters, mixed case, numbers, symbols)
3. **Store credentials securely** (use a password manager or secrets management service)
4. **Change default passwords** immediately after deployment
5. **Rotate passwords regularly** (every 90 days recommended)
6. **Use environment variables** for sensitive configuration
7. **Enable audit logging** for admin actions (future enhancement)

## Troubleshooting

### Admin User Already Exists

If you see "Admin user already exists", the script will skip creation. To reset:

1. Delete the existing admin user:
   ```sql
   DELETE FROM users WHERE email = 'admin@deluxplus.com';
   ```

2. Run the seed script again

### Connection Errors

Ensure your `.env` file has correct database credentials:

```env
DB_HOST=your-database-host
DB_PORT=5432
DB_NAME=deluxplus
DB_USER=your-username
DB_PASSWORD=your-password
```

### Password Hash Generation

To manually generate a bcrypt hash:

```javascript
const bcrypt = require('bcrypt');
const hash = bcrypt.hashSync('your-password', 10);
console.log(hash);
```

## Verification

After seeding, verify the admin user was created:

```sql
SELECT id, email, name, role, created_at 
FROM users 
WHERE role = 'admin';
```

Test login through the application:
1. Navigate to `/login`
2. Enter admin credentials
3. Verify redirect to `/admin/users`
4. Change password immediately

## Cleanup

To remove all test data (keep admin):

```sql
-- Remove test products
DELETE FROM products WHERE supplier_id IN (
  SELECT id FROM users WHERE email LIKE '%@test.com'
);

-- Remove test users
DELETE FROM users WHERE email LIKE '%@test.com';
```

To remove everything including admin:

```sql
-- Remove all products
DELETE FROM products;

-- Remove all users
DELETE FROM users;
```

## Notes

- The seed scripts are idempotent - they check for existing data before inserting
- Test data uses placeholder image URLs - update with real images if needed
- Sample products have realistic Chinese descriptions and pricing
- Some products are in 'pending' status to test the review workflow
