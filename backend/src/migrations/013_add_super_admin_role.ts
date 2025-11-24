import { Pool } from 'pg';

export const up = async (pool: Pool): Promise<void> => {
    // 1. Update user_roles table constraint
    await pool.query(`
    ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
    ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_check 
    CHECK (role IN ('admin', 'supplier', 'agency', 'super_admin'));
  `);

    // 2. Update users table constraint for active_role
    await pool.query(`
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_active_role_check;
    ALTER TABLE users ADD CONSTRAINT users_active_role_check 
    CHECK (active_role IN ('admin', 'supplier', 'agency', 'super_admin'));
  `);

    // 3. Assign super_admin role to specific users
    const superAdminEmails = ['wtlee328@gmail.com', 'mike@deluxplus.com'];

    for (const email of superAdminEmails) {
        // Get user ID
        const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

        if (userResult.rows.length > 0) {
            const userId = userResult.rows[0].id;

            // Insert super_admin role
            await pool.query(`
        INSERT INTO user_roles (user_id, role)
        VALUES ($1, 'super_admin')
        ON CONFLICT (user_id, role) DO NOTHING
      `, [userId]);

            console.log(`Assigned super_admin role to ${email}`);
        } else {
            console.log(`User ${email} not found, skipping super_admin assignment`);
        }
    }
};

export const down = async (pool: Pool): Promise<void> => {
    // 1. Remove super_admin role from user_roles
    await pool.query("DELETE FROM user_roles WHERE role = 'super_admin'");

    // 2. Revert users table constraint
    // Note: We might have users with active_role='super_admin' which would fail this check.
    // We should probably update them first, but for now we'll just revert the constraint.
    await pool.query(`
    UPDATE users SET active_role = 'admin' WHERE active_role = 'super_admin';
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_active_role_check;
    ALTER TABLE users ADD CONSTRAINT users_active_role_check 
    CHECK (active_role IN ('admin', 'supplier', 'agency'));
  `);

    // 3. Revert user_roles table constraint
    await pool.query(`
    ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
    ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_check 
    CHECK (role IN ('admin', 'supplier', 'agency'));
  `);
};
