/**
 * API Security utilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, sanitizeObject } from './validation';
import { sanitizeForMongoDB } from './input-sanitizer';
import { sanitizeSearchQuery, validateFileUpload } from './input-sanitizer';

// Get client IP
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIP || 'unknown';
  return ip;
}

// Rate limit wrapper for API routes
export function withRateLimit(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  options: {
    maxRequests?: number;
    windowMs?: number;
    identifier?: (request: NextRequest) => string;
  } = {}
) {
  const {
    maxRequests = 60,
    windowMs = 60 * 1000,
    identifier = (req) => `${getClientIP(req)}:${req.nextUrl.pathname}`,
  } = options;

  return async (request: NextRequest, ...args: any[]) => {
    const id = identifier(request);
    const rateLimitResult = checkRateLimit(id, maxRequests, windowMs);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil(rateLimitResult.resetTime / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rateLimitResult.resetTime / 1000)),
            'X-RateLimit-Limit': String(maxRequests),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(Math.ceil(rateLimitResult.resetTime / 1000)),
          },
        }
      );
    }

    // Add rate limit headers
    const response = await handler(request, ...args);
    response.headers.set('X-RateLimit-Limit', String(maxRequests));
    response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(rateLimitResult.resetTime / 1000)));

    return response;
  };
}

// Input validation wrapper
export function withInputValidation(
  handler: (request: NextRequest, body: any, ...args: any[]) => Promise<NextResponse>,
  validator?: (body: any) => { valid: boolean; error?: string }
) {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      // Parse and sanitize body
      let body: any = {};
      
      if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
        try {
          body = await request.json();
        } catch (error) {
          return NextResponse.json(
            { error: 'Invalid JSON in request body' },
            { status: 400 }
          );
        }

        // Sanitize body
        body = sanitizeObject(body);
        body = sanitizeForMongoDB(body);
      }

      // Run custom validator if provided
      if (validator) {
        const validation = validator(body);
        if (!validation.valid) {
          return NextResponse.json(
            { error: validation.error || 'Validation failed' },
            { status: 400 }
          );
        }
      }

      return await handler(request, body, ...args);
    } catch (error: any) {
      console.error('Input validation error:', error);
      return NextResponse.json(
        { error: 'Invalid request', details: error.message },
        { status: 400 }
      );
    }
  };
}

// Security headers middleware
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}

// Validate request size
export function validateRequestSize(
  request: NextRequest,
  maxSize: number = 10 * 1024 * 1024 // 10MB default
): { valid: boolean; error?: string } {
  const contentLength = request.headers.get('content-length');
  
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (size > maxSize) {
      return {
        valid: false,
        error: `Request body too large. Maximum size: ${maxSize / 1024 / 1024}MB`,
      };
    }
  }
  
  return { valid: true };
}

// Block suspicious requests
export function isSuspiciousRequest(request: NextRequest): { suspicious: boolean; reason?: string } {
  const url = request.url.toLowerCase();
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';
  
  // Check for path traversal
  if (url.includes('..') || url.includes('%2e%2e')) {
    return { suspicious: true, reason: 'Path traversal attempt' };
  }
  
  // Check for XSS attempts
  if (url.includes('<script') || url.includes('%3cscript')) {
    return { suspicious: true, reason: 'XSS attempt detected' };
  }
  
  // Check for SQL injection patterns
  const sqlPatterns = [
    /union.*select/i,
    /drop.*table/i,
    /delete.*from/i,
    /insert.*into/i,
    /exec\(/i,
  ];
  
  if (sqlPatterns.some(pattern => pattern.test(url))) {
    return { suspicious: true, reason: 'SQL injection attempt' };
  }
  
  // Check for suspicious user agents
  const suspiciousAgents = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /masscan/i,
    /scanner/i,
    /bot/i,
  ];
  
  if (suspiciousAgents.some(pattern => pattern.test(userAgent))) {
    // Allow legitimate bots (Google, Bing, etc.)
    const legitimateBots = [
      /googlebot/i,
      /bingbot/i,
      /slurp/i,
      /duckduckbot/i,
      /baiduspider/i,
      /yandexbot/i,
    ];
    
    if (!legitimateBots.some(pattern => pattern.test(userAgent))) {
      return { suspicious: true, reason: 'Suspicious user agent' };
    }
  }
  
  return { suspicious: false };
}

// Comprehensive security wrapper
export function withSecurity(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  options: {
    rateLimit?: {
      maxRequests?: number;
      windowMs?: number;
    };
    validateInput?: (body: any) => { valid: boolean; error?: string };
    maxRequestSize?: number;
  } = {}
) {
  return async (request: NextRequest, ...args: any[]) => {
    // Check for suspicious requests
    const suspicious = isSuspiciousRequest(request);
    if (suspicious.suspicious) {
      console.warn(`🚨 Suspicious request blocked: ${suspicious.reason}`, {
        ip: getClientIP(request),
        url: request.url,
        userAgent: request.headers.get('user-agent'),
      });
      
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }
    
    // Validate request size
    if (options.maxRequestSize) {
      const sizeCheck = validateRequestSize(request, options.maxRequestSize);
      if (!sizeCheck.valid) {
        return NextResponse.json(
          { error: sizeCheck.error },
          { status: 413 }
        );
      }
    }
    
    // Apply rate limiting
    if (options.rateLimit) {
      const rateLimitHandler = withRateLimit(handler, {
        maxRequests: options.rateLimit.maxRequests,
        windowMs: options.rateLimit.windowMs,
      });
      
      const response = await rateLimitHandler(request, ...args);
      return addSecurityHeaders(response);
    }
    
    // Apply input validation
    if (options.validateInput) {
      const validatedHandler = withInputValidation(handler, options.validateInput);
      const response = await validatedHandler(request, ...args);
      return addSecurityHeaders(response);
    }
    
    const response = await handler(request, ...args);
    return addSecurityHeaders(response);
  };
}

