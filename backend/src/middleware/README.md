# Authentication Middleware

This directory contains middleware for authentication and authorization.

## Usage

### requireAuth

Verifies JWT token and attaches user information to the request object.

```typescript
import { requireAuth } from '../middleware/auth';

router.get('/protected', requireAuth, (req, res) => {
  // req.user is now available with userId, email, and role
  res.json({ user: req.user });
});
```

### requireRole

Checks if the authenticated user has one of the required roles.

```typescript
import { requireAuth, requireRole } from '../middleware/auth';

// Admin-only route
router.get('/admin/users', requireAuth, requireRole(['admin']), (req, res) => {
  // Only admin users can access this route
});

// Supplier-only route
router.post('/supplier/tours', requireAuth, requireRole(['supplier']), (req, res) => {
  // Only supplier users can access this route
});

// Multiple roles allowed
router.get('/dashboard', requireAuth, requireRole(['admin', 'supplier']), (req, res) => {
  // Both admin and supplier users can access this route
});
```

## Error Responses

### 401 Unauthorized
- Missing or invalid JWT token
- Expired token
- User not authenticated

### 403 Forbidden
- User authenticated but doesn't have required role
- Access denied to resource

## Example Route Protection

```typescript
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Public route - no authentication required
router.get('/public', (req, res) => {
  res.json({ message: 'Public endpoint' });
});

// Protected route - authentication required
router.get('/profile', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// Admin-only route
router.get('/admin/users', requireAuth, requireRole(['admin']), (req, res) => {
  // Admin logic here
});

// Supplier-only route
router.post('/supplier/tours', requireAuth, requireRole(['supplier']), (req, res) => {
  // Supplier logic here
});

// Agency-only route
router.get('/agency/tours', requireAuth, requireRole(['agency']), (req, res) => {
  // Agency logic here
});

export default router;
```
