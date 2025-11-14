
/**
 * Enhanced file upload security utilities
 */
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedFile?: File;
}

// Allowed file types for documents
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp'
];

// Allowed file types for images (room listings)
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp'
];

// Maximum file sizes (in bytes) - increased since we compress images
const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50MB - we'll compress it down anyway

// Dangerous file extensions to block
const BLOCKED_EXTENSIONS = [
  '.exe', '.bat', '.com', '.cmd', '.scr', '.pif', '.vbs', '.js', '.jar',
  '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz',
  '.php', '.asp', '.aspx', '.jsp', '.sh', '.ps1', '.py', '.rb'
];

/**
 * Sanitize filename to prevent directory traversal and other attacks
 */
export const sanitizeFileName = (fileName: string): string => {
  // Remove directory traversal attempts
  let sanitized = fileName.replace(/[\/\\]/g, '');
  
  // Remove dangerous characters
  sanitized = sanitized.replace(/[<>:"|?*]/g, '');
  
  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '');
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.substring(sanitized.lastIndexOf('.'));
    const name = sanitized.substring(0, 255 - ext.length);
    sanitized = name + ext;
  }
  
  // Ensure we have a valid filename
  if (!sanitized || sanitized === '') {
    sanitized = 'file_' + Date.now();
  }
  
  return sanitized;
};

/**
 * Check if file extension is blocked
 */
const hasBlockedExtension = (fileName: string): boolean => {
  const lowerFileName = fileName.toLowerCase();
  return BLOCKED_EXTENSIONS.some(ext => lowerFileName.endsWith(ext));
};

/**
 * Validate file header (magic bytes) to ensure file type matches extension
 */
const validateFileHeader = async (file: File): Promise<boolean> => {
  try {
    const buffer = await file.slice(0, 8).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    // Check common file signatures
    const signatures = {
      pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
      jpg: [0xFF, 0xD8, 0xFF],
      png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
      gif: [0x47, 0x49, 0x46],
      webp: [0x52, 0x49, 0x46, 0x46] // RIFF (first 4 bytes of WebP)
    };
    
    // Check if file header matches expected type
    for (const [type, signature] of Object.entries(signatures)) {
      if (file.type.includes(type) || file.name.toLowerCase().includes(type)) {
        const matches = signature.every((byte, index) => bytes[index] === byte);
        if (matches) return true;
      }
    }
    
    // For WebP, check additional bytes
    if (file.type === 'image/webp' && bytes.length >= 8) {
      const webpCheck = bytes[8] === 0x57 && bytes[9] === 0x45 && 
                       bytes[10] === 0x42 && bytes[11] === 0x50;
      if (webpCheck) return true;
    }
    
    return false;
  } catch {
    return false;
  }
};

/**
 * Validate document file
 */
export const validateDocumentFile = (file: File): FileValidationResult => {
  // Check file size
  if (file.size > MAX_DOCUMENT_SIZE) {
    return {
      isValid: false,
      error: `Document size must be less than ${MAX_DOCUMENT_SIZE / (1024 * 1024)}MB`
    };
  }
  
  // Check file type
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: 'Only PDF, JPEG, JPG, PNG, and WebP files are allowed for documents'
    };
  }
  
  // Check for blocked extensions
  if (hasBlockedExtension(file.name)) {
    return {
      isValid: false,
      error: 'File type not allowed for security reasons'
    };
  }
  
  // Sanitize filename
  const sanitizedName = sanitizeFileName(file.name);
  const sanitizedFile = new File([file], sanitizedName, { type: file.type });
  
  return {
    isValid: true,
    sanitizedFile
  };
};

/**
 * Validate image file
 */
export const validateImageFile = (file: File): FileValidationResult => {
  // Check file size
  if (file.size > MAX_IMAGE_SIZE) {
    return {
      isValid: false,
      error: `Image size must be less than ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`
    };
  }
  
  // Check file type - normalize jpg to jpeg
  const normalizedType = file.type === 'image/jpg' ? 'image/jpeg' : file.type;
  if (!ALLOWED_IMAGE_TYPES.includes(normalizedType)) {
    return {
      isValid: false,
      error: 'Only PNG, JPG/JPEG, and WEBP images are allowed'
    };
  }
  
  // Check for blocked extensions
  if (hasBlockedExtension(file.name)) {
    return {
      isValid: false,
      error: 'File type not allowed for security reasons'
    };
  }
  
  // Sanitize filename
  const sanitizedName = sanitizeFileName(file.name);
  const sanitizedFile = new File([file], sanitizedName, { type: file.type });
  
  return {
    isValid: true,
    sanitizedFile
  };
};

/**
 * Validate multiple files with comprehensive checks
 */
export const validateFiles = (
  files: File[], 
  type: 'image' | 'document' = 'image'
): { validFiles: File[]; errors: string[] } => {
  const validFiles: File[] = [];
  const errors: string[] = [];
  
  if (files.length === 0) {
    errors.push('No files selected');
    return { validFiles, errors };
  }
  
  if (files.length > 5) {
    errors.push('Maximum 5 files allowed');
    return { validFiles, errors };
  }
  
  for (const file of files) {
    const validation = type === 'document' 
      ? validateDocumentFile(file)
      : validateImageFile(file);
    
    if (validation.isValid && validation.sanitizedFile) {
      validFiles.push(validation.sanitizedFile);
    } else {
      errors.push(`${file.name}: ${validation.error}`);
    }
  }
  
  return { validFiles, errors };
};

/**
 * Generate secure filename with timestamp and random string
 */
export const generateSecureFileName = (originalName: string): string => {
  const ext = originalName.substring(originalName.lastIndexOf('.'));
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}_${random}${ext}`;
};
