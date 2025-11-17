# Multi-Role Admin Panel Update

## Changes Made

### Backend: `backend/src/services/userService.ts`

#### Updated Interfaces:
- `CreateUserRequest`: Added optional `roles` array field
- `User`: Added `roles` array field to return all user roles

#### Updated Functions:

**`createUser()`**:
- Now accepts `roles` array in addition to single `role`
- If `roles` is provided, uses it; otherwise falls back to single `role`
- Inserts all roles into `user_roles` table (with error handling if table doesn't exist)
- Returns user with all assigned roles

**`getAllUsers()`**:
- Queries `user_roles` table for each user to get all their roles
- Returns users with complete `roles` array
- Falls back to single `role` if `user_roles` table doesn't exist

**`getUserById()`**:
- Queries `user_roles` table to get all roles for the user
- Returns user with complete `roles` array
- Falls back to single `role` if `user_roles` table doesn't exist

### Frontend: `frontend/src/pages/admin/AdminUsersPage.tsx`

#### Updated Interface:
- `User`: Added `roles` array field

#### Updated Form:
- Changed from single role dropdown to multiple role checkboxes
- Added checkbox group with three options:
  - 當地供應商 (Supplier)
  - 台灣旅行社 (Agency)
  - 帝樂 Admin (Admin)
- Added validation to ensure at least one role is selected
- Added help text "(可選擇多個)" to indicate multiple selection

#### Updated User List:
- Table now displays all roles for each user (comma-separated)
- Shows "Admin, Supplier" instead of just "Admin" for multi-role users

#### New Functions:
- `handleRoleCheckboxChange()`: Toggles role selection in checkboxes

## User Flow

### Creating a Single-Role User:
1. Admin clicks "新增用戶"
2. Fills in email, password, name
3. Checks ONE role checkbox (e.g., "當地供應商")
4. Clicks "創建用戶"
5. User is created with single role
6. User logs in and goes directly to their dashboard

### Creating a Multi-Role User:
1. Admin clicks "新增用戶"
2. Fills in email, password, name
3. Checks MULTIPLE role checkboxes (e.g., "當地供應商" + "帝樂 Admin")
4. Clicks "創建用戶"
5. User is created with multiple roles
6. User logs in and sees role selection screen
7. User chooses which role to use
8. User is redirected to appropriate dashboard

## Testing

### Test Multi-Role User Creation:
1. Login as admin
2. Go to /admin/users
3. Click "新增用戶"
4. Fill in:
   - Email: test@example.com
   - Password: password123
   - Name: Test User
   - Roles: Check both "當地供應商" and "台灣旅行社"
5. Click "創建用戶"
6. Verify user appears in list with "當地供應商, 台灣旅行社"

### Test Multi-Role Login:
1. Logout
2. Login with test@example.com / password123
3. Should see "選擇您的角色" screen
4. Should see two buttons: "供應商" and "旅行社"
5. Click "供應商"
6. Should redirect to /supplier/dashboard

### Test Role Switching:
1. While logged in as supplier
2. Logout
3. Login again with same credentials
4. Choose "旅行社" this time
5. Should redirect to /agency/dashboard

## Backward Compatibility

- Works with or without migration 004
- If `user_roles` table doesn't exist:
  - Falls back to single `role` column
  - No errors thrown
  - Single-role behavior maintained
- If `user_roles` table exists:
  - Multi-role functionality enabled
  - Existing single-role users continue to work
  - New multi-role users can be created

## Database Schema

### Before (Single Role):
```sql
users table:
- id
- email
- password_hash
- name
- role (single value)
```

### After (Multi Role):
```sql
users table:
- id
- email
- password_hash
- name
- role (primary role, for backward compatibility)
- active_role (currently selected role)

user_roles table:
- id
- user_id (FK to users)
- role
- UNIQUE(user_id, role)
```

## API Changes

### POST /api/admin/users

**Request (Single Role)**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name",
  "role": "supplier",
  "roles": ["supplier"]
}
```

**Request (Multi Role)**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name",
  "role": "supplier",
  "roles": ["supplier", "admin"]
}
```

**Response**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "User Name",
  "role": "supplier",
  "roles": ["supplier", "admin"],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### GET /api/admin/users

**Response**:
```json
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "supplier",
    "roles": ["supplier", "admin"],
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```
