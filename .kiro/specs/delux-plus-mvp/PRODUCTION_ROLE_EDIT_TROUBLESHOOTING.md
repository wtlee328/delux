# Production Role Edit Troubleshooting Guide

## Issue
Unable to edit user roles in production after deploying the code.

## Root Cause Analysis

The code is correct (SQL queries have proper `$` parameter placeholders), but the issue is likely:

1. **Migration not run in production** - The `user_roles` table doesn't exist
2. **Database connection issue** - Backend can't connect to production database
3. **Silent error** - Errors are being caught but not visible

## Step-by-Step Troubleshooting

### Step 1: Check if Migration Has Been Run

**On your production server**, run:

```bash
cd backend
npm run migrate
```

Expected output if migration needs to run:
```
Starting migrations...
Running migration: 004_add_multi_role_support
Migration 004_add_multi_role_support completed
Migrations completed successfully
```

Expected output if already run:
```
Starting migrations...
Migration 004_add_multi_role_support already applied
Migrations completed successfully
```

### Step 2: Run the Setup Check Script

```bash
cd backend
npx ts-node src/scripts/check-multi-role-setup.ts
```

This will tell you:
- ✅ or ❌ if `user_roles` table exists
- ✅ or ❌ if `active_role` column exists
- ✅ or ❌ if migration 004 has been executed
- Sample data from your database

### Step 3: Check Backend Logs

When you try to edit a user's roles, check the backend console for:

```
Update user request: { id: '...', name: '...', email: '...', hasPassword: false, roles: ['admin', 'supplier'] }
```

If you see this, the request is reaching the backend.

Then look for:
```
Successfully updated roles for user ...: ['admin', 'supplier']
```

If you see this, the roles were updated successfully.

If you see:
```
Error updating user_roles table: ...
user_roles table not found during user update
```

This means the migration hasn't been run.

### Step 4: Manually Check Database

Connect to your production database:

```bash
# Replace with your production database credentials
psql -h your-db-host -U your-db-user -d your-db-name
```

Check if table exists:
```sql
\dt user_roles
```

Should show:
```
 Schema |    Name     | Type  |  Owner   
--------+-------------+-------+----------
 public | user_roles  | table | postgres
```

If it says "Did not find any relation named 'user_roles'", the migration hasn't been run.

Check if active_role column exists:
```sql
\d users
```

Look for `active_role` in the column list.

### Step 5: Check Current User Roles

```sql
SELECT 
  u.id,
  u.email,
  u.name,
  u.role as primary_role,
  u.active_role,
  array_agg(ur.role) as all_roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
GROUP BY u.id, u.email, u.name, u.role, u.active_role;
```

This shows:
- Each user's primary role
- Their active role (if set)
- All their roles from `user_roles` table

### Step 6: Test Role Update Manually

Try updating a user's roles directly in the database:

```sql
-- Get a user ID
SELECT id, email FROM users LIMIT 1;

-- Add multiple roles (replace USER_ID with actual ID)
INSERT INTO user_roles (user_id, role) VALUES 
  ('USER_ID', 'admin'),
  ('USER_ID', 'supplier')
ON CONFLICT (user_id, role) DO NOTHING;

-- Check if it worked
SELECT * FROM user_roles WHERE user_id = 'USER_ID';
```

If this works, the table exists and the issue is in the application code.

If this fails with "relation 'user_roles' does not exist", run the migration.

## Common Issues and Solutions

### Issue 1: Migration Not Run

**Symptoms:**
- Backend logs show "user_roles table not found"
- Database query shows table doesn't exist
- Setup check script shows ❌ for user_roles table

**Solution:**
```bash
cd backend
npm run migrate
```

### Issue 2: Migration File Not Deployed

**Symptoms:**
- Migration command doesn't find migration 004
- Only sees migrations 001, 002, 003

**Solution:**
Make sure `backend/src/migrations/004_add_multi_role_support.ts` is deployed to production.

### Issue 3: Database Connection Issue

**Symptoms:**
- Can't connect to database
- Migration fails with ECONNREFUSED

**Solution:**
Check your database connection settings in production:
- `DATABASE_URL` environment variable
- Database host, port, username, password
- Firewall rules allowing connection

### Issue 4: Roles Update But Don't Show in UI

**Symptoms:**
- Backend logs show "Successfully updated roles"
- Database shows correct roles
- UI still shows old roles

**Solution:**
1. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
2. Check browser console for errors
3. Check if `getAllUsers()` is returning roles correctly
4. Verify the response in Network tab

### Issue 5: Permission Denied

**Symptoms:**
- Migration fails with "permission denied"
- Can't create table

**Solution:**
Make sure your database user has CREATE TABLE permissions:
```sql
GRANT CREATE ON SCHEMA public TO your_db_user;
```

## Quick Fix Commands

### Force Re-run Migration

If you need to re-run the migration:

```sql
-- Remove migration record
DELETE FROM migrations WHERE name LIKE '%004%';

-- Drop tables (WARNING: This deletes data!)
DROP TABLE IF EXISTS user_roles CASCADE;

-- Remove active_role column
ALTER TABLE users DROP COLUMN IF EXISTS active_role;
```

Then run:
```bash
npm run migrate
```

### Manually Create Tables

If migration keeps failing, create tables manually:

```sql
-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'supplier', 'agency')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Add active_role column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS active_role VARCHAR(50) CHECK (active_role IN ('admin', 'supplier', 'agency'));

-- Migrate existing data
INSERT INTO user_roles (user_id, role)
SELECT id, role FROM users
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Set active_role
UPDATE users 
SET active_role = role 
WHERE active_role IS NULL AND role IS NOT NULL;
```

## Verification Checklist

After fixing, verify:

- [ ] Migration 004 shows as executed
- [ ] `user_roles` table exists
- [ ] `active_role` column exists in `users` table
- [ ] Can edit user and add multiple roles in UI
- [ ] Backend logs show "Successfully updated roles"
- [ ] User list shows updated roles
- [ ] Database shows correct roles in `user_roles` table
- [ ] Multi-role user sees role selection screen on login

## Contact Points

If still having issues:

1. **Check backend logs** - Look for error messages
2. **Check browser console** - Look for network errors
3. **Check database logs** - Look for query errors
4. **Run setup check script** - Get diagnostic information

## Production Deployment Checklist

When deploying to production:

- [ ] Build backend: `npm run build`
- [ ] Build frontend: `npm run build`
- [ ] Deploy migration files
- [ ] Run migrations: `npm run migrate`
- [ ] Restart backend server
- [ ] Clear browser cache
- [ ] Test role editing
- [ ] Test multi-role login
