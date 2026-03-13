import { Pool } from 'pg';

export const up = async (pool: Pool): Promise<void> => {
  await pool.query(`
    ALTER TABLE itineraries 
    ADD COLUMN IF NOT EXISTS destination VARCHAR(255),
    ADD COLUMN IF NOT EXISTS days_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS start_date DATE,
    ADD COLUMN IF NOT EXISTS end_date DATE,
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft';

    CREATE INDEX IF NOT EXISTS idx_itineraries_destination ON itineraries(destination);
    CREATE INDEX IF NOT EXISTS idx_itineraries_status ON itineraries(status);
  `);
};

export const down = async (pool: Pool): Promise<void> => {
  await pool.query(`
    ALTER TABLE itineraries 
    DROP COLUMN IF EXISTS destination,
    DROP COLUMN IF EXISTS days_count,
    DROP COLUMN IF EXISTS start_date,
    DROP COLUMN IF EXISTS end_date,
    DROP COLUMN IF EXISTS status;
  `);
};
