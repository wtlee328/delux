import { Pool } from 'pg';

export const up = async (pool: Pool): Promise<void> => {
  await pool.query(`
    ALTER TABLE supplier_trips 
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT '草稿' NOT NULL,
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
  `);

  // Update existing trips to '草稿' if any
  await pool.query(`
    UPDATE supplier_trips SET status = '草稿' WHERE status IS NULL;
  `);
};

export const down = async (pool: Pool): Promise<void> => {
  await pool.query(`
    ALTER TABLE supplier_trips 
    DROP COLUMN IF EXISTS status,
    DROP COLUMN IF EXISTS rejection_reason;
  `);
};
