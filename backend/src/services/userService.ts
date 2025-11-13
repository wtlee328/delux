import pool from '../config/database';
import { hashPassword } from '../utils/password';

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'supplier' | 'agency';
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'supplier' | 'agency';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a new user with email uniqueness validation
 * @param userData - User data including email, password, name, and role
 * @returns Created user (without password)
 * @throws Error if email already exists or validation fails
 */
export async function createUser(userData: CreateUserRequest): Promise<User> {
  const { email, password, name, role } = userData;

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

  // Insert user
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, name, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, name, role, created_at, updated_at`,
    [email, passwordHash, name, role]
  );

  const user = result.rows[0];

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

/**
 * Get all users for admin user list
 * @returns Array of all users
 */
export async function getAllUsers(): Promise<User[]> {
  const result = await pool.query(
    `SELECT id, email, name, role, created_at, updated_at
     FROM users
     ORDER BY created_at DESC`
  );

  return result.rows.map((row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Get user by ID
 * @param id - User ID
 * @returns User details
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

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}
