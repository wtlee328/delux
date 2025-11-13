# Database Seeding Quick Start

Quick reference for seeding the Delux+ database.

## Prerequisites

✅ Database migrations completed  
✅ Backend `.env` configured with database credentials  
✅ Node.js dependencies installed (`npm install` in backend/)

## Production Deployment

### Option 1: Automated Script (Recommended)

```bash
cd deployment
./seed-production.sh
```

Follow the prompts to:
1. Create admin user
2. Optionally create test data

### Option 2: Manual Commands

```bash
cd backend

# Create admin user
npm run seed:admin

# Create test data (optional)
npm run seed:test

# Create both
npm run seed:all
```

### Option 3: Custom Credentials

```bash
cd backend

ADMIN_EMAIL="your-admin@example.com" \
ADMIN_PASSWORD="YourSecurePassword123!" \
ADMIN_NAME="Your Admin Name" \
npm run seed:admin
```

## Default Credentials

### Admin Account
```
Email: admin@deluxplus.com
Password: DeluxAdmin2024!
```

⚠️ **CHANGE PASSWORD IMMEDIATELY AFTER FIRST LOGIN**

### Test Accounts (if test data created)
```
Password (all): Test1234!

Suppliers:
- supplier1@test.com (東京旅遊供應商)
- supplier2@test.com (首爾旅遊供應商)
- supplier3@test.com (曼谷旅遊供應商)

Agencies:
- agency1@test.com (台北旅行社)
- agency2@test.com (高雄旅行社)
```

## Verification

### 1. Check Database

```sql
-- Connect to database
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DATABASE

-- Verify admin user
SELECT id, email, name, role, created_at 
FROM users 
WHERE role = 'admin';

-- Count users by role
SELECT role, COUNT(*) 
FROM users 
GROUP BY role;

-- Count products by status
SELECT status, COUNT(*) 
FROM products 
GROUP BY status;
```

### 2. Test Login

1. Navigate to your application URL
2. Go to `/login`
3. Enter admin credentials
4. Verify redirect to `/admin/users`
5. **Change password immediately**

### 3. Test Product Flow (if test data created)

1. Login as supplier (supplier1@test.com)
2. View dashboard - should see products
3. Login as agency (agency1@test.com)
4. View dashboard - should see published products
5. Test filtering by destination/duration

## Troubleshooting

### "Admin user already exists"

The script is idempotent. If admin exists, it skips creation.

To reset:
```sql
DELETE FROM users WHERE email = 'admin@deluxplus.com';
```

Then run seed script again.

### Connection Error

Check your `.env` file:
```bash
DB_HOST=your-host
DB_PORT=5432
DB_NAME=delux_plus
DB_USER=your-user
DB_PASSWORD=your-password
```

For Cloud SQL:
```bash
# Start Cloud SQL Proxy
cd deployment
./cloud_sql_proxy --port 5432 PROJECT:REGION:INSTANCE &

# Use localhost in .env
DB_HOST=localhost
DB_PORT=5432
```

### Password Hash Error

Ensure bcrypt is installed:
```bash
cd backend
npm install bcrypt @types/bcrypt
```

## Security Checklist

After seeding:

- [ ] Admin credentials saved in password manager
- [ ] Default password changed via UI
- [ ] Test accounts removed (if production)
- [ ] Credentials file not committed to git
- [ ] Database backups configured
- [ ] Access logs reviewed

## Cleanup

### Remove Test Data Only

```sql
-- Remove test products
DELETE FROM products WHERE supplier_id IN (
  SELECT id FROM users WHERE email LIKE '%@test.com'
);

-- Remove test users
DELETE FROM users WHERE email LIKE '%@test.com';
```

### Remove All Data (Reset)

```sql
-- Remove all products
DELETE FROM products;

-- Remove all users
DELETE FROM users;
```

Then re-run seed scripts.

## Next Steps

1. ✅ Seed database
2. ✅ Verify admin login
3. ✅ Change admin password
4. Create real supplier/agency accounts via admin UI
5. Test complete product workflow
6. Remove test data (if production)
7. Document credentials securely

## Support

- Full documentation: [../backend/SEEDING.md](../backend/SEEDING.md)
- Deployment guide: [README.md](./README.md)
- Credentials template: [../backend/CREDENTIALS.template.md](../backend/CREDENTIALS.template.md)
