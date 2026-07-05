/**
 * WebSocket Rate Limiter
 * Prevents connection flooding and message spam
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
  connections: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const DEFAULT_LIMIT = 100;
const DEFAULT_WINDOW = 60000; // 1 minute
const CONNECTION_LIMIT = 5; // Max connections per IP in 1 minute

export function checkWebSocketRateLimit(
  clientId: string,
  limit: number = DEFAULT_LIMIT,
  windowMs: number = DEFAULT_WINDOW
): { allowed: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(clientId);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(clientId, {
      count: 1,
      resetTime: now + windowMs,
      connections: 1,
    });
    return { allowed: true, remaining: limit - 1, reset: windowMs };
  }

  // Check connection limit
  if (entry.connections >= CONNECTION_LIMIT && now <= entry.resetTime) {
    return { allowed: false, remaining: 0, reset: entry.resetTime - now };
  }

  entry.count += 1;
  entry.connections += 1;

  const allowed = entry.count <= limit;
  return { allowed, remaining: Math.max(0, limit - entry.count), reset: entry.resetTime - now };
}

export function checkConnectionLimit(clientId: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(clientId);

  if (!entry || now > entry.resetTime) {
    return true;
  }

  return entry.connections < CONNECTION_LIMIT;
}

export function resetConnectionCount(clientId: string): void {
  const entry = rateLimitStore.get(clientId);
  if (entry && entry.connections > 0) {
    entry.connections = Math.max(0, entry.connections - 1);
  }
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 300000); // Every 5 minutes