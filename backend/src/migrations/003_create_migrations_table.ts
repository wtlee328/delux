import { Pool } from 'pg';

export const up = async (pool: Pool): Promise<void> => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

export const down = async (pool: Pool): Promise<void> => {
  await pool.query(`
    DROP TABLE IF EXISTS migrations;
  `);
};
