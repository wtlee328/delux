import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { createUser, getAllUsers } from '../services/userService';

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
    const { email, password, name, role } = req.body;

    // Validate required fields
    if (!email || !password || !name || !role) {
      res.status(400).json({ 
        error: 'All fields are required: email, password, name, role' 
      });
      return;
    }

    // Validate role
    if (!['admin', 'supplier', 'agency'].includes(role)) {
      res.status(400).json({ 
        error: 'Invalid role. Must be admin, supplier, or agency' 
      });
      return;
    }

    // Create user
    const user = await createUser({ email, password, name, role });

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
 * PUT /api/admin/tours/:id/status
 * Update tour product status (admin only)
 */
router.put('/tours/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!status || !['pending', 'published'].includes(status)) {
      res.status(400).json({ error: 'Invalid status. Must be pending or published' });
      return;
    }

    const { updateProductStatus } = await import('../services/productService');
    const product = await updateProductStatus(id, status);

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
