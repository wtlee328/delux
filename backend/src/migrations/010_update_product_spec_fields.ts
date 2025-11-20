import { Pool } from 'pg';

export const up = async (pool: Pool): Promise<void> => {
    // 1. Add category column with default value 'landmark'
    await pool.query(`
    ALTER TABLE products 
    ADD COLUMN category VARCHAR(50) NOT NULL DEFAULT 'landmark';
  `);

    // 2. Create index for category
    await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
  `);

    // 3. Remove duration_days column
    // Note: We drop the index first if it exists (it was created in 002)
    await pool.query(`
    DROP INDEX IF EXISTS idx_products_duration;
    ALTER TABLE products DROP COLUMN duration_days;
  `);
};

export const down = async (pool: Pool): Promise<void> => {
    // 1. Add duration_days column back (defaulting to 1 as we lost the data)
    await pool.query(`
    ALTER TABLE products 
    ADD COLUMN duration_days INTEGER NOT NULL DEFAULT 1;
  `);

    // 2. Re-create index for duration_days
    await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_products_duration ON products(duration_days);
  `);

    // 3. Remove category column
    await pool.query(`
    DROP INDEX IF EXISTS idx_products_category;
    ALTER TABLE products DROP COLUMN category;
  `);
};
