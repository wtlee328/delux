import { Pool } from 'pg';

export const up = async (pool: Pool): Promise<void> => {
  await pool.query(`
    ALTER TABLE products 
    ADD COLUMN address VARCHAR(500),
    ADD COLUMN latitude DECIMAL(10, 8),
    ADD COLUMN longitude DECIMAL(10, 8);
  `);
};

export const down = async (pool: Pool): Promise<void> => {
  await pool.query(`
    ALTER TABLE products 
    DROP COLUMN IF EXISTS address,
    DROP COLUMN IF EXISTS latitude,
    DROP COLUMN IF EXISTS longitude;
  `);
};
