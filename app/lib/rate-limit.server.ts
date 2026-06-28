import { LRUCache } from 'lru-cache';

const rateLimitCache = new LRUCache<string, number>({
  max: 500,
  ttl: 60 * 1000 // 1 minute
});

export async function checkRateLimit(
  identifier: string,
  limit: number = 100
): Promise<{ allowed: boolean; remaining: number }> {
  const current = (rateLimitCache.get(identifier) || 0) + 1;
  rateLimitCache.set(identifier, current);
  
  return {
    allowed: current <= limit,
    remaining: Math.max(0, limit - current)
  };
}
