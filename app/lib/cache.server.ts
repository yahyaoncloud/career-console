// Simple in-memory cache with TTL for frequently accessed data
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const cache = new Map<string, CacheEntry<any>>();

export function getCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  if (Date.now() > entry.timestamp + entry.ttl) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

export function setCache<T>(key: string, data: T, ttl: number = 60000): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
}

export function clearCache(key?: string): void {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  SHORT: 30000,      // 30 seconds
  MEDIUM: 60000,     // 1 minute
  LONG: 300000,      // 5 minutes
  VERY_LONG: 600000  // 10 minutes
};
