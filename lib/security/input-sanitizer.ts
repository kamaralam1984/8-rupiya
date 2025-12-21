/**
 * Input sanitization for preventing XSS, SQL injection, and other attacks
 */

// HTML entity encoding
const htmlEntities: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

// Escape HTML to prevent XSS
export function escapeHtml(text: string): string {
  if (typeof text !== 'string') {
    return '';
  }
  
  return text.replace(/[&<>"'\/]/g, (char) => htmlEntities[char] || char);
}

// Sanitize user input for database queries
export function sanitizeForDatabase(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove SQL injection patterns
  return input
    .replace(/['";\\]/g, '') // Remove quotes and semicolons
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove SQL block comments
    .replace(/\*\//g, '')
    .trim();
}

// Sanitize for MongoDB (prevent NoSQL injection)
export function sanitizeForMongoDB(input: any): any {
  if (typeof input === 'string') {
    // Remove MongoDB operators
    return input.replace(/\$[a-zA-Z]+/g, '');
  }
  
  if (Array.isArray(input)) {
    return input.map(item => sanitizeForMongoDB(item));
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      // Block dangerous MongoDB operators
      if (key.startsWith('$') && !['$and', '$or', '$nor'].includes(key)) {
        continue;
      }
      sanitized[key] = sanitizeForMongoDB(value);
    }
    return sanitized;
  }
  
  return input;
}

// Validate and sanitize search query
export function sanitizeSearchQuery(query: string, maxLength: number = 100): string {
  if (typeof query !== 'string') {
    return '';
  }
  
  // Remove dangerous characters
  let sanitized = query
    .replace(/[<>'"\\]/g, '') // Remove HTML and SQL special chars
    .replace(/[{}[\]]/g, '') // Remove JSON special chars
    .replace(/\$\w+/g, '') // Remove MongoDB operators
    .trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

// Validate file upload
export function validateFileUpload(
  file: { name: string; size: number; type?: string },
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'],
  } = options;
  
  // Check file name
  if (!file.name || typeof file.name !== 'string') {
    return { valid: false, error: 'Invalid file name' };
  }
  
  // Check for path traversal
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    return { valid: false, error: 'Invalid file name' };
  }
  
  // Check extension
  const extension = file.name.toLowerCase().split('.').pop();
  if (!extension || !allowedExtensions.includes(extension)) {
    return { valid: false, error: `File type not allowed. Allowed types: ${allowedExtensions.join(', ')}` };
  }
  
  // Check MIME type if provided
  if (file.type && !allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` };
  }
  
  // Check file size
  if (file.size > maxSize) {
    return { valid: false, error: `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB` };
  }
  
  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }
  
  return { valid: true };
}

// Sanitize filename
export function sanitizeFilename(filename: string): string {
  if (typeof filename !== 'string') {
    return 'file';
  }
  
  // Remove path traversal attempts
  let sanitized = filename
    .replace(/\.\./g, '')
    .replace(/[\/\\]/g, '_')
    .replace(/[<>:"|?*]/g, '_')
    .trim();
  
  // Limit length
  if (sanitized.length > 255) {
    const extension = sanitized.split('.').pop();
    sanitized = sanitized.substring(0, 255 - (extension?.length || 0) - 1) + '.' + extension;
  }
  
  return sanitized || 'file';
}


