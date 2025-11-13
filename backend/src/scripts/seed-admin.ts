import pool from '../config/database';
import { hashPassword } from '../utils/password';

/**
 * Seed script to create initial admin user
 * This should be run once after initial deployment
 */
async function seedAdmin(): Promise<void> {
  try {
    console.log('Creating initial admin user...');

    // Default admin credentials
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@deluxplus.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'DeluxAdmin2024!';
    const adminName = process.env.ADMIN_NAME || '帝樂管理員';

    // Check if admin already exists
    const existingAdmin = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail]
    );

    if (existingAdmin.rows.length > 0) {
      console.log('Admin user already exists. Skipping...');
      return;
    }

    // Hash the password
    const passwordHash = await hashPassword(adminPassword);

    // Insert admin user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role`,
      [adminEmail, passwordHash, adminName, 'admin']
    );

    console.log('✓ Admin user created successfully!');
    console.log('-----------------------------------');
    console.log('Admin Credentials:');
    console.log(`Email: ${result.rows[0].email}`);
    console.log(`Password: ${adminPassword}`);
    console.log(`Name: ${result.rows[0].name}`);
    console.log(`Role: ${result.rows[0].role}`);
    console.log('-----------------------------------');
    console.log('⚠️  IMPORTANT: Change the admin password after first login!');
    console.log('⚠️  Store these credentials securely!');
  } catch (error) {
    console.error('Failed to create admin user:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the seed script
seedAdmin();
