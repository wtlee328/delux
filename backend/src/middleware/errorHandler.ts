import { Request, Response, NextFunction } from 'express';

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error response format
 */
interface ErrorResponse {
  error: string;
  statusCode: number;
  timestamp: string;
  path?: string;
  details?: any;
}

/**
 * Global error handler middleware
 * Catches all errors and returns consistent error responses
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Default error values
  let statusCode = 500;
  let message = 'Internal server error';
  let details: any = undefined;

  // Handle AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }
  // Handle known error types
  else if (err.message === 'Invalid email or password') {
    statusCode = 401;
    message = err.message;
  }
  else if (err.message === 'Email already registered') {
    statusCode = 409;
    message = err.message;
  }
  else if (err.message === 'Product not found' || err.message === 'User not found') {
    statusCode = 404;
    message = err.message;
  }
  else if (err.message.includes('Session expired') || err.message.includes('Invalid token')) {
    statusCode = 401;
    message = err.message;
  }
  else if (err.message.includes('Access denied') || err.message.includes('Insufficient permissions')) {
    statusCode = 403;
    message = err.message;
  }
  // Handle validation errors
  else if (err.message.includes('required') || err.message.includes('Invalid')) {
    statusCode = 400;
    message = err.message;
  }

  // Log error for debugging (only in development or for server errors)
  if (statusCode === 500 || process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }

  // Build error response
  const errorResponse: ErrorResponse = {
    error: message,
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.path
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    details = {
      stack: err.stack,
      originalMessage: err.message
    };
    errorResponse.details = details;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    statusCode: 404,
    timestamp: new Date().toISOString(),
    path: req.path
  });
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
