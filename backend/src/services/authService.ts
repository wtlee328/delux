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
  };
}

/**
 * Authenticate user with email and password
 * @param email - User email
 * @param password - Plain text password
 * @returns Login response with token and user info
 * @throws Error if credentials are invalid
 */
export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  // Query user from database
  const result = await pool.query(
    'SELECT id, email, password_hash, name, role FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid email or password');
  }

  const user = result.rows[0];

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password_hash);

  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  // Generate JWT token
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const token = generateToken(payload);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}
