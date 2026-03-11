import { Pool } from 'pg';

export const up = async (pool: Pool): Promise<void> => {
  await pool.query(`
    ALTER TABLE supplier_trips ADD COLUMN IF NOT EXISTS destination VARCHAR(255);
  `);
  
  await pool.query(`
    UPDATE supplier_trips SET destination = 'Default Destination' WHERE destination IS NULL;
  `);

  await pool.query(`
    ALTER TABLE supplier_trips ALTER COLUMN destination SET NOT NULL;
  `);
};

export const down = async (pool: Pool): Promise<void> => {
  await pool.query(`
    ALTER TABLE supplier_trips DROP COLUMN IF EXISTS destination;
  `);
};
