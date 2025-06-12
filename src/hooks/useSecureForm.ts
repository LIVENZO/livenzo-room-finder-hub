
import { useState, useCallback } from 'react';
import { EnhancedValidator, ValidationResult } from '@/services/security/enhancedValidation';
import { securityMonitor } from '@/services/security/securityMonitor';

interface FormField {
  value: string;
  error?: string;
  touched: boolean;
}

interface ValidationRule {
  type: 'email' | 'phone' | 'publicId' | 'safeName' | 'safeDescription' | 'price' | 'url' | 'alphanumeric' | 'postcode';
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  customValidator?: (value: string) => ValidationResult;
}

export const useSecureForm = <T extends Record<string, string>>(
  initialValues: T,
  validationRules: Record<keyof T, ValidationRule>
) => {
  const [fields, setFields] = useState<Record<keyof T, FormField>>(() => {
    const initial: Record<keyof T, FormField> = {} as any;
    Object.keys(initialValues).forEach(key => {
      initial[key as keyof T] = {
        value: initialValues[key as keyof T],
        touched: false
      };
    });
    return initial;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  const validateField = useCallback((name: keyof T, value: string): ValidationResult => {
    const rule = validationRules[name];
    
    if (rule.customValidator) {
      return rule.customValidator(value);
    }

    return EnhancedValidator.validateAndSanitize(value, rule.type, {
      required: rule.required,
      maxLength: rule.maxLength,
      minLength: rule.minLength
    });
  }, [validationRules]);

  const updateField = useCallback((name: keyof T, value: string) => {
    setFields(prev => {
      const validation = validateField(name, value);
      
      // Log suspicious activity if validation fails with security issue
      if (!validation.isValid && validation.securityIssue) {
        securityMonitor.logSuspiciousActivity('malicious_form_input', {
          field_name: String(name),
          input_length: value.length,
          form_submit_count: submitCount
        });
      }

      return {
        ...prev,
        [name]: {
          value: validation.sanitizedValue || value,
          error: validation.isValid ? undefined : validation.error,
          touched: true
        }
      };
    });
  }, [validateField, submitCount]);

  const validateAllFields = useCallback((): boolean => {
    let isValid = true;
    const newFields = { ...fields };

    Object.keys(fields).forEach(key => {
      const fieldName = key as keyof T;
      const field = fields[fieldName];
      const validation = validateField(fieldName, field.value);

      newFields[fieldName] = {
        ...field,
        error: validation.isValid ? undefined : validation.error,
        touched: true
      };

      if (!validation.isValid) {
        isValid = false;
      }
    });

    setFields(newFields);
    return isValid;
  }, [fields, validateField]);

  const getValues = useCallback((): T => {
    const values = {} as T;
    Object.keys(fields).forEach(key => {
      values[key as keyof T] = fields[key as keyof T].value as T[keyof T];
    });
    return values;
  }, [fields]);

  const getSanitizedValues = useCallback((): T => {
    const values = {} as T;
    Object.keys(fields).forEach(key => {
      const fieldName = key as keyof T;
      const validation = validateField(fieldName, fields[fieldName].value);
      values[fieldName] = (validation.sanitizedValue || fields[fieldName].value) as T[keyof T];
    });
    return values;
  }, [fields, validateField]);

  const handleSubmit = useCallback(async (onSubmit: (values: T) => Promise<void> | void) => {
    setSubmitCount(prev => prev + 1);
    
    // Rate limiting check
    if (submitCount > 10) {
      securityMonitor.logSuspiciousActivity('excessive_form_submissions', {
        submit_count: submitCount + 1,
        time_window: '5_minutes'
      });
      throw new Error('Too many submission attempts. Please wait and try again.');
    }

    if (!validateAllFields()) {
      securityMonitor.logSuspiciousActivity('invalid_form_submission', {
        submit_count: submitCount + 1,
        invalid_fields: Object.keys(fields).filter(key => fields[key as keyof T].error)
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const sanitizedValues = getSanitizedValues();
      await onSubmit(sanitizedValues);
    } finally {
      setIsSubmitting(false);
    }
  }, [validateAllFields, getSanitizedValues, submitCount, fields]);

  const reset = useCallback(() => {
    setFields(() => {
      const resetFields: Record<keyof T, FormField> = {} as any;
      Object.keys(initialValues).forEach(key => {
        resetFields[key as keyof T] = {
          value: initialValues[key as keyof T],
          touched: false
        };
      });
      return resetFields;
    });
    setIsSubmitting(false);
    setSubmitCount(0);
  }, [initialValues]);

  const hasErrors = Object.values(fields).some(field => field.error);
  const isFormValid = !hasErrors && Object.values(fields).every(field => field.touched);

  return {
    fields,
    updateField,
    validateField,
    validateAllFields,
    getValues,
    getSanitizedValues,
    handleSubmit,
    reset,
    isSubmitting,
    hasErrors,
    isFormValid,
    submitCount
  };
};
