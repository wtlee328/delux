-- Migration 004: Add Multi-Role Support
-- Run this directly on your production database

-- 1. Create user_roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'supplier', 'agency')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- 2. Migrate existing single-role data to user_roles table
INSERT INTO user_roles (user_id, role)
SELECT id, role FROM users
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Add active_role column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS active_role VARCHAR(50) CHECK (active_role IN ('admin', 'supplier', 'agency'));

-- 4. Set active_role to current role for existing users
UPDATE users 
SET active_role = role 
WHERE active_role IS NULL AND role IS NOT NULL;

-- 5. Record migration
INSERT INTO migrations (name, executed_at)
VALUES ('004_add_multi_role_support', CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;

-- Verify the migration
SELECT 'Migration 004 completed successfully!' as status;
SELECT COUNT(*) as user_roles_count FROM user_roles;
SELECT COUNT(*) as users_with_active_role FROM users WHERE active_role IS NOT NULL;
