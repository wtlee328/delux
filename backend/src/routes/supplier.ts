import { Router, Request, Response } from 'express';
import multer from 'multer';
import { requireAuth, requireRole } from '../middleware/auth';
import { createProduct, getProductsBySupplier, getProductById, updateProduct, updateProductStatus, ProductStatus } from '../services/productService';
import { uploadCoverImage } from '../services/storageService';
import { createTrip, getTripsBySupplier, getTripById, updateTrip, deleteTrip, updateTripStatus, TripStatus } from '../services/tripService';

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
    console.log('Request body:', req.body);
    console.log('Request file:', req.file ? { name: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype } : 'No file');

    const { title, destination, category, description, netPrice, status, hasShopping, hasTicket, ticketPrice, duration, address, latitude, longitude } = req.body;
    const supplierId = req.user!.userId;

    // Validate status if provided
    const validStatuses: ProductStatus[] = ['草稿', '待審核', '已發佈', '需要修改'];
    const productStatus: ProductStatus = status && validStatuses.includes(status) ? status : '草稿';

    // Validate required fields
    if (!title || !destination || !category || !description || !netPrice) {
      console.error('Missing required fields:', { title: !!title, destination: !!destination, category: !!category, description: !!description, netPrice: !!netPrice });
      res.status(400).json({
        error: 'All fields are required: title, destination, category, description, netPrice',
      });
      return;
    }

    // Validate cover image
    if (!req.file) {
      console.error('No cover image provided');
      res.status(400).json({ error: 'Cover image is required' });
      return;
    }

    // Upload cover image to Cloud Storage
    let coverImageUrl: string;
    try {
      console.log('Uploading cover image...');
      const uploadResult = await uploadCoverImage(req.file);
      coverImageUrl = uploadResult.publicUrl;
      console.log('Cover image uploaded:', coverImageUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Image upload failed';
      console.error('Image upload error:', error);
      res.status(400).json({ error: message });
      return;
    }

    // Create product
    console.log('Creating product in database...');
    const product = await createProduct({
      supplierId,
      title,
      destination,
      category,
      description,
      coverImageUrl,
      netPrice: parseFloat(netPrice),
      hasShopping: hasShopping === 'true' || hasShopping === true,
      hasTicket: hasTicket === 'true' || hasTicket === true,
      ticketPrice: ticketPrice ? parseFloat(ticketPrice) : undefined,
      duration: duration ? parseFloat(duration) : 1.0,
      address,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
    }, productStatus);
    console.log('Product created successfully:', product.id);

    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error details:', errorMessage);
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
    const { title, destination, category, description, netPrice, hasShopping, hasTicket, ticketPrice, duration, address, latitude, longitude } = req.body;
    const supplierId = req.user!.userId;
    const currentUpdatedAt = req.headers['x-updated-at'] as string;
    
    console.log(`[DEBUG] Updating product ${id} from supplier ${supplierId}`);
    console.log(`[DEBUG] Received address: "${address}", lat: ${latitude}, lng: ${longitude}`);

    // Build update data
    const updateData: any = {};

    if (title) updateData.title = title;
    if (destination) updateData.destination = destination;
    if (category) updateData.category = category;
    if (description) updateData.description = description;
    if (netPrice) updateData.netPrice = parseFloat(netPrice);
    if (hasShopping !== undefined) updateData.hasShopping = hasShopping === 'true' || hasShopping === true;
    if (hasTicket !== undefined) updateData.hasTicket = hasTicket === 'true' || hasTicket === true;
    if (ticketPrice !== undefined) updateData.ticketPrice = ticketPrice ? parseFloat(ticketPrice) : null;
    if (duration !== undefined) updateData.duration = parseFloat(duration);
    if (address !== undefined) updateData.address = address;
    if (latitude !== undefined) updateData.latitude = latitude ? parseFloat(latitude) : null;
    if (longitude !== undefined) updateData.longitude = longitude ? parseFloat(longitude) : null;
    if (currentUpdatedAt) updateData.currentUpdatedAt = currentUpdatedAt;

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

    if (message === '產品正在審核中，請先撤回申請後再進行修改。') {
      res.status(403).json({ error: message });
      return;
    }

    if (message === '此產品內容已被更新，請重新載入並審核新版本。') {
      res.status(409).json({ error: message });
      return;
    }

    console.error('Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


/**
 * PUT /api/supplier/tours/:id/status
 * Update product status (for submitting for review or saving as draft)
 */
router.put('/tours/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const supplierId = req.user!.userId;

    // Validate status
    const validStatuses: ProductStatus[] = ['草稿', '待審核'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status. Suppliers can only set status to 草稿 or 待審核' });
      return;
    }

    // Update product status with ownership validation
    const product = await updateProductStatus(id, status, supplierId);

    res.json(product);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Status update failed';

    if (message === 'Product not found or access denied') {
      res.status(404).json({ error: message });
      return;
    }

    console.error('Update product status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/supplier/tours/:id
 * Delete a tour product (supplier only - with ownership validation)
 */
router.delete('/tours/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const supplierId = req.user!.userId;

    const { deleteProduct } = await import('../services/productService');
    await deleteProduct(id, supplierId);

    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Product deletion failed';

    if (message === 'Product not found or access denied') {
      res.status(404).json({ error: message });
      return;
    }

    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/supplier/trips
 * Create a new supplier trip
 */
router.post('/trips', async (req: Request, res: Response) => {
  try {
    const { name, destination, category, daysCount, days } = req.body;
    const supplierId = req.user!.userId;

    if (!name || !category || typeof destination !== 'string' || typeof daysCount !== 'number' || !days) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const trip = await createTrip({ supplierId, name, destination, category, daysCount, days });
    res.status(201).json(trip);
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/supplier/trips
 * Get all trips for the authenticated supplier
 */
router.get('/trips', async (req: Request, res: Response) => {
  try {
    const supplierId = req.user!.userId;
    const trips = await getTripsBySupplier(supplierId);
    res.json(trips);
  } catch (error) {
    console.error('Get supplier trips error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/supplier/trips/:id
 * Get a specific trip for editing
 */
router.get('/trips/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const supplierId = req.user!.userId;
    const trip = await getTripById(id, supplierId);
    res.json(trip);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('not found')) {
      res.status(404).json({ error: message });
      return;
    }
    console.error('Get trip error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/supplier/trips/:id
 * Update an existing trip
 */
router.put('/trips/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const supplierId = req.user!.userId;
    const { name, destination, category, daysCount, days } = req.body;

    const trip = await updateTrip(id, supplierId, { name, destination, category, daysCount, days });
    res.json(trip);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('not found')) {
      res.status(404).json({ error: message });
      return;
    }
    console.error('Update trip error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/supplier/trips/:id
 * Delete a trip
 */
router.delete('/trips/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const supplierId = req.user!.userId;
    
    await deleteTrip(id, supplierId);
    res.status(204).send();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('not found')) {
      res.status(404).json({ error: message });
      return;
    }
    console.error('Delete trip error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/supplier/trips/:id/status
 * Update trip status (submit for review)
 */
router.put('/trips/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const supplierId = req.user!.userId;

    // Validate status - suppliers can only submit for review
    const validStatuses: TripStatus[] = ['草稿', '審核中'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ error: '無效的狀態。供應商僅能將行程設為草稿或提交審核。' });
      return;
    }

    const trip = await updateTripStatus(id, status, supplierId);
    res.json(trip);
  } catch (error: any) {
    const message = error.message;
    if (message.includes('尚未審核通過的產品')) {
      res.status(400).json({ error: message });
      return;
    }
    if (message.includes('not found')) {
      res.status(404).json({ error: message });
      return;
    }
    console.error('Update trip status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
