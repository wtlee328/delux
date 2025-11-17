import pool from '../config/database';
import { comparePassword } from '../utils/password';
import { generateToken, JWTPayload } from '../utils/jwt';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'supplier' | 'agency';
    roles: ('admin' | 'supplier' | 'agency')[];
  };
}

/**
 * Authenticate user with email and password
 * @param email - User email
 * @param password - Plain text password
 * @returns Login response with token and user info (including all roles)
 * @throws Error if credentials are invalid
 */
export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  // Query user from database (handle case where active_role column doesn't exist yet)
  // Exclude soft-deleted users from login
  let result;
  try {
    result = await pool.query(
      'SELECT id, email, password_hash, name, role, active_role FROM users WHERE email = $1 AND (is_deleted = FALSE OR is_deleted IS NULL)',
      [email]
    );
  } catch (error) {
    // active_role column doesn't exist yet, query without it
    console.log('active_role column not found, using legacy query');
    result = await pool.query(
      'SELECT id, email, password_hash, name, role FROM users WHERE email = $1 AND (is_deleted = FALSE OR is_deleted IS NULL)',
      [email]
    );
  }

  if (result.rows.length === 0) {
    throw new Error('Invalid email or password');
  }

  const user = result.rows[0];

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password_hash);

  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  // Get all roles for this user (handle case where user_roles table doesn't exist yet)
  let roles: string[] = [];
  try {
    const rolesResult = await pool.query(
      'SELECT role FROM user_roles WHERE user_id = $1 ORDER BY role',
      [user.id]
    );
    roles = rolesResult.rows.map(row => row.role);
  } catch (error) {
    // user_roles table doesn't exist yet, will use legacy role
    console.log('user_roles table not found, using legacy role');
  }
  
  // If no roles in user_roles table, fall back to single role from users table
  const userRoles = roles.length > 0 ? roles : [user.role];
  
  // Use active_role if set, otherwise use first role or legacy role
  const activeRole = user.active_role || userRoles[0] || user.role;

  // Generate JWT token with active role
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: activeRole,
  };

  const token = generateToken(payload);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: activeRole,
      roles: userRoles,
    },
  };
}

/**
 * Set active role for a user
 * @param userId - User ID
 * @param role - Role to set as active
 * @returns Updated login response with new token
 * @throws Error if role is not valid for user
 */
export async function setActiveRole(
  userId: string,
  role: 'admin' | 'supplier' | 'agency'
): Promise<LoginResponse> {
  // Verify user has this role
  let roleCheck;
  try {
    roleCheck = await pool.query(
      'SELECT 1 FROM user_roles WHERE user_id = $1 AND role = $2',
      [userId, role]
    );
  } catch (error) {
    // user_roles table doesn't exist yet
    roleCheck = { rows: [] };
  }

  if (roleCheck.rows.length === 0) {
    // Check if user has this role in legacy role column
    const userCheck = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );
    
    if (userCheck.rows.length === 0 || userCheck.rows[0].role !== role) {
      throw new Error('User does not have this role');
    }
  }

  // Update active_role in users table (if column exists)
  try {
    await pool.query(
      'UPDATE users SET active_role = $1 WHERE id = $2',
      [role, userId]
    );
  } catch (error) {
    // active_role column doesn't exist yet, skip update
    console.log('active_role column not found, skipping update');
  }

  // Get user info (exclude soft-deleted users)
  const userResult = await pool.query(
    'SELECT id, email, name, role FROM users WHERE id = $1 AND (is_deleted = FALSE OR is_deleted IS NULL)',
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = userResult.rows[0];

  // Get all roles
  let roles: string[] = [];
  try {
    const rolesResult = await pool.query(
      'SELECT role FROM user_roles WHERE user_id = $1 ORDER BY role',
      [userId]
    );
    roles = rolesResult.rows.map(row => row.role);
  } catch (error) {
    // user_roles table doesn't exist yet
    console.log('user_roles table not found in setActiveRole');
  }
  
  const userRoles = roles.length > 0 ? roles : [user.role];

  // Generate new JWT token with selected role
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: role,
  };

  const token = generateToken(payload);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: role,
      roles: userRoles,
    },
  };
}
