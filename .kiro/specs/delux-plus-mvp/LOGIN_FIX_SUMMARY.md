# Login Issue Fixes - Summary

## Issues Addressed

### 1. Route Registration Order
**Problem**: The `/select-role` endpoint was defined after `export default router`, causing it to never be registered.
**Fix**: Moved `export default router` to the end of the file after all route definitions.

### 2. Database Migration Compatibility
**Problem**: The code was querying `active_role` column and `user_roles` table that don't exist until migration 004 is run.
**Fix**: Added try-catch blocks to gracefully handle missing columns/tables and fall back to legacy single-role behavior.

## Changes Made

### Backend: `backend/src/services/authService.ts`

#### In `login()` function:
- Wrapped the initial user query in try-catch to handle missing `active_role` column
- Falls back to querying without `active_role` if column doesn't exist
- Wrapped `user_roles` table query in try-catch
- Falls back to single role from `users` table if `user_roles` doesn't exist

#### In `setActiveRole()` function:
- Wrapped `user_roles` table query in try-catch
- Wrapped `active_role` column update in try-catch
- Gracefully handles missing tables/columns

### Backend: `backend/src/routes/auth.ts`
- Moved `export default router` to the end of the file
- Ensures `/select-role` route is properly registered

### Frontend: `frontend/src/contexts/AuthContext.tsx`
- Added console logging for debugging
- Logs login attempts and responses
- Logs errors with full context

### Frontend: `frontend/src/pages/LoginPage.tsx`
- Changed contextual links from clickable to informational
- Updated styling to indicate they're not interactive

## Backward Compatibility

The code now works in three scenarios:

### Scenario 1: Migration Not Run (Legacy)
- `active_role` column doesn't exist
- `user_roles` table doesn't exist
- Falls back to single `role` column in `users` table
- Works exactly like the original implementation

### Scenario 2: Migration Run, Single-Role Users
- New columns/tables exist
- Users have one role
- Redirects directly to appropriate dashboard

### Scenario 3: Migration Run, Multi-Role Users
- New columns/tables exist
- Users have multiple roles in `user_roles` table
- Shows role selection screen
- Allows switching between roles

## Testing Checklist

To verify the fixes work:

1. **Test without migration** (legacy mode):
   ```bash
   # Don't run migration
   # Try logging in with existing user
   # Should work with single role
   ```

2. **Test with migration, single role**:
   ```bash
   cd backend
   npm run migrate
   # Login with single-role user
   # Should redirect directly to dashboard
   ```

3. **Test with migration, multi-role**:
   ```sql
   -- Add multiple roles for a user
   INSERT INTO user_roles (user_id, role) VALUES 
     ('user-uuid', 'supplier'),
     ('user-uuid', 'agency');
   ```
   ```bash
   # Login with multi-role user
   # Should show role selection screen
   # Select a role
   # Should redirect to appropriate dashboard
   ```

## Debugging

If login still doesn't work, check:

1. **Backend is running**: 
   ```bash
   cd backend
   npm run dev
   ```

2. **Database is running**:
   ```bash
   # Check PostgreSQL is running
   psql -U postgres -d delux_plus
   ```

3. **Browser console** (F12 → Console):
   - Look for "Attempting login with:" message
   - Look for "Login response:" message
   - Look for any error messages

4. **Backend console**:
   - Look for "Login error:" messages
   - Look for database connection errors
   - Look for "active_role column not found" or "user_roles table not found" messages

5. **Network tab** (F12 → Network):
   - Check if POST to `/api/auth/login` is being made
   - Check the response status code
   - Check the response body

## Common Issues

### Issue: "Cannot connect to backend"
**Solution**: Make sure backend is running on the correct port (usually 3001)

### Issue: "Database connection refused"
**Solution**: Make sure PostgreSQL is running

### Issue: "Column 'active_role' does not exist"
**Solution**: This should now be handled gracefully, but if you see this error, the try-catch might not be working

### Issue: "Invalid email or password"
**Solution**: Verify user exists in database with correct credentials

### Issue: "User redirects to wrong dashboard"
**Solution**: Check the user's role in the database matches expected role
