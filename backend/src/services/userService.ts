import pool from '../config/database';
import { hashPassword } from '../utils/password';

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'supplier' | 'agency';
  roles?: ('admin' | 'supplier' | 'agency')[]; // Optional array for multi-role support
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'supplier' | 'agency';
  roles: ('admin' | 'supplier' | 'agency')[]; // All roles for this user
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a new user with email uniqueness validation
 * @param userData - User data including email, password, name, and role(s)
 * @returns Created user (without password)
 * @throws Error if email already exists or validation fails
 */
export async function createUser(userData: CreateUserRequest): Promise<User> {
  const { email, password, name, role, roles } = userData;

  // Validate email uniqueness
  const existingUser = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new Error('Email already registered');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Determine which roles to use
  const userRoles = roles && roles.length > 0 ? roles : [role];
  const primaryRole = userRoles[0];

  // Insert user
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, name, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, name, role, created_at, updated_at`,
    [email, passwordHash, name, primaryRole]
  );

  const user = result.rows[0];

  // Insert roles into user_roles table (if table exists)
  try {
    for (const userRole of userRoles) {
      await pool.query(
        `INSERT INTO user_roles (user_id, role)
         VALUES ($1, $2)
         ON CONFLICT (user_id, role) DO NOTHING`,
        [user.id, userRole]
      );
    }
  } catch (error) {
    // user_roles table doesn't exist yet, skip
    console.log('user_roles table not found during user creation');
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    roles: userRoles,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

/**
 * Get all users for admin user list
 * @returns Array of all users with their roles
 */
export async function getAllUsers(): Promise<User[]> {
  const result = await pool.query(
    `SELECT id, email, name, role, created_at, updated_at
     FROM users
     ORDER BY created_at DESC`
  );

  // Get all roles for each user
  const usersWithRoles = await Promise.all(
    result.rows.map(async (row) => {
      let roles: string[] = [];
      try {
        const rolesResult = await pool.query(
          'SELECT role FROM user_roles WHERE user_id = $1 ORDER BY role',
          [row.id]
        );
        roles = rolesResult.rows.map(r => r.role);
      } catch (error) {
        // user_roles table doesn't exist yet
        console.log('user_roles table not found in getAllUsers');
      }

      return {
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role,
        roles: roles.length > 0 ? roles : [row.role],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    })
  );

  return usersWithRoles;
}

/**
 * Get user by ID
 * @param id - User ID
 * @returns User details with all roles
 * @throws Error if user not found
 */
export async function getUserById(id: string): Promise<User> {
  const result = await pool.query(
    `SELECT id, email, name, role, created_at, updated_at
     FROM users
     WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = result.rows[0];

  // Get all roles for this user
  let roles: string[] = [];
  try {
    const rolesResult = await pool.query(
      'SELECT role FROM user_roles WHERE user_id = $1 ORDER BY role',
      [user.id]
    );
    roles = rolesResult.rows.map(r => r.role);
  } catch (error) {
    // user_roles table doesn't exist yet
    console.log('user_roles table not found in getUserById');
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    roles: roles.length > 0 ? roles : [user.role],
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  roles?: ('admin' | 'supplier' | 'agency')[];
}

/**
 * Update user information
 * @param id - User ID
 * @param updateData - Fields to update
 * @returns Updated user
 * @throws Error if user not found or email already exists
 */
export async function updateUser(id: string, updateData: UpdateUserRequest): Promise<User> {
  const { name, email, password, roles } = updateData;

  // Check if user exists
  const existingUser = await pool.query(
    'SELECT id FROM users WHERE id = $1',
    [id]
  );

  if (existingUser.rows.length === 0) {
    throw new Error('User not found');
  }

  // If email is being updated, check uniqueness
  if (email) {
    const emailCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, id]
    );

    if (emailCheck.rows.length > 0) {
      throw new Error('Email already registered');
    }
  }

  // Build update query dynamically
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (name !== undefined) {
    updates.push(`name = $${paramCount}`);
    values.push(name);
    paramCount++;
  }

  if (email !== undefined) {
    updates.push(`email = $${paramCount}`);
    values.push(email);
    paramCount++;
  }

  if (password !== undefined) {
    const passwordHash = await hashPassword(password);
    updates.push(`password_hash = $${paramCount}`);
    values.push(passwordHash);
    paramCount++;
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);

  // Update roles if provided
  if (roles && roles.length > 0) {
    const primaryRole = roles[0];
    updates.push(`role = $${paramCount}`);
    values.push(primaryRole);
    paramCount++;

    // Update user_roles table
    try {
      // Delete existing roles
      await pool.query('DELETE FROM user_roles WHERE user_id = $1', [id]);

      // Insert new roles
      for (const role of roles) {
        await pool.query(
          `INSERT INTO user_roles (user_id, role)
           VALUES ($1, $2)
           ON CONFLICT (user_id, role) DO NOTHING`,
          [id, role]
        );
      }
    } catch (error) {
      console.log('user_roles table not found during user update');
    }
  }

  // Execute update
  values.push(id);
  const result = await pool.query(
    `UPDATE users 
     SET ${updates.join(', ')}
     WHERE id = $${paramCount}
     RETURNING id, email, name, role, created_at, updated_at`,
    values
  );

  const user = result.rows[0];

  // Get all roles for this user
  let userRoles: string[] = [];
  try {
    const rolesResult = await pool.query(
      'SELECT role FROM user_roles WHERE user_id = $1 ORDER BY role',
      [user.id]
    );
    userRoles = rolesResult.rows.map(r => r.role);
  } catch (error) {
    console.log('user_roles table not found in updateUser');
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    roles: userRoles.length > 0 ? userRoles : [user.role],
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

/**
 * Delete a user
 * @param id - User ID
 * @throws Error if user not found
 */
export async function deleteUser(id: string): Promise<void> {
  // Check if user exists
  const existingUser = await pool.query(
    'SELECT id FROM users WHERE id = $1',
    [id]
  );

  if (existingUser.rows.length === 0) {
    throw new Error('User not found');
  }

  // Delete user (CASCADE will delete user_roles entries)
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
}
