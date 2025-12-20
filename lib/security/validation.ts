/**
 * Input validation utilities for security
 */

// Sanitize string input
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove null bytes and control characters
  let sanitized = input
    .replace(/\0/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

// Validate email format
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const normalizedEmail = email.toLowerCase().trim();
  
  // Check length
  if (normalizedEmail.length > 254) {
    return false;
  }
  
  return emailRegex.test(normalizedEmail);
}

// Validate phone number (Indian format)
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  const cleanPhone = phone.replace(/\s+/g, '');
  const phoneRegex = /^(\+91|91|0)?[6-9]\d{9}$/;
  
  return phoneRegex.test(cleanPhone);
}

// Validate pincode (Indian format)
export function isValidPincode(pincode: string): boolean {
  if (!pincode || typeof pincode !== 'string') {
    return false;
  }
  
  const pincodeRegex = /^[1-9][0-9]{5}$/;
  return pincodeRegex.test(pincode.trim());
}

// Validate URL
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  try {
    const urlObj = new URL(url);
    // Only allow http and https
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

// Validate coordinates
export function isValidCoordinates(lat: number, lng: number): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return false;
  }
  
  // Valid latitude: -90 to 90
  // Valid longitude: -180 to 180
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

// Validate MongoDB ObjectId
export function isValidObjectId(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }
  
  return /^[0-9a-fA-F]{24}$/.test(id);
}

// Sanitize object recursively
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  maxStringLength: number = 1000
): T {
  const sanitized = {} as T;
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeString(value, maxStringLength) as T[keyof T];
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key as keyof T] = sanitizeObject(value, maxStringLength) as T[keyof T];
    } else if (Array.isArray(value)) {
      sanitized[key as keyof T] = value.map(item => 
        typeof item === 'string' 
          ? sanitizeString(item, maxStringLength)
          : typeof item === 'object' && item !== null
          ? sanitizeObject(item, maxStringLength)
          : item
      ) as T[keyof T];
    } else {
      sanitized[key as keyof T] = value;
    }
  }
  
  return sanitized;
}

// Validate password strength
export function isStrongPassword(password: string): { valid: boolean; message?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (password.length > 128) {
    return { valid: false, message: 'Password must be less than 128 characters' };
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  // Check for at least one number
  if (!/\d/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  // Check for common weak passwords
  const commonPasswords = [
    'password', '12345678', 'qwerty', 'abc123', 'password123',
    'admin', 'letmein', 'welcome', 'monkey', '1234567890',
  ];
  
  if (commonPasswords.some(weak => password.toLowerCase().includes(weak))) {
    return { valid: false, message: 'Password is too common. Please choose a stronger password' };
  }
  
  return { valid: true };
}

// Validate file type
export function isValidFileType(
  filename: string,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
): boolean {
  if (!filename || typeof filename !== 'string') {
    return false;
  }
  
  const extension = filename.toLowerCase().split('.').pop();
  const extensionMap: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
    'gif': 'image/gif',
  };
  
  const mimeType = extensionMap[extension || ''];
  return mimeType ? allowedTypes.includes(mimeType) : false;
}

// Validate file size (in bytes)
export function isValidFileSize(size: number, maxSize: number = 5 * 1024 * 1024): boolean {
  return typeof size === 'number' && size > 0 && size <= maxSize;
}

// Prevent NoSQL injection
export function sanitizeMongoQuery(query: any): any {
  if (typeof query !== 'object' || query === null) {
    return query;
  }
  
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(query)) {
    // Block dangerous MongoDB operators
    if (key.startsWith('$')) {
      // Only allow safe operators
      const safeOperators = ['$and', '$or', '$nor', '$in', '$nin', '$eq', '$ne', '$gt', '$gte', '$lt', '$lte'];
      if (!safeOperators.includes(key)) {
        continue; // Skip dangerous operators
      }
    }
    
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeMongoQuery(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

// Rate limiting helper (for API routes)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 60,
  windowMs: number = 60 * 1000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = requestCounts.get(identifier);
  
  if (!record || now > record.resetTime) {
    requestCounts.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    };
  }
  
  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }
  
  record.count++;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

// Clear rate limit for specific identifier
export function clearRateLimit(identifier: string): void {
  requestCounts.delete(identifier);
}

// Clear all rate limits
export function clearAllRateLimits(): void {
  requestCounts.clear();
}

// Clean up old rate limit records
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes

