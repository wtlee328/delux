import { Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth';
import * as jwt from '../../utils/jwt';

// Mock the jwt utils
jest.mock('../../utils/jwt');

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('should call next() with valid token', () => {
      const mockPayload = {
        userId: '123',
        email: 'test@example.com',
        role: 'admin' as const,
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      (jwt.verifyToken as jest.Mock).mockReturnValue(mockPayload);

      requireAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(jwt.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(mockRequest.user).toEqual(mockPayload);
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header is missing', () => {
      mockRequest.headers = {};

      requireAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication required',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header does not start with Bearer', () => {
      mockRequest.headers = {
        authorization: 'Basic some-token',
      };

      requireAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication required',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 when token is invalid', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      (jwt.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      requireAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid token',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 when token is expired', () => {
      mockRequest.headers = {
        authorization: 'Bearer expired-token',
      };

      (jwt.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Session expired, please login again');
      });

      requireAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Session expired, please login again',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should call next() when user has required role', () => {
      mockRequest.user = {
        userId: '123',
        email: 'admin@example.com',
        role: 'admin',
      };

      const middleware = requireRole(['admin']);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should call next() when user has one of multiple allowed roles', () => {
      mockRequest.user = {
        userId: '123',
        email: 'supplier@example.com',
        role: 'supplier',
      };

      const middleware = requireRole(['admin', 'supplier']);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      mockRequest.user = undefined;

      const middleware = requireRole(['admin']);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication required',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 403 when user does not have required role', () => {
      mockRequest.user = {
        userId: '123',
        email: 'agency@example.com',
        role: 'agency',
      };

      const middleware = requireRole(['admin']);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Access denied',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 403 when supplier tries to access admin route', () => {
      mockRequest.user = {
        userId: '123',
        email: 'supplier@example.com',
        role: 'supplier',
      };

      const middleware = requireRole(['admin']);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Access denied',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 403 when agency tries to access supplier route', () => {
      mockRequest.user = {
        userId: '123',
        email: 'agency@example.com',
        role: 'agency',
      };

      const middleware = requireRole(['supplier']);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Access denied',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});
