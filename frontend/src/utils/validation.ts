/**
 * Validation error type
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate required field
 */
export const validateRequired = (value: any, fieldName: string): string | null => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName}為必填欄位`;
  }
  return null;
};

/**
 * Validate minimum length
 */
export const validateMinLength = (
  value: string,
  minLength: number,
  fieldName: string
): string | null => {
  if (value.length < minLength) {
    return `${fieldName}至少需要${minLength}個字元`;
  }
  return null;
};

/**
 * Validate maximum length
 */
export const validateMaxLength = (
  value: string,
  maxLength: number,
  fieldName: string
): string | null => {
  if (value.length > maxLength) {
    return `${fieldName}不能超過${maxLength}個字元`;
  }
  return null;
};

/**
 * Validate positive number
 */
export const validatePositiveNumber = (value: any, fieldName: string): string | null => {
  const num = Number(value);
  if (isNaN(num) || num <= 0) {
    return `${fieldName}必須是正數`;
  }
  return null;
};

/**
 * Validate image file
 */
export const validateImageFile = (file: File | null): string | null => {
  if (!file) {
    return '請選擇圖片';
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return '只允許 JPEG、PNG 和 WebP 格式的圖片';
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return '圖片大小不能超過 5MB';
  }

  return null;
};

/**
 * Validate login form
 */
export const validateLoginForm = (
  email: string,
  password: string
): ValidationResult => {
  const errors: Record<string, string> = {};

  // Validate email
  const emailError = validateRequired(email, '電子郵件');
  if (emailError) {
    errors.email = emailError;
  } else if (!validateEmail(email)) {
    errors.email = '請輸入有效的電子郵件地址';
  }

  // Validate password
  const passwordError = validateRequired(password, '密碼');
  if (passwordError) {
    errors.password = passwordError;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate user creation form
 */
export const validateUserForm = (data: {
  email: string;
  password: string;
  name: string;
  role: string;
}): ValidationResult => {
  const errors: Record<string, string> = {};

  // Validate email
  const emailError = validateRequired(data.email, '電子郵件');
  if (emailError) {
    errors.email = emailError;
  } else if (!validateEmail(data.email)) {
    errors.email = '請輸入有效的電子郵件地址';
  }

  // Validate password
  const passwordError = validateRequired(data.password, '密碼');
  if (passwordError) {
    errors.password = passwordError;
  } else {
    const minLengthError = validateMinLength(data.password, 6, '密碼');
    if (minLengthError) {
      errors.password = minLengthError;
    }
  }

  // Validate name
  const nameError = validateRequired(data.name, '姓名');
  if (nameError) {
    errors.name = nameError;
  }

  // Validate role
  const roleError = validateRequired(data.role, '角色');
  if (roleError) {
    errors.role = roleError;
  } else if (!['admin', 'supplier', 'agency'].includes(data.role)) {
    errors.role = '請選擇有效的角色';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate product form
 */
export const validateProductForm = (data: {
  title: string;
  destination: string;
  durationDays: number | string;
  description: string;
  netPrice: number | string;
  coverImage?: File | null;
}, isEdit: boolean = false): ValidationResult => {
  const errors: Record<string, string> = {};

  // Validate title
  const titleError = validateRequired(data.title, '產品標題');
  if (titleError) {
    errors.title = titleError;
  }

  // Validate destination
  const destinationError = validateRequired(data.destination, '目的地');
  if (destinationError) {
    errors.destination = destinationError;
  }

  // Validate duration
  const durationError = validateRequired(data.durationDays, '天數');
  if (durationError) {
    errors.durationDays = durationError;
  } else {
    const positiveError = validatePositiveNumber(data.durationDays, '天數');
    if (positiveError) {
      errors.durationDays = positiveError;
    }
  }

  // Validate description
  const descriptionError = validateRequired(data.description, '產品描述');
  if (descriptionError) {
    errors.description = descriptionError;
  }

  // Validate net price
  const priceError = validateRequired(data.netPrice, '淨價');
  if (priceError) {
    errors.netPrice = priceError;
  } else {
    const positiveError = validatePositiveNumber(data.netPrice, '淨價');
    if (positiveError) {
      errors.netPrice = positiveError;
    }
  }

  // Validate cover image (only required for new products)
  if (!isEdit) {
    const imageError = validateImageFile(data.coverImage || null);
    if (imageError) {
      errors.coverImage = imageError;
    }
  } else if (data.coverImage) {
    // If editing and a new image is provided, validate it
    const imageError = validateImageFile(data.coverImage);
    if (imageError) {
      errors.coverImage = imageError;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
