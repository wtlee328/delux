import { Pool } from 'pg';

export const up = async (pool: Pool): Promise<void> => {
  // Create user_roles junction table for multi-role support
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_roles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'supplier', 'agency')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, role)
    );

    CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
  `);

  // Migrate existing single-role data to user_roles table
  await pool.query(`
    INSERT INTO user_roles (user_id, role)
    SELECT id, role FROM users
    WHERE role IS NOT NULL
    ON CONFLICT (user_id, role) DO NOTHING;
  `);

  // Add active_role column to users table for session management
  await pool.query(`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS active_role VARCHAR(50) CHECK (active_role IN ('admin', 'supplier', 'agency'));
  `);

  // Set active_role to current role for existing users
  await pool.query(`
    UPDATE users 
    SET active_role = role 
    WHERE active_role IS NULL AND role IS NOT NULL;
  `);
};

export const down = async (pool: Pool): Promise<void> => {
  // Remove active_role column
  await pool.query(`
    ALTER TABLE users DROP COLUMN IF EXISTS active_role;
  `);

  // Drop user_roles table
  await pool.query(`
    DROP INDEX IF EXISTS idx_user_roles_role;
    DROP INDEX IF EXISTS idx_user_roles_user_id;
    DROP TABLE IF EXISTS user_roles;
  `);
};
