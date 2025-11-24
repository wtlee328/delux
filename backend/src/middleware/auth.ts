import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid token';
    res.status(401).json({ error: message });
  }
}

/**
 * Middleware to check if user has required role
 * @param allowedRoles - Array of roles that are allowed to access the route
 */
export function requireRole(allowedRoles: Array<'admin' | 'supplier' | 'agency' | 'super_admin'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Super admin has access to everything admin has access to
    if (req.user.role === 'super_admin' && allowedRoles.includes('admin')) {
      next();
      return;
    }

    // Direct role match
    if (allowedRoles.includes(req.user.role as any)) {
      next();
      return;
    }

    // Check if user has multiple roles and one of them matches
    if (req.user.roles && req.user.roles.some((role: string) => {
      if (role === 'super_admin' && allowedRoles.includes('admin')) return true;
      return allowedRoles.includes(role as any);
    })) {
      next();
      return;
    }

    res.status(403).json({ error: 'Access denied' });
  };
}
