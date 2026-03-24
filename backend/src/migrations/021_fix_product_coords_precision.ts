import { Pool } from 'pg';

export const up = async (pool: Pool): Promise<void> => {
  await pool.query(`
    ALTER TABLE products 
    ALTER COLUMN latitude TYPE DECIMAL(10, 8),
    ALTER COLUMN longitude TYPE DECIMAL(11, 8);
  `);
};

export const down = async (pool: Pool): Promise<void> => {
  await pool.query(`
    ALTER TABLE products 
    ALTER COLUMN latitude TYPE DECIMAL(10, 8),
    ALTER COLUMN longitude TYPE DECIMAL(10, 8);
  `);
};
