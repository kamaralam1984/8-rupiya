/**
 * Simple in-memory cache utility
 * For production, consider using Redis
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class Cache {
  private store = new Map<string, CacheEntry<any>>();
  private maxSize = 1000; // Maximum cache entries

  // Set cache value
  set<T>(key: string, value: T, ttl: number = 60 * 1000): void {
    // Remove oldest entries if cache is full
    if (this.store.size >= this.maxSize) {
      const firstKey = this.store.keys().next().value;
      if (firstKey) {
        this.store.delete(firstKey);
      }
    }

    this.store.set(key, {
      data: value,
      expiresAt: Date.now() + ttl,
    });
  }

  // Get cache value
  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.data as T;
  }

  // Delete cache entry
  delete(key: string): void {
    this.store.delete(key);
  }

  // Clear all cache
  clear(): void {
    this.store.clear();
  }

  // Clean expired entries
  clean(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  // Get cache size
  size(): number {
    return this.store.size;
  }
}

// Global cache instance
export const cache = new Cache();

// Clean expired entries every 5 minutes
setInterval(() => {
  cache.clean();
}, 5 * 60 * 1000);

// Cache wrapper for async functions
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    keyGenerator?: (...args: Parameters<T>) => string;
    ttl?: number;
    enabled?: boolean;
  } = {}
): T {
  const {
    keyGenerator = (...args) => JSON.stringify(args),
    ttl = 60 * 1000, // 1 minute default
    enabled = true,
  } = options;

  return (async (...args: Parameters<T>) => {
    if (!enabled) {
      return fn(...args);
    }

    const key = `cache:${fn.name}:${keyGenerator(...args)}`;
    const cached = cache.get<ReturnType<T>>(key);

    if (cached !== null) {
      return cached;
    }

    const result = await fn(...args);
    cache.set(key, result, ttl);
    return result;
  }) as T;
}

// Cache key generators
export const cacheKeys = {
  shops: (params: Record<string, any>) => `shops:${JSON.stringify(params)}`,
  categories: () => 'categories:all',
  banners: (section: string, location: string) => `banners:${section}:${location}`,
  homepage: () => 'homepage:settings',
  analytics: (dateRange: string) => `analytics:${dateRange}`,
  user: (userId: string) => `user:${userId}`,
  shop: (shopId: string) => `shop:${shopId}`,
};

