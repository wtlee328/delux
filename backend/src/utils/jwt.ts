import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'delux-plus-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'supplier' | 'agency';
}

/**
 * Generate a JWT token with user information
 * @param payload - User information to embed in token
 * @returns JWT token string
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token to verify
 * @returns Decoded payload if valid
 * @throws Error if token is invalid or expired
 */
export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Session expired, please login again');
    }
    throw new Error('Invalid token');
  }
}
