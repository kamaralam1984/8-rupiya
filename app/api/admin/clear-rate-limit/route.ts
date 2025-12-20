/**
 * Admin API to clear rate limits
 * Use this to reset rate limits if needed
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { clearAllRateLimits, clearRateLimit } from '@/lib/security/validation';

export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { identifier } = body;

    if (identifier) {
      // Clear specific identifier
      clearRateLimit(identifier);
      return NextResponse.json({
        success: true,
        message: `Rate limit cleared for: ${identifier}`,
      });
    } else {
      // Clear all rate limits
      clearAllRateLimits();
      return NextResponse.json({
        success: true,
        message: 'All rate limits cleared',
      });
    }
  } catch (error: any) {
    console.error('Error clearing rate limit:', error);
    return NextResponse.json(
      { error: 'Failed to clear rate limit', details: error.message },
      { status: 500 }
    );
  }
});

