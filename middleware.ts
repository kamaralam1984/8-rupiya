import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Add your middleware logic here
  return NextResponse.next()
}

export const config = {
  // Specify which paths this middleware should run on
  // Uncomment and modify as needed:
  // matcher: '/api/:path*',
}
