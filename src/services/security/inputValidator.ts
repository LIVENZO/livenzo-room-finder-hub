
import { toast } from 'sonner';

/**
 * Sanitizes user input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  return input
    .replace(/[<>]/g, '') // Remove basic HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Validates email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates phone number format
 */
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
};

/**
 * Validates file type for uploads
 */
export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

/**
 * Validates file size
 */
export const validateFileSize = (file: File, maxSizeInMB: number): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
};

/**
 * Comprehensive form validation
 */
export const validateFormData = (data: Record<string, any>, rules: Record<string, any>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  for (const [field, value] of Object.entries(data)) {
    const rule = rules[field];
    if (!rule) continue;
    
    // Required field validation
    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      errors.push(`${field} is required`);
      continue;
    }
    
    // Skip other validations if field is empty and not required
    if (!value) continue;
    
    // String length validation
    if (rule.minLength && value.length < rule.minLength) {
      errors.push(`${field} must be at least ${rule.minLength} characters`);
    }
    
    if (rule.maxLength && value.length > rule.maxLength) {
      errors.push(`${field} cannot exceed ${rule.maxLength} characters`);
    }
    
    // Email validation
    if (rule.type === 'email' && !validateEmail(value)) {
      errors.push(`${field} must be a valid email address`);
    }
    
    // Phone validation
    if (rule.type === 'phone' && !validatePhone(value)) {
      errors.push(`${field} must be a valid phone number`);
    }
    
    // Custom pattern validation
    if (rule.pattern && !rule.pattern.test(value)) {
      errors.push(`${field} format is invalid`);
    }
  }
  
  return { isValid: errors.length === 0, errors };
};
