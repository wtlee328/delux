import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { getPublishedProducts, getProductById } from '../services/productService';

const router = Router();

// Apply authentication and agency role requirement to all routes
router.use(requireAuth);
router.use(requireRole(['agency']));

/**
 * GET /api/agency/tours
 * Get all published tour products with optional filtering
 */
router.get('/tours', async (req: Request, res: Response) => {
  try {
    const { destination, durationDays } = req.query;

    // Build filters
    const filters: any = {};

    if (destination && typeof destination === 'string') {
      filters.destination = destination;
    }

    if (durationDays) {
      const duration = parseInt(durationDays as string);
      if (!isNaN(duration)) {
        filters.durationDays = duration;
      }
    }

    const products = await getPublishedProducts(filters);
    res.json(products);
  } catch (error) {
    console.error('Get published products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/agency/tours/:id
 * Get tour product details
 */
router.get('/tours/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await getProductById(id);

    // Verify product is published (agencies should only see published products)
    if (product.status !== '已發佈') {
      res.status(404).json({ error: 'Product not found' });
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

export default router;
