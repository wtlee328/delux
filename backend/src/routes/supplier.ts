import { Router, Request, Response } from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from '../middleware/auth';
import { createProduct, getProductsBySupplier, getProductById, updateProduct } from '../services/productService';
import { uploadCoverImage } from '../services/storageService';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Apply authentication and supplier role requirement to all routes
router.use(requireAuth);
router.use(requireRole(['supplier']));

/**
 * POST /api/supplier/tours
 * Create a new tour product
 */
router.post('/tours', upload.single('coverImage'), async (req: Request, res: Response) => {
  try {
    const { title, destination, durationDays, description, netPrice } = req.body;
    const supplierId = req.user!.userId;

    // Validate required fields
    if (!title || !destination || !durationDays || !description || !netPrice) {
      res.status(400).json({
        error: 'All fields are required: title, destination, durationDays, description, netPrice',
      });
      return;
    }

    // Validate cover image
    if (!req.file) {
      res.status(400).json({ error: 'Cover image is required' });
      return;
    }

    // Upload cover image to Cloud Storage
    let coverImageUrl: string;
    try {
      const uploadResult = await uploadCoverImage(req.file);
      coverImageUrl = uploadResult.publicUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Image upload failed';
      res.status(400).json({ error: message });
      return;
    }

    // Create product
    const product = await createProduct({
      supplierId,
      title,
      destination,
      durationDays: parseInt(durationDays),
      description,
      coverImageUrl,
      netPrice: parseFloat(netPrice),
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/supplier/tours
 * Get all tours for the authenticated supplier
 */
router.get('/tours', async (req: Request, res: Response) => {
  try {
    const supplierId = req.user!.userId;
    const products = await getProductsBySupplier(supplierId);
    res.json(products);
  } catch (error) {
    console.error('Get supplier products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/supplier/tours/:id
 * Get a specific tour product for editing
 */
router.get('/tours/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const supplierId = req.user!.userId;
    
    const product = await getProductById(id);
    
    // Verify ownership
    if (product.supplierId !== supplierId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    
    res.json(product);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch product';
    
    if (message === 'Product not found') {
      res.status(404).json({ error: message });
      return;
    }
    
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/supplier/tours/:id
 * Update an existing tour product
 */
router.put('/tours/:id', upload.single('coverImage'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, destination, durationDays, description, netPrice } = req.body;
    const supplierId = req.user!.userId;

    // Build update data
    const updateData: any = {};

    if (title) updateData.title = title;
    if (destination) updateData.destination = destination;
    if (durationDays) updateData.durationDays = parseInt(durationDays);
    if (description) updateData.description = description;
    if (netPrice) updateData.netPrice = parseFloat(netPrice);

    // Handle cover image update if provided
    if (req.file) {
      try {
        const uploadResult = await uploadCoverImage(req.file);
        updateData.coverImageUrl = uploadResult.publicUrl;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Image upload failed';
        res.status(400).json({ error: message });
        return;
      }
    }

    // Update product with ownership validation
    const product = await updateProduct(id, supplierId, updateData);

    res.json(product);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Product update failed';

    if (message === 'Product not found or access denied') {
      res.status(404).json({ error: message });
      return;
    }

    console.error('Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
