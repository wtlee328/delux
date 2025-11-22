import { Pool } from 'pg';

export const up = async (pool: Pool): Promise<void> => {
    await pool.query(`
    ALTER TABLE products 
    ADD COLUMN rejection_reason TEXT;
  `);
};

export const down = async (pool: Pool): Promise<void> => {
    await pool.query(`
    ALTER TABLE products 
    DROP COLUMN rejection_reason;
  `);
};
