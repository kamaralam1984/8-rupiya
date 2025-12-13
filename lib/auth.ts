import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader, JWTPayload } from './jwt';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

export function authenticateRequest(request: NextRequest): {
  user: JWTPayload | null;
  error: string | null;
} {
  const authHeader = request.headers.get('authorization');
  let token = extractTokenFromHeader(authHeader);

  // Fallback: Check query parameter for token (useful for PDF exports)
  if (!token) {
    const { searchParams } = new URL(request.url);
    token = searchParams.get('token') || null;
  }

  if (!token) {
    return {
      user: null,
      error: 'No token provided',
    };
  }

  try {
    const user = verifyToken(token);
    return {
      user,
      error: null,
    };
  } catch (error: any) {
    return {
      user: null,
      error: error.message || 'Invalid token',
    };
  }
}

export function requireAuth(
  handler: (request: NextRequest, user: JWTPayload) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const { user, error } = authenticateRequest(request);

    if (!user || error) {
      return NextResponse.json(
        { error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    return handler(request, user);
  };
}

export function requireAdmin<T = any>(
  handler: (request: NextRequest, context: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: T) => {
    const { user, error } = authenticateRequest(request);

    if (!user || error) {
      return NextResponse.json(
        { error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    // Admin, Editor, ya Operator ko access do
    if (!['admin', 'editor', 'operator'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Admin, Editor, or Operator access required' },
        { status: 403 }
      );
    }

    return handler(request, context);
  };
}

/**
 * Require only admin role (not editor or operator)
 * Use this for operations that only admins should perform (e.g., user management)
 */
export function requireAdminOnly<T = any>(
  handler: (request: NextRequest, context: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: T) => {
    const { user, error } = authenticateRequest(request);

    if (!user || error) {
      return NextResponse.json(
        { error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    // Sirf admin ko access do
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    return handler(request, context);
  };
}

/**
 * Require admin or editor role (not operator)
 * Use this for operations that require editing permissions
 */
export function requireEditor<T = any>(
  handler: (request: NextRequest, context: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: T) => {
    const { user, error } = authenticateRequest(request);

    if (!user || error) {
      return NextResponse.json(
        { error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    // Admin ya Editor ko access do
    if (!['admin', 'editor'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Admin or Editor access required' },
        { status: 403 }
      );
    }

    return handler(request, context);
  };
}

/**
 * Require specific roles
 * Use this for custom role requirements
 */
export function requireRoles<T = any>(
  allowedRoles: string[],
  handler: (request: NextRequest, context: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: T) => {
    const { user, error } = authenticateRequest(request);

    if (!user || error) {
      return NextResponse.json(
        { error: error || 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: `Access denied. Required roles: ${allowedRoles.join(', ')}` },
        { status: 403 }
      );
    }

    return handler(request, context);
  };
}




