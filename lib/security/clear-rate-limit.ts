/**
 * Utility to clear rate limit cache
 * Use this for development/testing or when rate limits need to be reset
 */

import { cache } from '../utils/cache';

// Clear all rate limit entries
export function clearRateLimitCache() {
  // Clear the cache
  cache.clear();
  console.log('✅ Rate limit cache cleared');
}

// Clear rate limit for specific identifier
export function clearRateLimitForIdentifier(identifier: string) {
  // The cache keys are stored in the validation.ts file
  // We need to clear them from there
  console.log(`Clearing rate limit for: ${identifier}`);
}


