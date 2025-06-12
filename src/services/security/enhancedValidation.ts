
import { securityMonitor } from './securityMonitor';

// Enhanced validation patterns
const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  alphanumeric: /^[a-zA-Z0-9\s]*$/,
  publicId: /^[a-z0-9]{3,10}$/,
  safeName: /^[a-zA-Z0-9\s\-_.]{1,100}$/,
  safeDescription: /^[a-zA-Z0-9\s\-_.,!?()]{1,1000}$/,
  url: /^https?:\/\/.+/,
  price: /^\d+(\.\d{1,2})?$/,
  postcode: /^[A-Z0-9\s\-]{3,10}$/i
};

// Suspicious patterns to detect potential attacks
const SUSPICIOUS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi, // Script tags
  /javascript:/gi, // JavaScript protocol
  /on\w+\s*=/gi, // Event handlers
  /expression\s*\(/gi, // CSS expressions
  /url\s*\(/gi, // CSS URL functions
  /import\s+/gi, // Import statements
  /eval\s*\(/gi, // Eval functions
  /document\./gi, // Document object access
  /window\./gi, // Window object access
  /\.\.\/|\.\.\\|%2e%2e/gi, // Path traversal
  /union\s+select/gi, // SQL injection
  /drop\s+table/gi, // SQL commands
  /insert\s+into/gi, // SQL injection
  /delete\s+from/gi, // SQL commands
  /'(\s*or\s*')/gi, // SQL injection patterns
  /"\s*or\s*"/gi, // SQL injection patterns
];

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedValue?: string;
  securityIssue?: boolean;
}

export class EnhancedValidator {
  static validateAndSanitize(
    value: string,
    type: keyof typeof VALIDATION_PATTERNS,
    options: {
      required?: boolean;
      maxLength?: number;
      minLength?: number;
      customPattern?: RegExp;
      allowHtml?: boolean;
    } = {}
  ): ValidationResult {
    const { required = false, maxLength, minLength, customPattern, allowHtml = false } = options;

    // Check for required field
    if (required && (!value || value.trim().length === 0)) {
      return { isValid: false, error: 'This field is required' };
    }

    // If not required and empty, return valid
    if (!required && (!value || value.trim().length === 0)) {
      return { isValid: true, sanitizedValue: '' };
    }

    const trimmedValue = value.trim();

    // Length validation
    if (minLength && trimmedValue.length < minLength) {
      return { isValid: false, error: `Minimum length is ${minLength} characters` };
    }

    if (maxLength && trimmedValue.length > maxLength) {
      return { isValid: false, error: `Maximum length is ${maxLength} characters` };
    }

    // Check for suspicious patterns
    const suspiciousPattern = SUSPICIOUS_PATTERNS.find(pattern => pattern.test(trimmedValue));
    if (suspiciousPattern) {
      // Log security event
      securityMonitor.logSuspiciousActivity('malicious_input_detected', {
        input_type: type,
        pattern_matched: suspiciousPattern.source,
        input_length: trimmedValue.length
      });

      return {
        isValid: false,
        error: 'Input contains invalid characters',
        securityIssue: true
      };
    }

    // Pattern validation
    const pattern = customPattern || VALIDATION_PATTERNS[type];
    if (pattern && !pattern.test(trimmedValue)) {
      return { isValid: false, error: this.getPatternErrorMessage(type) };
    }

    // Sanitize value
    let sanitizedValue = trimmedValue;
    if (!allowHtml) {
      sanitizedValue = this.sanitizeHtml(sanitizedValue);
    }

    return { isValid: true, sanitizedValue };
  }

  static validateEmail(email: string, required = false): ValidationResult {
    return this.validateAndSanitize(email, 'email', { required, maxLength: 254 });
  }

  static validatePhone(phone: string, required = false): ValidationResult {
    return this.validateAndSanitize(phone, 'phone', { required, maxLength: 20 });
  }

  static validatePublicId(publicId: string, required = false): ValidationResult {
    return this.validateAndSanitize(publicId, 'publicId', { required, minLength: 3, maxLength: 10 });
  }

  static validateName(name: string, required = false): ValidationResult {
    return this.validateAndSanitize(name, 'safeName', { required, minLength: 1, maxLength: 100 });
  }

  static validateDescription(description: string, required = false): ValidationResult {
    return this.validateAndSanitize(description, 'safeDescription', { required, maxLength: 1000 });
  }

  static validatePrice(price: string, required = false): ValidationResult {
    const result = this.validateAndSanitize(price, 'price', { required });
    if (result.isValid && result.sanitizedValue) {
      const numPrice = parseFloat(result.sanitizedValue);
      if (numPrice < 0) {
        return { isValid: false, error: 'Price cannot be negative' };
      }
      if (numPrice > 1000000) {
        return { isValid: false, error: 'Price seems unreasonably high' };
      }
    }
    return result;
  }

  static validateUrl(url: string, required = false): ValidationResult {
    return this.validateAndSanitize(url, 'url', { required, maxLength: 500 });
  }

  // Batch validation for forms
  static validateForm(fields: Record<string, { value: string; type: keyof typeof VALIDATION_PATTERNS; options?: any }>): {
    isValid: boolean;
    errors: Record<string, string>;
    sanitizedValues: Record<string, string>;
  } {
    const errors: Record<string, string> = {};
    const sanitizedValues: Record<string, string> = {};
    let isValid = true;

    for (const [fieldName, field] of Object.entries(fields)) {
      const result = this.validateAndSanitize(field.value, field.type, field.options);
      
      if (!result.isValid) {
        errors[fieldName] = result.error || 'Invalid input';
        isValid = false;
      } else {
        sanitizedValues[fieldName] = result.sanitizedValue || '';
      }
    }

    return { isValid, errors, sanitizedValues };
  }

  private static sanitizeHtml(input: string): string {
    // Basic HTML sanitization
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  private static getPatternErrorMessage(type: keyof typeof VALIDATION_PATTERNS): string {
    const messages = {
      email: 'Please enter a valid email address',
      phone: 'Please enter a valid phone number',
      alphanumeric: 'Only letters and numbers are allowed',
      publicId: 'ID must be 3-10 characters, lowercase letters and numbers only',
      safeName: 'Name contains invalid characters',
      safeDescription: 'Description contains invalid characters',
      url: 'Please enter a valid URL starting with http:// or https://',
      price: 'Please enter a valid price (e.g., 123.45)',
      postcode: 'Please enter a valid postcode'
    };

    return messages[type] || 'Invalid format';
  }
}
