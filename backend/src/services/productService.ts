import pool from '../config/database';

export interface CreateProductRequest {
  supplierId: string;
  title: string;
  destination: string;
  category: string;
  description: string;
  coverImageUrl: string;
  netPrice: number;
  hasShopping: boolean;
  hasTicket: boolean;
  ticketPrice?: number;
  duration: number;
}

export interface UpdateProductRequest {
  title?: string;
  destination?: string;
  category?: string;
  description?: string;
  coverImageUrl?: string;
  netPrice?: number;
  hasShopping?: boolean;
  hasTicket?: boolean;
  ticketPrice?: number;
  duration?: number;
}

export type ProductStatus = '草稿' | '待審核' | '已發佈' | '需要修改';

export interface Product {
  id: string;
  supplierId: string;
  title: string;
  destination: string;
  category: string;
  description: string;
  coverImageUrl: string;
  netPrice: number;
  hasShopping: boolean;
  hasTicket: boolean;
  ticketPrice?: number;
  duration: number;
  status: ProductStatus;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductWithSupplier extends Product {
  supplierName: string;
}

export interface ProductFilters {
  destination?: string;
  category?: string;
}

/**
 * Create a new product with supplier association
 * @param productData - Product data
 * @param status - Initial status (defaults to '草稿')
 * @returns Created product
 */
export async function createProduct(
  productData: CreateProductRequest,
  status: ProductStatus = '草稿'
): Promise<Product> {
  const {
    supplierId, title, destination, category, description,
    coverImageUrl, netPrice, hasShopping, hasTicket, ticketPrice, duration
  } = productData;

  const result = await pool.query(
    `INSERT INTO products (
       supplier_id, title, destination, category, description, 
       cover_image_url, net_price, has_shopping, has_ticket, 
       ticket_price, duration, status
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING id, supplier_id, title, destination, category, description, 
               cover_image_url, net_price, has_shopping, has_ticket, 
               ticket_price, duration, status, rejection_reason, created_at, updated_at`,
    [
      supplierId, title, destination, category, description,
      coverImageUrl, netPrice, hasShopping, hasTicket,
      ticketPrice || null, duration, status
    ]
  );

  const product = result.rows[0];

  return {
    id: product.id,
    supplierId: product.supplier_id,
    title: product.title,
    destination: product.destination,
    category: product.category,
    description: product.description,
    coverImageUrl: product.cover_image_url,
    netPrice: parseFloat(product.net_price),
    hasShopping: product.has_shopping,
    hasTicket: product.has_ticket,
    ticketPrice: product.ticket_price ? parseFloat(product.ticket_price) : undefined,
    duration: parseFloat(product.duration),
    status: product.status,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };
}

/**
 * Update an existing product with ownership validation (excluding soft-deleted products)
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
  // First verify ownership and that product is not soft-deleted
  const ownershipCheck = await pool.query(
    'SELECT id FROM products WHERE id = $1 AND supplier_id = $2 AND (is_deleted = FALSE OR is_deleted IS NULL)',
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
  if (productData.category !== undefined) {
    updates.push(`category = $${paramCount++}`);
    values.push(productData.category);
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
  if (productData.hasShopping !== undefined) {
    updates.push(`has_shopping = $${paramCount++}`);
    values.push(productData.hasShopping);
  }
  if (productData.hasTicket !== undefined) {
    updates.push(`has_ticket = $${paramCount++}`);
    values.push(productData.hasTicket);
  }
  if (productData.ticketPrice !== undefined) {
    updates.push(`ticket_price = $${paramCount++}`);
    values.push(productData.ticketPrice);
  }
  if (productData.duration !== undefined) {
    updates.push(`duration = $${paramCount++}`);
    values.push(productData.duration);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const result = await pool.query(
    `UPDATE products
     SET ${updates.join(', ')}
     WHERE id = $${paramCount}
     RETURNING id, supplier_id, title, destination, category, description, 
               cover_image_url, net_price, has_shopping, has_ticket, 
               ticket_price, duration, status, rejection_reason, created_at, updated_at`,
    values
  );

  const product = result.rows[0];

  return {
    id: product.id,
    supplierId: product.supplier_id,
    title: product.title,
    destination: product.destination,
    category: product.category,
    description: product.description,
    coverImageUrl: product.cover_image_url,
    netPrice: parseFloat(product.net_price),
    hasShopping: product.has_shopping,
    hasTicket: product.has_ticket,
    ticketPrice: product.ticket_price ? parseFloat(product.ticket_price) : undefined,
    duration: parseFloat(product.duration),
    status: product.status,
    rejectionReason: product.rejection_reason,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };
}

/**
 * Get all products for a specific supplier (excluding soft-deleted products)
 * @param supplierId - Supplier ID
 * @returns Array of products owned by the supplier
 */
export async function getProductsBySupplier(supplierId: string): Promise<Product[]> {
  const result = await pool.query(
    `SELECT id, supplier_id, title, destination, category, description, 
            cover_image_url, net_price, has_shopping, has_ticket, 
            ticket_price, duration, status, rejection_reason, created_at, updated_at
     FROM products
     WHERE supplier_id = $1 AND (is_deleted = FALSE OR is_deleted IS NULL)
     ORDER BY created_at DESC`,
    [supplierId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    supplierId: row.supplier_id,
    title: row.title,
    destination: row.destination,
    category: row.category,
    description: row.description,
    coverImageUrl: row.cover_image_url,
    netPrice: parseFloat(row.net_price),
    hasShopping: row.has_shopping,
    hasTicket: row.has_ticket,
    ticketPrice: row.ticket_price ? parseFloat(row.ticket_price) : undefined,
    duration: parseFloat(row.duration),
    status: row.status,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Get all products for admin view with supplier information (excluding soft-deleted products)
 * @returns Array of all products with supplier names
 */
export async function getAllProducts(): Promise<ProductWithSupplier[]> {
  const result = await pool.query(
    `SELECT p.id, p.supplier_id, p.title, p.destination, p.category, p.description, 
            p.cover_image_url, p.net_price, p.has_shopping, p.has_ticket, 
            p.ticket_price, p.duration, p.status, p.created_at, p.updated_at,
            u.name as supplier_name
     FROM products p
     JOIN users u ON p.supplier_id = u.id
     WHERE p.is_deleted = FALSE OR p.is_deleted IS NULL
     ORDER BY p.created_at DESC`
  );

  return result.rows.map((row) => ({
    id: row.id,
    supplierId: row.supplier_id,
    title: row.title,
    destination: row.destination,
    category: row.category,
    description: row.description,
    coverImageUrl: row.cover_image_url,
    netPrice: parseFloat(row.net_price),
    hasShopping: row.has_shopping,
    hasTicket: row.has_ticket,
    ticketPrice: row.ticket_price ? parseFloat(row.ticket_price) : undefined,
    duration: parseFloat(row.duration),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    supplierName: row.supplier_name,
  }));
}

/**
 * Get published products with optional filtering for agency view (excluding soft-deleted products)
 * @param filters - Optional filters for destination and duration
 * @returns Array of published products with supplier names
 */
export async function getPublishedProducts(filters?: ProductFilters): Promise<ProductWithSupplier[]> {
  let query = `
    SELECT p.id, p.supplier_id, p.title, p.destination, p.category, p.description, 
           p.cover_image_url, p.net_price, p.has_shopping, p.has_ticket, 
           p.ticket_price, p.duration, p.status, p.rejection_reason, p.created_at, p.updated_at,
           u.name as supplier_name
    FROM products p
    JOIN users u ON p.supplier_id = u.id
    WHERE p.status = '已發佈' AND (p.is_deleted = FALSE OR p.is_deleted IS NULL)
  `;

  const values: any[] = [];
  let paramCount = 1;

  if (filters?.destination) {
    query += ` AND p.destination = $${paramCount++}`;
    values.push(filters.destination);
  }

  if (filters?.category) {
    query += ` AND p.category = $${paramCount++}`;
    values.push(filters.category);
  }

  query += ` ORDER BY p.created_at DESC`;

  const result = await pool.query(query, values);

  return result.rows.map((row) => ({
    id: row.id,
    supplierId: row.supplier_id,
    title: row.title,
    destination: row.destination,
    category: row.category,
    description: row.description,
    coverImageUrl: row.cover_image_url,
    netPrice: parseFloat(row.net_price),
    hasShopping: row.has_shopping,
    hasTicket: row.has_ticket,
    ticketPrice: row.ticket_price ? parseFloat(row.ticket_price) : undefined,
    duration: parseFloat(row.duration),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    supplierName: row.supplier_name,
  }));
}

/**
 * Get a single product by ID (excluding soft-deleted products)
 * @param id - Product ID
 * @returns Product with supplier information
 * @throws Error if product not found or soft-deleted
 */
export async function getProductById(id: string): Promise<ProductWithSupplier> {
  const result = await pool.query(
    `SELECT p.id, p.supplier_id, p.title, p.destination, p.category, p.description, 
            p.cover_image_url, p.net_price, p.has_shopping, p.has_ticket, 
            p.ticket_price, p.duration, p.status, p.rejection_reason, p.created_at, p.updated_at,
            u.name as supplier_name
     FROM products p
     JOIN users u ON p.supplier_id = u.id
     WHERE p.id = $1 AND (p.is_deleted = FALSE OR p.is_deleted IS NULL)`,
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
    category: row.category,
    description: row.description,
    coverImageUrl: row.cover_image_url,
    netPrice: parseFloat(row.net_price),
    hasShopping: row.has_shopping,
    hasTicket: row.has_ticket,
    ticketPrice: row.ticket_price ? parseFloat(row.ticket_price) : undefined,
    duration: parseFloat(row.duration),
    status: row.status,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    supplierName: row.supplier_name,
  };
}

/**
 * Update product status (excluding soft-deleted products)
 * @param id - Product ID
 * @param status - New status
 * @param supplierId - Optional supplier ID for ownership validation (required for supplier updates)
 * @returns Updated product
 * @throws Error if product not found or access denied
 */
export async function updateProductStatus(
  id: string,
  status: ProductStatus,
  supplierId?: string,
  rejectionReason?: string
): Promise<Product> {
  // If supplierId is provided, verify ownership
  if (supplierId) {
    const ownershipCheck = await pool.query(
      'SELECT id FROM products WHERE id = $1 AND supplier_id = $2 AND (is_deleted = FALSE OR is_deleted IS NULL)',
      [id, supplierId]
    );

    if (ownershipCheck.rows.length === 0) {
      throw new Error('Product not found or access denied');
    }
  }

  const updates: string[] = ['status = $1', 'updated_at = CURRENT_TIMESTAMP'];
  const values: any[] = [status, id];
  let paramCount = 3;

  if (rejectionReason !== undefined) {
    updates.push(`rejection_reason = $${paramCount++}`);
    values.push(rejectionReason);
  }

  const result = await pool.query(
    `UPDATE products
     SET ${updates.join(', ')}
     WHERE id = $2 AND (is_deleted = FALSE OR is_deleted IS NULL)
     RETURNING id, supplier_id, title, destination, category, description, 
               cover_image_url, net_price, has_shopping, has_ticket, 
               ticket_price, duration, status, rejection_reason, created_at, updated_at`,
    values
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
    category: product.category,
    description: product.description,
    coverImageUrl: product.cover_image_url,
    netPrice: parseFloat(product.net_price),
    hasShopping: product.has_shopping,
    hasTicket: product.has_ticket,
    ticketPrice: product.ticket_price ? parseFloat(product.ticket_price) : undefined,
    duration: parseFloat(product.duration),
    status: product.status,
    rejectionReason: product.rejection_reason,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };
}

/**
 * Get products by status for admin review (excluding soft-deleted products)
 * @param status - Product status to filter by
 * @returns Array of products with the specified status
 */
export async function getProductsByStatus(status: ProductStatus): Promise<ProductWithSupplier[]> {
  const result = await pool.query(
    `SELECT p.id, p.supplier_id, p.title, p.destination, p.category, p.description, 
            p.cover_image_url, p.net_price, p.has_shopping, p.has_ticket, 
            p.ticket_price, p.duration, p.status, p.rejection_reason, p.created_at, p.updated_at,
            u.name as supplier_name
     FROM products p
     JOIN users u ON p.supplier_id = u.id
     WHERE p.status = $1 AND (p.is_deleted = FALSE OR p.is_deleted IS NULL)
     ORDER BY p.created_at DESC`,
    [status]
  );

  return result.rows.map((row) => ({
    id: row.id,
    supplierId: row.supplier_id,
    title: row.title,
    destination: row.destination,
    category: row.category,
    description: row.description,
    coverImageUrl: row.cover_image_url,
    netPrice: parseFloat(row.net_price),
    hasShopping: row.has_shopping,
    hasTicket: row.has_ticket,
    ticketPrice: row.ticket_price ? parseFloat(row.ticket_price) : undefined,
    duration: parseFloat(row.duration),
    status: row.status,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    supplierName: row.supplier_name,
  }));
}

/**
 * Get count of products by status
 * @param status - Product status to count
 * @returns Count of products with the specified status
 */
export async function getProductCountByStatus(status: ProductStatus): Promise<number> {
  const result = await pool.query(
    'SELECT COUNT(*) as count FROM products WHERE status = $1 AND (is_deleted = FALSE OR is_deleted IS NULL)',
    [status]
  );

  return parseInt(result.rows[0].count);
}

/**
 * Soft delete a product (marks as deleted without removing from database)
 * @param id - Product ID
 * @param supplierId - Optional supplier ID for ownership validation (required for supplier deletes)
 * @throws Error if product not found or access denied
 */
export async function deleteProduct(id: string, supplierId?: string): Promise<void> {
  // If supplierId is provided, verify ownership
  if (supplierId) {
    const ownershipCheck = await pool.query(
      'SELECT id FROM products WHERE id = $1 AND supplier_id = $2 AND (is_deleted = FALSE OR is_deleted IS NULL)',
      [id, supplierId]
    );

    if (ownershipCheck.rows.length === 0) {
      throw new Error('Product not found or access denied');
    }
  } else {
    // Admin delete - just check if product exists and is not already deleted
    const existingProduct = await pool.query(
      'SELECT id FROM products WHERE id = $1 AND (is_deleted = FALSE OR is_deleted IS NULL)',
      [id]
    );

    if (existingProduct.rows.length === 0) {
      throw new Error('Product not found');
    }
  }

  // Soft delete product by setting is_deleted flag and deleted_at timestamp
  await pool.query(
    'UPDATE products SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP WHERE id = $1',
    [id]
  );
}
