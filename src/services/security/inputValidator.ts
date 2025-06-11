
/**
 * Enhanced input validation utilities for security
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedValue?: any;
}

// SQL injection prevention
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  // Remove or escape dangerous characters
  return input
    .replace(/['";\\]/g, '') // Remove quotes and backslashes
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove SQL block comments
    .replace(/\*\//g, '')
    .trim();
};

// XSS prevention
export const sanitizeHtml = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Validate email format
export const validateEmail = (email: string): ValidationResult => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sanitized = sanitizeInput(email);
  
  if (!emailRegex.test(sanitized)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  
  if (sanitized.length > 254) {
    return { isValid: false, error: 'Email too long' };
  }
  
  return { isValid: true, sanitizedValue: sanitized };
};

// Validate phone number
export const validatePhone = (phone: string): ValidationResult => {
  const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,15}$/;
  const sanitized = sanitizeInput(phone);
  
  if (!phoneRegex.test(sanitized)) {
    return { isValid: false, error: 'Invalid phone number format' };
  }
  
  return { isValid: true, sanitizedValue: sanitized };
};

// Validate user ID (UUID format)
export const validateUserId = (userId: string): ValidationResult => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(userId)) {
    return { isValid: false, error: 'Invalid user ID format' };
  }
  
  return { isValid: true, sanitizedValue: userId };
};

// Validate text input with length limits
export const validateText = (
  text: string, 
  minLength: number = 0, 
  maxLength: number = 1000
): ValidationResult => {
  if (typeof text !== 'string') {
    return { isValid: false, error: 'Text must be a string' };
  }
  
  const sanitized = sanitizeHtml(text.trim());
  
  if (sanitized.length < minLength) {
    return { isValid: false, error: `Text must be at least ${minLength} characters` };
  }
  
  if (sanitized.length > maxLength) {
    return { isValid: false, error: `Text must be no more than ${maxLength} characters` };
  }
  
  return { isValid: true, sanitizedValue: sanitized };
};

// Validate numeric input
export const validateNumber = (
  value: any, 
  min?: number, 
  max?: number
): ValidationResult => {
  const num = Number(value);
  
  if (isNaN(num)) {
    return { isValid: false, error: 'Value must be a number' };
  }
  
  if (min !== undefined && num < min) {
    return { isValid: false, error: `Value must be at least ${min}` };
  }
  
  if (max !== undefined && num > max) {
    return { isValid: false, error: `Value must be no more than ${max}` };
  }
  
  return { isValid: true, sanitizedValue: num };
};

// Validate URL format
export const validateUrl = (url: string): ValidationResult => {
  try {
    const urlObj = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'Only HTTP and HTTPS URLs are allowed' };
    }
    
    return { isValid: true, sanitizedValue: url };
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }
};

// Rate limiting helper
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (
  identifier: string, 
  maxRequests: number = 10, 
  windowMs: number = 60000
): boolean => {
  const now = Date.now();
  const key = identifier;
  
  const existing = rateLimitMap.get(key);
  
  if (!existing || now > existing.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (existing.count >= maxRequests) {
    return false;
  }
  
  existing.count++;
  return true;
};
