import { Pool } from 'pg';

export const up = async (pool: Pool): Promise<void> => {
  await pool.query(`
    -- Add is_deleted column to users table for soft delete functionality
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

    -- Add deleted_at column to track when user was deleted
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

    -- Create index on is_deleted for better query performance
    CREATE INDEX IF NOT EXISTS idx_users_is_deleted ON users(is_deleted);
  `);
};

export const down = async (pool: Pool): Promise<void> => {
  await pool.query(`
    DROP INDEX IF EXISTS idx_users_is_deleted;
    ALTER TABLE users DROP COLUMN IF EXISTS deleted_at;
    ALTER TABLE users DROP COLUMN IF EXISTS is_deleted;
  `);
};
