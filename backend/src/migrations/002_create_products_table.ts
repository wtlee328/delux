import { Pool } from 'pg';

export const up = async (pool: Pool): Promise<void> => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      supplier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(500) NOT NULL,
      destination VARCHAR(255) NOT NULL,
      duration_days INTEGER NOT NULL,
      description TEXT NOT NULL,
      cover_image_url VARCHAR(1000) NOT NULL,
      net_price DECIMAL(10, 2) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
    CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
    CREATE INDEX IF NOT EXISTS idx_products_destination ON products(destination);
    CREATE INDEX IF NOT EXISTS idx_products_duration ON products(duration_days);
  `);
};

export const down = async (pool: Pool): Promise<void> => {
  await pool.query(`
    DROP INDEX IF EXISTS idx_products_duration;
    DROP INDEX IF EXISTS idx_products_destination;
    DROP INDEX IF EXISTS idx_products_status;
    DROP INDEX IF EXISTS idx_products_supplier;
    DROP TABLE IF EXISTS products;
  `);
};
