import request from 'supertest';
import express from 'express';
import authRoutes from '../../routes/auth';
import * as authService from '../../services/authService';

// Mock the auth service
jest.mock('../../services/authService');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  const mockLoginResponse = {
    token: 'mock-jwt-token',
    user: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      name: 'Test User',
      role: 'admin' as const,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      (authService.login as jest.Mock).mockResolvedValue(mockLoginResponse);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testPassword123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(mockLoginResponse.user.email);
      expect(response.body.user.name).toBe(mockLoginResponse.user.name);
      expect(response.body.user.role).toBe(mockLoginResponse.user.role);
      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'testPassword123');
    });

    it('should return 401 for invalid credentials', async () => {
      (authService.login as jest.Mock).mockRejectedValue(
        new Error('Invalid email or password')
      );

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongPassword',
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid email or password');
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'testPassword123',
        })
        .expect(400);

      expect(response.body.error).toBe('Email and password are required');
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
        })
        .expect(400);

      expect(response.body.error).toBe('Email and password are required');
      expect(authService.login).not.toHaveBeenCalled();
    });
  });
});
