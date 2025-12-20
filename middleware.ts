import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting store (in-memory, for production use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration
const RATE_LIMIT = {
  // API routes - stricter limits
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },
  // Auth routes - reasonable limit
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // 10 requests per 15 minutes (more reasonable for legitimate users)
  },
  // General routes
  general: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
  },
};

// Get client IP address
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIP || 'unknown';
  return ip;
}

// Rate limiting function
function checkRateLimit(
  ip: string,
  pathname: string,
  limitConfig: { windowMs: number; maxRequests: number }
): boolean {
  const now = Date.now();
  const key = `${ip}:${pathname}`;
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    // Create new record
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + limitConfig.windowMs,
    });
    return true;
  }

  if (record.count >= limitConfig.maxRequests) {
    return false; // Rate limit exceeded
  }

  // Increment count
  record.count++;
  return true;
}

// Clean up old rate limit records (prevent memory leak)
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes

// Security headers
function getSecurityHeaders() {
  return {
    'X-DNS-Prefetch-Control': 'on',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "media-src 'self' data: https:",
      "connect-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://*.razorpay.com https://*.cloudinary.com https://api.ipapi.co",
      "frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "upgrade-insecure-requests",
    ].join('; '),
  };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIP(request);

  // Apply security headers to all routes
  const response = NextResponse.next();
  const securityHeaders = getSecurityHeaders();
  
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    // Determine rate limit config based on route
    let limitConfig = RATE_LIMIT.api;
    
    if (pathname.startsWith('/api/auth/') || 
        pathname.startsWith('/api/agent/auth/') || 
        pathname.startsWith('/api/operator/auth/') ||
        pathname.startsWith('/api/shopper/auth/')) {
      limitConfig = RATE_LIMIT.auth;
    }

    // Check rate limit
    if (!checkRateLimit(ip, pathname, limitConfig)) {
      return NextResponse.json(
        { 
          error: 'Too many requests', 
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil(limitConfig.windowMs / 1000),
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(limitConfig.windowMs / 1000)),
            'X-RateLimit-Limit': String(limitConfig.maxRequests),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    // Add rate limit headers to response
    const record = rateLimitMap.get(`${ip}:${pathname}`);
    if (record) {
      response.headers.set('X-RateLimit-Limit', String(limitConfig.maxRequests));
      response.headers.set('X-RateLimit-Remaining', String(Math.max(0, limitConfig.maxRequests - record.count)));
      response.headers.set('X-RateLimit-Reset', String(Math.ceil(record.resetTime / 1000)));
    }
  }

  // Block suspicious patterns
  const suspiciousPatterns = [
    /\.\./, // Path traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection
    /exec\(/i, // Code execution
    /eval\(/i, // Code execution
  ];

  const url = request.url.toLowerCase();
  if (suspiciousPatterns.some(pattern => pattern.test(url))) {
    console.warn(`🚨 Suspicious request blocked from ${ip}: ${pathname}`);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }

  // Block requests with suspicious headers
  const userAgent = request.headers.get('user-agent') || '';
  const suspiciousUserAgents = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /masscan/i,
    /scanner/i,
  ];

  if (suspiciousUserAgents.some(pattern => pattern.test(userAgent))) {
    console.warn(`🚨 Suspicious user agent blocked from ${ip}: ${userAgent}`);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 403 }
    );
  }

  return response;
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};

