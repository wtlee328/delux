import pool from '../config/database';

export interface CreateProductRequest {
  supplierId: string;
  title: string;
  destination: string;
  durationDays: number;
  description: string;
  coverImageUrl: string;
  netPrice: number;
}

export interface UpdateProductRequest {
  title?: string;
  destination?: string;
  durationDays?: number;
  description?: string;
  coverImageUrl?: string;
  netPrice?: number;
}

export interface Product {
  id: string;
  supplierId: string;
  title: string;
  destination: string;
  durationDays: number;
  description: string;
  coverImageUrl: string;
  netPrice: number;
  status: 'pending' | 'published';
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductWithSupplier extends Product {
  supplierName: string;
}

export interface ProductFilters {
  destination?: string;
  durationDays?: number;
}

/**
 * Create a new product with supplier association
 * @param productData - Product data
 * @returns Created product with status 'pending'
 */
export async function createProduct(productData: CreateProductRequest): Promise<Product> {
  const { supplierId, title, destination, durationDays, description, coverImageUrl, netPrice } = productData;

  const result = await pool.query(
    `INSERT INTO products (supplier_id, title, destination, duration_days, description, cover_image_url, net_price, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
     RETURNING id, supplier_id, title, destination, duration_days, description, cover_image_url, net_price, status, created_at, updated_at`,
    [supplierId, title, destination, durationDays, description, coverImageUrl, netPrice]
  );

  const product = result.rows[0];

  return {
    id: product.id,
    supplierId: product.supplier_id,
    title: product.title,
    destination: product.destination,
    durationDays: product.duration_days,
    description: product.description,
    coverImageUrl: product.cover_image_url,
    netPrice: parseFloat(product.net_price),
    status: product.status,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };
}

/**
 * Update an existing product with ownership validation
 * @param id - Product ID
 * @param supplierId - Supplier ID for ownership validation
 * @param productData - Updated product data
 * @returns Updated product
 * @throws Error if product not found or supplier doesn't own the product
 */
export async function updateProduct(
  id: string,
  supplierId: string,
  productData: UpdateProductRequest
): Promise<Product> {
  // First verify ownership
  const ownershipCheck = await pool.query(
    'SELECT id FROM products WHERE id = $1 AND supplier_id = $2',
    [id, supplierId]
  );

  if (ownershipCheck.rows.length === 0) {
    throw new Error('Product not found or access denied');
  }

  // Build dynamic update query
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (productData.title !== undefined) {
    updates.push(`title = $${paramCount++}`);
    values.push(productData.title);
  }
  if (productData.destination !== undefined) {
    updates.push(`destination = $${paramCount++}`);
    values.push(productData.destination);
  }
  if (productData.durationDays !== undefined) {
    updates.push(`duration_days = $${paramCount++}`);
    values.push(productData.durationDays);
  }
  if (productData.description !== undefined) {
    updates.push(`description = $${paramCount++}`);
    values.push(productData.description);
  }
  if (productData.coverImageUrl !== undefined) {
    updates.push(`cover_image_url = $${paramCount++}`);
    values.push(productData.coverImageUrl);
  }
  if (productData.netPrice !== undefined) {
    updates.push(`net_price = $${paramCount++}`);
    values.push(productData.netPrice);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const result = await pool.query(
    `UPDATE products
     SET ${updates.join(', ')}
     WHERE id = $${paramCount}
     RETURNING id, supplier_id, title, destination, duration_days, description, cover_image_url, net_price, status, created_at, updated_at`,
    values
  );

  const product = result.rows[0];

  return {
    id: product.id,
    supplierId: product.supplier_id,
    title: product.title,
    destination: product.destination,
    durationDays: product.duration_days,
    description: product.description,
    coverImageUrl: product.cover_image_url,
    netPrice: parseFloat(product.net_price),
    status: product.status,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };
}

/**
 * Get all products for a specific supplier
 * @param supplierId - Supplier ID
 * @returns Array of products owned by the supplier
 */
export async function getProductsBySupplier(supplierId: string): Promise<Product[]> {
  const result = await pool.query(
    `SELECT id, supplier_id, title, destination, duration_days, description, cover_image_url, net_price, status, created_at, updated_at
     FROM products
     WHERE supplier_id = $1
     ORDER BY created_at DESC`,
    [supplierId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    supplierId: row.supplier_id,
    title: row.title,
    destination: row.destination,
    durationDays: row.duration_days,
    description: row.description,
    coverImageUrl: row.cover_image_url,
    netPrice: parseFloat(row.net_price),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Get all products for admin view with supplier information
 * @returns Array of all products with supplier names
 */
export async function getAllProducts(): Promise<ProductWithSupplier[]> {
  const result = await pool.query(
    `SELECT p.id, p.supplier_id, p.title, p.destination, p.duration_days, p.description, 
            p.cover_image_url, p.net_price, p.status, p.created_at, p.updated_at,
            u.name as supplier_name
     FROM products p
     JOIN users u ON p.supplier_id = u.id
     ORDER BY p.created_at DESC`
  );

  return result.rows.map((row) => ({
    id: row.id,
    supplierId: row.supplier_id,
    title: row.title,
    destination: row.destination,
    durationDays: row.duration_days,
    description: row.description,
    coverImageUrl: row.cover_image_url,
    netPrice: parseFloat(row.net_price),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    supplierName: row.supplier_name,
  }));
}

/**
 * Get published products with optional filtering for agency view
 * @param filters - Optional filters for destination and duration
 * @returns Array of published products with supplier names
 */
export async function getPublishedProducts(filters?: ProductFilters): Promise<ProductWithSupplier[]> {
  let query = `
    SELECT p.id, p.supplier_id, p.title, p.destination, p.duration_days, p.description, 
           p.cover_image_url, p.net_price, p.status, p.created_at, p.updated_at,
           u.name as supplier_name
    FROM products p
    JOIN users u ON p.supplier_id = u.id
    WHERE p.status = 'published'
  `;

  const values: any[] = [];
  let paramCount = 1;

  if (filters?.destination) {
    query += ` AND p.destination = $${paramCount++}`;
    values.push(filters.destination);
  }

  if (filters?.durationDays) {
    query += ` AND p.duration_days = $${paramCount++}`;
    values.push(filters.durationDays);
  }

  query += ` ORDER BY p.created_at DESC`;

  const result = await pool.query(query, values);

  return result.rows.map((row) => ({
    id: row.id,
    supplierId: row.supplier_id,
    title: row.title,
    destination: row.destination,
    durationDays: row.duration_days,
    description: row.description,
    coverImageUrl: row.cover_image_url,
    netPrice: parseFloat(row.net_price),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    supplierName: row.supplier_name,
  }));
}

/**
 * Get a single product by ID
 * @param id - Product ID
 * @returns Product with supplier information
 * @throws Error if product not found
 */
export async function getProductById(id: string): Promise<ProductWithSupplier> {
  const result = await pool.query(
    `SELECT p.id, p.supplier_id, p.title, p.destination, p.duration_days, p.description, 
            p.cover_image_url, p.net_price, p.status, p.created_at, p.updated_at,
            u.name as supplier_name
     FROM products p
     JOIN users u ON p.supplier_id = u.id
     WHERE p.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new Error('Product not found');
  }

  const row = result.rows[0];

  return {
    id: row.id,
    supplierId: row.supplier_id,
    title: row.title,
    destination: row.destination,
    durationDays: row.duration_days,
    description: row.description,
    coverImageUrl: row.cover_image_url,
    netPrice: parseFloat(row.net_price),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    supplierName: row.supplier_name,
  };
}

/**
 * Update product status (admin only)
 * @param id - Product ID
 * @param status - New status
 * @returns Updated product
 * @throws Error if product not found
 */
export async function updateProductStatus(
  id: string,
  status: 'pending' | 'published'
): Promise<Product> {
  const result = await pool.query(
    `UPDATE products
     SET status = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING id, supplier_id, title, destination, duration_days, description, cover_image_url, net_price, status, created_at, updated_at`,
    [status, id]
  );

  if (result.rows.length === 0) {
    throw new Error('Product not found');
  }

  const product = result.rows[0];

  return {
    id: product.id,
    supplierId: product.supplier_id,
    title: product.title,
    destination: product.destination,
    durationDays: product.duration_days,
    description: product.description,
    coverImageUrl: product.cover_image_url,
    netPrice: parseFloat(product.net_price),
    status: product.status,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };
}
