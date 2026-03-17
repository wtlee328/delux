import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { createUser, getAllUsers, updateUser, deleteUser } from '../services/userService';

const router = Router();

// Apply authentication and admin role requirement to all routes
router.use(requireAuth);
// Base requirement is admin, but specific routes might require super_admin
router.use(requireRole(['admin']));

/**
 * GET /api/admin/users
 * Get all users (super_admin only)
 */
router.get('/users', requireRole(['super_admin']), async (req: Request, res: Response) => {
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
 * Create a new user (super_admin only)
 */
router.post('/users', requireRole(['super_admin']), async (req: Request, res: Response) => {
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
      if (!['admin', 'supplier', 'agency', 'super_admin'].includes(r)) {
        res.status(400).json({
          error: 'Invalid role. Must be admin, supplier, agency, or super_admin'
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
 * Update a user (super_admin only)
 */
router.put('/users/:id', requireRole(['super_admin']), async (req: Request, res: Response) => {
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
        if (!['admin', 'supplier', 'agency', 'super_admin'].includes(role)) {
          res.status(400).json({
            error: 'Invalid role. Must be admin, supplier, agency, or super_admin'
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
 * Delete a user (super_admin only)
 */
router.delete('/users/:id', requireRole(['super_admin']), async (req: Request, res: Response) => {
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

/**
 * GET /api/admin/trips
 * Get all trips (admin only)
 */
router.get('/trips', async (req: Request, res: Response) => {
  try {
    const { getTripsByStatus } = await import('../services/tripService');
    // For now, let's assume we want to see all statuses OR build a specific list
    // Since getTripsBySupplier exists but we need across all suppliers, 
    // I should probably add a generic getAllTrips to tripService as well.
    // For now, let's use a specific one for review.
    const { default: pool } = await import('../config/database');
    const result = await pool.query("SELECT * FROM supplier_trips WHERE status != '草稿' ORDER BY created_at DESC");
    const mappedTrips = result.rows.map(row => ({
      id: row.id,
      supplierId: row.supplier_id,
      name: row.name,
      destination: row.destination,
      category: row.category,
      daysCount: row.days_count,
      status: row.status,
      rejectionReason: row.rejection_reason,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    res.json(mappedTrips);
  } catch (error) {
    console.error('Get all trips error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/trips/pending
 * Get trips pending review (admin only)
 */
router.get('/trips/pending', async (req: Request, res: Response) => {
  try {
    const { getTripsByStatus } = await import('../services/tripService');
    const trips = await getTripsByStatus('審核中');
    res.json(trips);
  } catch (error) {
    console.error('Get pending trips error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/trips/:id
 * Get trip details (admin only)
 */
router.get('/trips/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { getTripById } = await import('../services/tripService');
    // We need to bypass the supplierId check for admin
    // I will modify getTripById or use a new one. For speed, I'll use a direct query or helper.
    const { default: pool } = await import('../config/database');
    const tripCheck = await pool.query('SELECT supplier_id FROM supplier_trips WHERE id = $1', [id]);
    if (tripCheck.rows.length === 0) return res.status(404).json({ error: 'Trip not found' });
    
    const trip = await getTripById(id, tripCheck.rows[0].supplier_id);
    
    if (trip.status === '草稿') {
      res.status(403).json({ error: 'Access denied: Draft trips can only be viewed by suppliers' });
      return;
    }

    res.json(trip);
  } catch (error) {
    console.error('Get trip error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/admin/trips/:id/status
 * Update trip status (admin approval/rejection)
 */
router.put('/trips/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    const validStatuses = ['草稿', '審核中', '已通過', '已退回'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { updateTripStatus } = await import('../services/tripService');
    const trip = await updateTripStatus(id, status, undefined, rejectionReason);
    res.json(trip);
  } catch (error) {
    console.error('Update trip status error:', error);
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
 * GET /api/admin/tours/pending/count
 * Get count of products pending review (admin only)
 * IMPORTANT: This must come BEFORE /tours/pending and /tours/:id
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
 * GET /api/admin/tours/pending
 * Get products pending review (admin only)
 * IMPORTANT: This must come BEFORE /tours/:id
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
 * GET /api/admin/tours/:id
 * Get tour product details (admin only)
 * IMPORTANT: This must come AFTER specific routes like /tours/pending
 */
router.get('/tours/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { getProductById } = await import('../services/productService');
    const product = await getProductById(id);
    
    if (product.status === '草稿') {
      res.status(403).json({ error: 'Access denied: Draft products can only be viewed by suppliers' });
      return;
    }

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
    const product = await updateProductStatus(id, status, undefined, feedback);

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

/**
 * DELETE /api/admin/tours/:id
 * Delete a tour product (admin only)
 */
router.delete('/tours/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { deleteProduct } = await import('../services/productService');
    await deleteProduct(id);

    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Product deletion failed';

    if (message === 'Product not found') {
      res.status(404).json({ error: message });
      return;
    }

    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
