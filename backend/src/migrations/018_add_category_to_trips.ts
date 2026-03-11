import { Pool } from 'pg';

export const up = async (pool: Pool): Promise<void> => {
  await pool.query(`
    ALTER TABLE supplier_trips ADD COLUMN category VARCHAR(100) DEFAULT '團體旅遊';
  `);
};

export const down = async (pool: Pool): Promise<void> => {
  await pool.query(`
    ALTER TABLE supplier_trips DROP COLUMN category;
  `);
};
