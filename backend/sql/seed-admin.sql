-- Seed script to create initial admin user
-- This script creates an admin user with default credentials
-- 
-- IMPORTANT: 
-- 1. The password hash below is for 'DeluxAdmin2024!'
-- 2. Change the admin password immediately after first login
-- 3. Store credentials securely
--
-- To generate a new password hash, use bcrypt with 10 salt rounds
-- Example in Node.js: bcrypt.hashSync('your-password', 10)

-- Check if admin already exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@deluxplus.com') THEN
    -- Insert admin user
    -- Password: DeluxAdmin2024!
    -- Hash generated with bcrypt, 10 salt rounds
    INSERT INTO users (email, password_hash, name, role)
    VALUES (
      'admin@deluxplus.com',
      '$2b$10$YourHashWillGoHere',  -- Replace with actual bcrypt hash
      '帝樂管理員',
      'admin'
    );
    
    RAISE NOTICE 'Admin user created successfully!';
    RAISE NOTICE 'Email: admin@deluxplus.com';
    RAISE NOTICE 'Password: DeluxAdmin2024!';
    RAISE NOTICE 'IMPORTANT: Change the password after first login!';
  ELSE
    RAISE NOTICE 'Admin user already exists. Skipping...';
  END IF;
END $$;
