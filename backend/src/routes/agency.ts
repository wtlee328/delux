import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { getPublishedProducts, getProductById } from '../services/productService';
import { getApprovedTrips, getApprovedTripById } from '../services/tripService';
import pool from '../config/database';

const router = Router();

// Apply authentication and agency role requirement to all routes
router.use(requireAuth);
router.use(requireRole(['agency']));

/**
 * GET /api/agency/suppliers
 * Get list of all suppliers, optionally filtered by destination
 */
router.get('/suppliers', async (req: Request, res: Response) => {
  try {
    const { destination } = req.query;
    console.log(`[API] Fetching suppliers for destination: ${destination || 'none'}`);
    
    let query = "SELECT id, name FROM users WHERE role = 'supplier' AND (is_deleted = FALSE OR is_deleted IS NULL)";
    let values: any[] = [];
    
    if (destination && typeof destination === 'string') {
      // Return only suppliers who have products in the specified destination
      query = `
        SELECT DISTINCT u.id, u.name 
        FROM users u 
        INNER JOIN products p ON u.id = p.supplier_id 
        WHERE u.role = 'supplier' 
        AND (u.is_deleted = FALSE OR u.is_deleted IS NULL)
        AND p.destination = $1
      `;
      values = [destination];
    }
    
    query += " ORDER BY name";
    
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/agency/tours
 * Get all published tour products with optional filtering
 */
router.get('/tours', async (req: Request, res: Response) => {
  try {
    const { destination, category } = req.query;

    // Build filters
    const filters: any = {};

    if (destination && typeof destination === 'string') {
      filters.destination = destination;
    }

    if (category && typeof category === 'string') {
      filters.category = category;
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

/**
 * GET /api/agency/trips
 * Get approved supplier trips with optional search and filtering
 */
router.get('/trips', async (req: Request, res: Response) => {
  try {
    const { search, daysCount, destination } = req.query;

    const filters: {
      search?: string;
      daysCount?: number;
      destination?: string;
    } = {};

    if (search && typeof search === 'string') {
      filters.search = search;
    }

    if (daysCount && typeof daysCount === 'string') {
      const parsed = parseInt(daysCount, 10);
      if (!isNaN(parsed)) {
        filters.daysCount = parsed;
      }
    }

    if (destination && typeof destination === 'string') {
      filters.destination = destination;
    }

    const trips = await getApprovedTrips(filters);
    res.json(trips);
  } catch (error) {
    console.error('Get approved trips error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/agency/trips/:id
 * Get approved trip details for preloading into itinerary planner
 */
router.get('/trips/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const trip = await getApprovedTripById(id);
    res.json(trip);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get trip';

    if (message === 'Trip not found') {
      res.status(404).json({ error: message });
      return;
    }

    console.error('Get trip error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
