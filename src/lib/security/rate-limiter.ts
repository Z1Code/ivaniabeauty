// In-memory rate limiter
// NOTE: Resets on serverless cold starts (Vercel). For production-grade
// rate limiting, replace with Upstash Redis or Vercel KV.
// Map<compositeKey, {count: number, resetAt: number}>

const store = new Map<string, { count: number; resetAt: number }>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const endpointConfigs: Record<string, RateLimitConfig> = {
  "/api/checkout": { maxRequests: 10, windowMs: 60 * 1000 },
  "/api/auth/session": { maxRequests: 10, windowMs: 60 * 1000 },
  "/api/analytics": { maxRequests: 100, windowMs: 60 * 1000 },
  "/api/reviews": { maxRequests: 20, windowMs: 60 * 1000 },
  "/api/coupons/validate": { maxRequests: 30, windowMs: 60 * 1000 },
};

const defaultConfig: RateLimitConfig = { maxRequests: 60, windowMs: 60 * 1000 };

export function rateLimit(
  ip: string,
  endpoint: string
): { allowed: boolean; remaining: number } {
  const config = endpointConfigs[endpoint] || defaultConfig;
  const key = `${ip}:${endpoint}`;
  const now = Date.now();

  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1 };
  }

  entry.count++;

  if (entry.count > config.maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: config.maxRequests - entry.count };
}
