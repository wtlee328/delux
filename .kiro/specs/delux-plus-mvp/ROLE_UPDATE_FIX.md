# Role Update Fix

## Issue
Users were unable to edit roles for existing accounts. When trying to add more roles to an existing account, the changes were not being saved to the database.

## Root Cause
The autofix had already corrected the SQL parameter placeholders (adding `$` signs), so the SQL queries were correct. The issue is likely one of the following:

1. **Migration not run**: The `user_roles` table doesn't exist yet
2. **Database connection issue**: The backend can't connect to the database
3. **Frontend not sending roles**: The roles array isn't being sent in the request

## Fixes Applied

### Backend: `backend/src/services/userService.ts`

**Added better error logging**:
```typescript
try {
  // Delete existing roles
  await pool.query('DELETE FROM user_roles WHERE user_id = $1', [id]);

  // Insert new roles
  for (const role of roles) {
    await pool.query(
      `INSERT INTO user_roles (user_id, role)
       VALUES ($1, $2)
       ON CONFLICT (user_id, role) DO NOTHING`,
      [id, role]
    );
  }
  console.log(`Successfully updated roles for user ${id}:`, roles);
} catch (error) {
  console.error('Error updating user_roles table:', error);
  console.log('user_roles table not found during user update');
}
```

### Backend: `backend/src/routes/admin.ts`

**Added request logging**:
```typescript
console.log('Update user request:', { id, name, email, hasPassword: !!password, roles });
```

## Verification Steps

### 1. Check if Migration Has Been Run

```bash
cd backend
npm run migrate
```

Expected output:
```
Starting migrations...
Running migration: 001_create_users_table
Running migration: 002_create_products_table
Running migration: 003_add_product_status
Running migration: 004_add_multi_role_support
Migrations completed successfully
```

If you see "Migration 004 already applied", that's good - it means the table exists.

### 2. Verify Database Schema

Connect to your database and check if the `user_roles` table exists:

```sql
\dt user_roles
```

Should show:
```
 Schema |    Name     | Type  |  Owner   
--------+-------------+-------+----------
 public | user_roles  | table | postgres
```

Check the table structure:
```sql
\d user_roles
```

Should show:
```
                Table "public.user_roles"
  Column   |            Type             | Modifiers 
-----------+-----------------------------+-----------
 id        | uuid                        | not null default gen_random_uuid()
 user_id   | uuid                        | not null
 role      | character varying(50)       | not null
 created_at| timestamp without time zone | default CURRENT_TIMESTAMP
```

### 3. Test Role Update

1. **Start the backend server**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Login as admin** and go to user management

3. **Edit a user** and change their roles

4. **Check backend console** for logs:
   ```
   Update user request: { id: '...', name: '...', email: '...', hasPassword: false, roles: ['admin', 'supplier'] }
   Successfully updated roles for user ...: ['admin', 'supplier']
   ```

5. **Check the user list** - roles should be updated

6. **Verify in database**:
   ```sql
   SELECT u.email, u.name, ur.role 
   FROM users u 
   LEFT JOIN user_roles ur ON u.id = ur.user_id 
   WHERE u.email = 'test@example.com';
   ```

### 4. Test Multi-Role Login

1. **Logout** from admin account

2. **Login** with the multi-role user

3. **Should see** "選擇您的角色" (Choose Your Role) screen

4. **Select a role** and verify redirect to correct dashboard

## Common Issues and Solutions

### Issue: "user_roles table not found"

**Solution**: Run the migration:
```bash
cd backend
npm run migrate
```

### Issue: "Migration failed: ECONNREFUSED"

**Solution**: Start PostgreSQL:
```bash
# macOS with Homebrew
brew services start postgresql

# Or check if it's running
pg_isready
```

### Issue: Roles update but don't show in UI

**Solution**: 
1. Check browser console for errors
2. Refresh the page
3. Check if `getAllUsers()` is returning roles correctly

### Issue: Can't see role selection screen after login

**Solution**:
1. Verify user has multiple roles in database:
   ```sql
   SELECT * FROM user_roles WHERE user_id = 'user-id-here';
   ```
2. Check browser console for login response
3. Verify `LoginResponse` includes `roles` array

## Testing Checklist

- [ ] Migration 004 has been run successfully
- [ ] `user_roles` table exists in database
- [ ] Backend server is running
- [ ] Can edit user and add multiple roles
- [ ] Backend logs show "Successfully updated roles"
- [ ] User list shows updated roles
- [ ] Database shows correct roles in `user_roles` table
- [ ] Multi-role user sees role selection screen on login
- [ ] Can switch between roles by logging out and back in

## Debug Commands

### Check backend logs:
```bash
# In backend directory
npm run dev
# Watch for console.log output
```

### Check database directly:
```sql
-- See all users and their roles
SELECT 
  u.id,
  u.email,
  u.name,
  u.role as primary_role,
  array_agg(ur.role) as all_roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
GROUP BY u.id, u.email, u.name, u.role;
```

### Test API directly with curl:
```bash
# Login as admin
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'

# Update user roles (replace TOKEN and USER_ID)
curl -X PUT http://localhost:3001/api/admin/users/USER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"roles":["admin","supplier"]}'
```

## Expected Behavior After Fix

1. **Edit user roles**: Admin can check/uncheck role checkboxes
2. **Save changes**: Clicking "更新用戶" saves the new roles
3. **See updated roles**: User list shows all roles (comma-separated)
4. **Database updated**: `user_roles` table has correct entries
5. **Multi-role login**: User with multiple roles sees role selection screen
6. **Role switching**: User can logout and login to switch roles
