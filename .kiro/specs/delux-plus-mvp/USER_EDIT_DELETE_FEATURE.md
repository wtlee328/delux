# User Edit and Delete Feature

## Overview
Added full CRUD (Create, Read, Update, Delete) functionality for user management in the admin panel.

## Backend Changes

### `backend/src/services/userService.ts`

#### New Interface:
```typescript
export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  roles?: ('admin' | 'supplier' | 'agency')[];
}
```

#### New Functions:

**`updateUser(id, updateData)`**:
- Updates user information (name, email, password, roles)
- All fields are optional
- Validates email uniqueness if email is being changed
- Updates `user_roles` table if roles are provided
- Hashes password if provided
- Returns updated user with all roles

**`deleteUser(id)`**:
- Deletes a user by ID
- CASCADE delete automatically removes entries from `user_roles` table
- Throws error if user not found

### `backend/src/routes/admin.ts`

#### New Endpoints:

**PUT /api/admin/users/:id**
- Updates an existing user
- Requires admin authentication
- Request body:
  ```json
  {
    "name": "Updated Name",
    "email": "newemail@example.com",
    "password": "newpassword123",  // optional
    "roles": ["admin", "supplier"]
  }
  ```
- Response: Updated user object
- Status codes:
  - 200: Success
  - 400: Invalid request
  - 404: User not found
  - 409: Email already registered

**DELETE /api/admin/users/:id**
- Deletes a user
- Requires admin authentication
- Response: 204 No Content
- Status codes:
  - 204: Success
  - 404: User not found

## Frontend Changes

### `frontend/src/pages/admin/AdminUsersPage.tsx`

#### New State:
- `editingUser`: Tracks which user is being edited (null for create mode)

#### New Functions:

**`handleEdit(user)`**:
- Opens the form in edit mode
- Pre-fills form with user data
- Sets `editingUser` state

**`handleCancelEdit()`**:
- Closes the form
- Clears form data
- Resets `editingUser` to null

**`handleDelete(userId, userName)`**:
- Shows confirmation dialog
- Calls DELETE endpoint
- Refreshes user list on success

#### Updated Functions:

**`handleSubmit()`**:
- Now handles both create and update
- For edit mode:
  - Calls PUT endpoint
  - Password is optional (only updates if provided)
- For create mode:
  - Calls POST endpoint
  - Password is required

#### UI Changes:

**Form**:
- Title changes based on mode: "新增用戶" or "編輯用戶"
- Password field:
  - Create mode: Required, labeled "臨時密碼"
  - Edit mode: Optional, labeled "新密碼 (留空表示不更改)"
- Submit button text changes: "創建用戶" or "更新用戶"

**User Table**:
- Added "操作" (Actions) column
- Each row has two buttons:
  - "編輯" (Edit): Opens form in edit mode
  - "刪除" (Delete): Deletes user after confirmation

## User Flow

### Editing a User:
1. Admin clicks "編輯" button next to a user
2. Form opens with user's current data pre-filled
3. Admin can modify:
   - Name
   - Email
   - Roles (checkboxes)
   - Password (optional)
4. Admin clicks "更新用戶"
5. User is updated in database
6. User list refreshes
7. Form closes

### Deleting a User:
1. Admin clicks "刪除" button next to a user
2. Confirmation dialog appears: "確定要刪除用戶 "[name]" 嗎？此操作無法撤銷。"
3. If confirmed:
   - User is deleted from database
   - All associated roles are removed (CASCADE)
   - User list refreshes
   - Success message shown

## Security Considerations

- All endpoints require admin authentication
- Email uniqueness is validated on update
- Password is hashed before storage
- Confirmation dialog prevents accidental deletions
- CASCADE delete ensures no orphaned records in `user_roles` table

## API Examples

### Update User
```bash
PUT /api/admin/users/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Updated Name",
  "email": "newemail@example.com",
  "roles": ["admin", "supplier"]
}
```

Response:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "newemail@example.com",
  "name": "Updated Name",
  "role": "admin",
  "roles": ["admin", "supplier"],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-02T00:00:00Z"
}
```

### Delete User
```bash
DELETE /api/admin/users/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer <admin-token>
```

Response: 204 No Content

## Testing Checklist

### Edit User:
- [ ] Click edit button on a user
- [ ] Verify form opens with correct data
- [ ] Change name and save
- [ ] Verify name updated in table
- [ ] Edit user and change email
- [ ] Verify email updated
- [ ] Edit user and add/remove roles
- [ ] Verify roles updated in table
- [ ] Edit user and change password
- [ ] Logout and login with new password
- [ ] Edit user without changing password
- [ ] Verify can still login with old password

### Delete User:
- [ ] Click delete button
- [ ] Verify confirmation dialog appears
- [ ] Click cancel - user should not be deleted
- [ ] Click delete again and confirm
- [ ] Verify user removed from table
- [ ] Verify success message shown
- [ ] Try to login with deleted user - should fail

### Edge Cases:
- [ ] Try to update email to one that already exists
- [ ] Verify error message shown
- [ ] Try to edit user with no roles selected
- [ ] Verify validation error
- [ ] Cancel edit mode
- [ ] Verify form closes and data clears

## Backward Compatibility

- Works with or without `user_roles` table
- If `user_roles` table doesn't exist:
  - Update only modifies `users` table
  - Delete only removes from `users` table
- All existing functionality preserved
