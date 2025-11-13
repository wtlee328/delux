import request from 'supertest';
import express from 'express';
import supplierRoutes from '../../routes/supplier';
import adminRoutes from '../../routes/admin';
import agencyRoutes from '../../routes/agency';
import * as productService from '../../services/productService';
import * as storageService from '../../services/storageService';
import { generateToken } from '../../utils/jwt';

// Mock the services
jest.mock('../../services/productService');
jest.mock('../../services/storageService');

const app = express();
app.use(express.json());
app.use('/api/supplier', supplierRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/agency', agencyRoutes);

describe('Product API Routes', () => {
  const mockSupplierToken = generateToken({
    userId: 'supplier-123',
    email: 'supplier@example.com',
    role: 'supplier',
  });

  const mockAdminToken = generateToken({
    userId: 'admin-123',
    email: 'admin@example.com',
    role: 'admin',
  });

  const mockAgencyToken = generateToken({
    userId: 'agency-123',
    email: 'agency@example.com',
    role: 'agency',
  });

  const mockProduct = {
    id: 'product-123',
    supplierId: 'supplier-123',
    title: 'Tokyo Adventure',
    destination: 'Tokyo',
    durationDays: 5,
    description: '<p>Amazing tour</p>',
    coverImageUrl: 'https://storage.googleapis.com/bucket/image.jpg',
    netPrice: 50000,
    status: 'pending' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProductWithSupplier = {
    ...mockProduct,
    supplierName: 'Test Supplier',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Supplier Routes', () => {
    describe('POST /api/supplier/tours', () => {
      it('should create a product with image upload', async () => {
        (storageService.uploadCoverImage as jest.Mock).mockResolvedValue({
          publicUrl: 'https://storage.googleapis.com/bucket/image.jpg',
          filename: 'image.jpg',
        });
        (productService.createProduct as jest.Mock).mockResolvedValue(mockProduct);

        const response = await request(app)
          .post('/api/supplier/tours')
          .set('Authorization', `Bearer ${mockSupplierToken}`)
          .field('title', 'Tokyo Adventure')
          .field('destination', 'Tokyo')
          .field('durationDays', '5')
          .field('description', '<p>Amazing tour</p>')
          .field('netPrice', '50000')
          .attach('coverImage', Buffer.from('fake-image'), 'test.jpg')
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.status).toBe('pending');
        expect(storageService.uploadCoverImage).toHaveBeenCalled();
        expect(productService.createProduct).toHaveBeenCalled();
      });

      it('should return 400 for missing required fields', async () => {
        const response = await request(app)
          .post('/api/supplier/tours')
          .set('Authorization', `Bearer ${mockSupplierToken}`)
          .field('title', 'Tokyo Adventure')
          .expect(400);

        expect(response.body.error).toContain('required');
      });

      it('should return 400 for missing cover image', async () => {
        const response = await request(app)
          .post('/api/supplier/tours')
          .set('Authorization', `Bearer ${mockSupplierToken}`)
          .field('title', 'Tokyo Adventure')
          .field('destination', 'Tokyo')
          .field('durationDays', '5')
          .field('description', '<p>Amazing tour</p>')
          .field('netPrice', '50000')
          .expect(400);

        expect(response.body.error).toBe('Cover image is required');
      });

      it('should return 401 without authentication', async () => {
        await request(app)
          .post('/api/supplier/tours')
          .field('title', 'Tokyo Adventure')
          .expect(401);
      });
    });

    describe('GET /api/supplier/tours', () => {
      it('should get all products for authenticated supplier', async () => {
        (productService.getProductsBySupplier as jest.Mock).mockResolvedValue([mockProduct]);

        const response = await request(app)
          .get('/api/supplier/tours')
          .set('Authorization', `Bearer ${mockSupplierToken}`)
          .expect(200);

        expect(response.body).toHaveLength(1);
        expect(response.body[0].title).toBe('Tokyo Adventure');
        expect(productService.getProductsBySupplier).toHaveBeenCalledWith('supplier-123');
      });
    });

    describe('PUT /api/supplier/tours/:id', () => {
      it('should update product with ownership validation', async () => {
        const updatedProduct = { ...mockProduct, title: 'Updated Tokyo Adventure' };
        (productService.updateProduct as jest.Mock).mockResolvedValue(updatedProduct);

        const response = await request(app)
          .put('/api/supplier/tours/product-123')
          .set('Authorization', `Bearer ${mockSupplierToken}`)
          .field('title', 'Updated Tokyo Adventure')
          .expect(200);

        expect(response.body.title).toBe('Updated Tokyo Adventure');
        expect(productService.updateProduct).toHaveBeenCalledWith(
          'product-123',
          'supplier-123',
          expect.any(Object)
        );
      });

      it('should return 404 for non-owned product', async () => {
        (productService.updateProduct as jest.Mock).mockRejectedValue(
          new Error('Product not found or access denied')
        );

        await request(app)
          .put('/api/supplier/tours/other-product')
          .set('Authorization', `Bearer ${mockSupplierToken}`)
          .field('title', 'Updated Title')
          .expect(404);
      });
    });
  });

  describe('Admin Routes', () => {
    describe('GET /api/admin/tours', () => {
      it('should get all products for admin', async () => {
        (productService.getAllProducts as jest.Mock).mockResolvedValue([mockProductWithSupplier]);

        const response = await request(app)
          .get('/api/admin/tours')
          .set('Authorization', `Bearer ${mockAdminToken}`)
          .expect(200);

        expect(response.body).toHaveLength(1);
        expect(response.body[0]).toHaveProperty('supplierName');
        expect(productService.getAllProducts).toHaveBeenCalled();
      });

      it('should return 403 for non-admin users', async () => {
        await request(app)
          .get('/api/admin/tours')
          .set('Authorization', `Bearer ${mockSupplierToken}`)
          .expect(403);
      });
    });

    describe('GET /api/admin/tours/:id', () => {
      it('should get product details', async () => {
        (productService.getProductById as jest.Mock).mockResolvedValue(mockProductWithSupplier);

        const response = await request(app)
          .get('/api/admin/tours/product-123')
          .set('Authorization', `Bearer ${mockAdminToken}`)
          .expect(200);

        expect(response.body.id).toBe('product-123');
        expect(productService.getProductById).toHaveBeenCalledWith('product-123');
      });

      it('should return 404 for non-existent product', async () => {
        (productService.getProductById as jest.Mock).mockRejectedValue(
          new Error('Product not found')
        );

        await request(app)
          .get('/api/admin/tours/non-existent')
          .set('Authorization', `Bearer ${mockAdminToken}`)
          .expect(404);
      });
    });

    describe('PUT /api/admin/tours/:id/status', () => {
      it('should update product status from pending to published', async () => {
        const publishedProduct = { ...mockProduct, status: 'published' as const };
        (productService.updateProductStatus as jest.Mock).mockResolvedValue(publishedProduct);

        const response = await request(app)
          .put('/api/admin/tours/product-123/status')
          .set('Authorization', `Bearer ${mockAdminToken}`)
          .send({ status: 'published' })
          .expect(200);

        expect(response.body.status).toBe('published');
        expect(productService.updateProductStatus).toHaveBeenCalledWith('product-123', 'published');
      });

      it('should return 400 for invalid status', async () => {
        const response = await request(app)
          .put('/api/admin/tours/product-123/status')
          .set('Authorization', `Bearer ${mockAdminToken}`)
          .send({ status: 'invalid' })
          .expect(400);

        expect(response.body.error).toContain('Invalid status');
      });
    });
  });

  describe('Agency Routes', () => {
    describe('GET /api/agency/tours', () => {
      it('should get published products', async () => {
        const publishedProduct = { ...mockProductWithSupplier, status: 'published' as const };
        (productService.getPublishedProducts as jest.Mock).mockResolvedValue([publishedProduct]);

        const response = await request(app)
          .get('/api/agency/tours')
          .set('Authorization', `Bearer ${mockAgencyToken}`)
          .expect(200);

        expect(response.body).toHaveLength(1);
        expect(response.body[0].status).toBe('published');
        expect(productService.getPublishedProducts).toHaveBeenCalledWith({});
      });

      it('should filter by destination', async () => {
        (productService.getPublishedProducts as jest.Mock).mockResolvedValue([]);

        await request(app)
          .get('/api/agency/tours?destination=Tokyo')
          .set('Authorization', `Bearer ${mockAgencyToken}`)
          .expect(200);

        expect(productService.getPublishedProducts).toHaveBeenCalledWith({
          destination: 'Tokyo',
        });
      });

      it('should filter by duration', async () => {
        (productService.getPublishedProducts as jest.Mock).mockResolvedValue([]);

        await request(app)
          .get('/api/agency/tours?durationDays=5')
          .set('Authorization', `Bearer ${mockAgencyToken}`)
          .expect(200);

        expect(productService.getPublishedProducts).toHaveBeenCalledWith({
          durationDays: 5,
        });
      });

      it('should filter by both destination and duration', async () => {
        (productService.getPublishedProducts as jest.Mock).mockResolvedValue([]);

        await request(app)
          .get('/api/agency/tours?destination=Tokyo&durationDays=5')
          .set('Authorization', `Bearer ${mockAgencyToken}`)
          .expect(200);

        expect(productService.getPublishedProducts).toHaveBeenCalledWith({
          destination: 'Tokyo',
          durationDays: 5,
        });
      });

      it('should return 403 for non-agency users', async () => {
        await request(app)
          .get('/api/agency/tours')
          .set('Authorization', `Bearer ${mockSupplierToken}`)
          .expect(403);
      });
    });

    describe('GET /api/agency/tours/:id', () => {
      it('should get published product details', async () => {
        const publishedProduct = { ...mockProductWithSupplier, status: 'published' as const };
        (productService.getProductById as jest.Mock).mockResolvedValue(publishedProduct);

        const response = await request(app)
          .get('/api/agency/tours/product-123')
          .set('Authorization', `Bearer ${mockAgencyToken}`)
          .expect(200);

        expect(response.body.id).toBe('product-123');
      });

      it('should return 404 for pending products', async () => {
        (productService.getProductById as jest.Mock).mockResolvedValue(mockProductWithSupplier);

        await request(app)
          .get('/api/agency/tours/product-123')
          .set('Authorization', `Bearer ${mockAgencyToken}`)
          .expect(404);
      });
    });
  });
});
