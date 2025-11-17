import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { createUser, getAllUsers, updateUser, deleteUser } from '../services/userService';

const router = Router();

// Apply authentication and admin role requirement to all routes
router.use(requireAuth);
router.use(requireRole(['admin']));

/**
 * GET /api/admin/users
 * Get all users (admin only)
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/admin/users
 * Create a new user (admin only)
 */
router.post('/users', async (req: Request, res: Response) => {
  try {
    const { email, password, name, role, roles } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      res.status(400).json({ 
        error: 'Required fields: email, password, name' 
      });
      return;
    }

    // Validate roles array or single role
    const userRoles = roles && roles.length > 0 ? roles : [role];
    if (userRoles.length === 0) {
      res.status(400).json({ 
        error: 'At least one role is required' 
      });
      return;
    }

    // Validate each role
    for (const r of userRoles) {
      if (!['admin', 'supplier', 'agency'].includes(r)) {
        res.status(400).json({ 
          error: 'Invalid role. Must be admin, supplier, or agency' 
        });
        return;
      }
    }

    // Create user
    const user = await createUser({ email, password, name, role: userRoles[0], roles: userRoles });

    res.status(201).json(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'User creation failed';

    // Handle duplicate email error
    if (message === 'Email already registered') {
      res.status(409).json({ error: message });
      return;
    }

    // Handle other errors
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/admin/users/:id
 * Update a user (admin only)
 */
router.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, password, roles } = req.body;

    console.log('Update user request:', { id, name, email, hasPassword: !!password, roles });

    // Validate at least one field to update
    if (!name && !email && !password && !roles) {
      res.status(400).json({ 
        error: 'At least one field must be provided to update' 
      });
      return;
    }

    // Validate roles if provided
    if (roles) {
      if (!Array.isArray(roles) || roles.length === 0) {
        res.status(400).json({ 
          error: 'Roles must be a non-empty array' 
        });
        return;
      }

      for (const role of roles) {
        if (!['admin', 'supplier', 'agency'].includes(role)) {
          res.status(400).json({ 
            error: 'Invalid role. Must be admin, supplier, or agency' 
          });
          return;
        }
      }
    }

    // Update user
    const user = await updateUser(id, { name, email, password, roles });

    res.json(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'User update failed';

    if (message === 'User not found') {
      res.status(404).json({ error: message });
      return;
    }

    if (message === 'Email already registered') {
      res.status(409).json({ error: message });
      return;
    }

    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete a user (admin only)
 */
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await deleteUser(id);

    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'User deletion failed';

    if (message === 'User not found') {
      res.status(404).json({ error: message });
      return;
    }

    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

/**
 * GET /api/admin/tours
 * Get all tour products (admin only)
 */
router.get('/tours', async (req: Request, res: Response) => {
  try {
    const { getAllProducts } = await import('../services/productService');
    const products = await getAllProducts();
    res.json(products);
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/tours/:id
 * Get tour product details (admin only)
 */
router.get('/tours/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { getProductById } = await import('../services/productService');
    const product = await getProductById(id);
    res.json(product);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get product';

    if (message === 'Product not found') {
      res.status(404).json({ error: message });
      return;
    }

    console.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/tours/pending
 * Get products pending review (admin only)
 */
router.get('/tours/pending', async (req: Request, res: Response) => {
  try {
    const { getProductsByStatus } = await import('../services/productService');
    const products = await getProductsByStatus('待審核');
    res.json(products);
  } catch (error) {
    console.error('Get pending products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/tours/pending/count
 * Get count of products pending review (admin only)
 */
router.get('/tours/pending/count', async (req: Request, res: Response) => {
  try {
    const { getProductCountByStatus } = await import('../services/productService');
    const count = await getProductCountByStatus('待審核');
    res.json({ count });
  } catch (error) {
    console.error('Get pending count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/admin/tours/:id/status
 * Update tour product status (admin only)
 */
router.put('/tours/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, feedback } = req.body;

    // Validate status
    const validStatuses = ['草稿', '待審核', '已發佈', '需要修改'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status. Must be one of: 草稿, 待審核, 已發佈, 需要修改' });
      return;
    }

    // Require feedback for revision requests
    if (status === '需要修改' && !feedback) {
      res.status(400).json({ error: 'Feedback is required when requesting revisions' });
      return;
    }

    const { updateProductStatus } = await import('../services/productService');
    const product = await updateProductStatus(id, status);

    // TODO: In task 17.5, send email notification with feedback if status is '需要修改'

    res.json(product);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update status';

    if (message === 'Product not found') {
      res.status(404).json({ error: message });
      return;
    }

    console.error('Update product status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
