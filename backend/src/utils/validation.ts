import { AppError } from '../middleware/errorHandler';

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate required fields in request body
 */
export const validateRequiredFields = (
  data: Record<string, any>,
  requiredFields: string[]
): void => {
  const errors: ValidationError[] = [];

  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push({
        field,
        message: `${field} is required`
      });
    }
  }

  if (errors.length > 0) {
    throw new AppError(
      `Validation failed: ${errors.map(e => e.message).join(', ')}`,
      400
    );
  }
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate user role
 */
export const validateRole = (role: string): boolean => {
  return ['admin', 'supplier', 'agency'].includes(role);
};

/**
 * Validate product status
 */
export const validateProductStatus = (status: string): boolean => {
  return ['pending', 'published'].includes(status);
};

/**
 * Validate image file
 */
export const validateImageFile = (file: Express.Multer.File): void => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.mimetype)) {
    throw new AppError('Only JPEG, PNG, and WebP images are allowed', 400);
  }

  if (file.size > maxSize) {
    throw new AppError('Image must be less than 5MB', 413);
  }
};

/**
 * Validate positive number
 */
export const validatePositiveNumber = (value: any, fieldName: string): void => {
  const num = Number(value);
  if (isNaN(num) || num <= 0) {
    throw new AppError(`${fieldName} must be a positive number`, 400);
  }
};
