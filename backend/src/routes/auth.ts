import { Router, Request, Response } from 'express';
import { login, setActiveRole } from '../services/authService';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate request body
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Authenticate user
    const result = await login(email, password);

    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';

    // Return 401 for invalid credentials
    if (message === 'Invalid email or password') {
      res.status(401).json({ error: message });
      return;
    }

    // Return 500 for other errors
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/select-role
 * Set active role for multi-role users
 */
router.post('/select-role', requireAuth, async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    const userId = (req as any).user.userId;

    // Validate request body
    if (!role) {
      res.status(400).json({ error: 'Role is required' });
      return;
    }

    // Validate role value
    if (!['admin', 'supplier', 'agency', 'super_admin'].includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    // Set active role
    const result = await setActiveRole(userId, role);

    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Role selection failed';

    // Return 403 for invalid role
    if (message === 'User does not have this role') {
      res.status(403).json({ error: message });
      return;
    }

    // Return 500 for other errors
    console.error('Role selection error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
