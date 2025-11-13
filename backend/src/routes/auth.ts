import { Router, Request, Response } from 'express';
import { login } from '../services/authService';

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

export default router;
