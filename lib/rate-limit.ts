import { env } from '@/lib/env';

type Bucket = { count: number; resetAt: number };
const store = new Map<string, Bucket>();

export function checkRateLimit(key: string, max = env.RATE_LIMIT_MAX, windowSeconds = env.RATE_LIMIT_WINDOW_SECONDS) {
  const now = Date.now();
  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, remaining: max - 1 };
  }
  if (existing.count >= max) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((existing.resetAt - now) / 1000) };
  }
  existing.count += 1;
  return { allowed: true, remaining: Math.max(0, max - existing.count) };
}
