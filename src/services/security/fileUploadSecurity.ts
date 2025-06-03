
import { toast } from 'sonner';

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

const MAX_FILE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_MB = 10;

/**
 * Validates file for image uploads
 */
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: 'Only JPEG, PNG, and WebP images are allowed'
    };
  }
  
  // Check file size
  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    return {
      isValid: false,
      error: `Image size cannot exceed ${MAX_IMAGE_SIZE_MB}MB`
    };
  }
  
  // Check for suspicious file names
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    return {
      isValid: false,
      error: 'Invalid file name'
    };
  }
  
  return { isValid: true };
};

/**
 * Validates file for document uploads
 */
export const validateDocumentFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file type
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: 'Only PDF and image files are allowed for documents'
    };
  }
  
  // Check file size
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return {
      isValid: false,
      error: `Document size cannot exceed ${MAX_FILE_SIZE_MB}MB`
    };
  }
  
  // Check for suspicious file names
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    return {
      isValid: false,
      error: 'Invalid file name'
    };
  }
  
  return { isValid: true };
};

/**
 * Sanitizes file name
 */
export const sanitizeFileName = (fileName: string): string => {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .toLowerCase();
};

/**
 * Validates multiple files
 */
export const validateFiles = (
  files: File[],
  type: 'image' | 'document' = 'image'
): { validFiles: File[]; errors: string[] } => {
  const validFiles: File[] = [];
  const errors: string[] = [];
  
  for (const file of files) {
    const validation = type === 'image' 
      ? validateImageFile(file)
      : validateDocumentFile(file);
    
    if (validation.isValid) {
      validFiles.push(file);
    } else {
      errors.push(`${file.name}: ${validation.error}`);
    }
  }
  
  return { validFiles, errors };
};
