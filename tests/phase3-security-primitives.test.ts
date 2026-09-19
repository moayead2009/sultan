import { describe, expect, it, vi } from 'vitest';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

describe('Phase 3 application security primitives', () => {
  it('enforces rate limits with a retry window', () => {
    const key = 'phase3-rate-' + Date.now() + '-' + Math.random();
    expect(checkRateLimit(key, 2, 60).allowed).toBe(true);
    expect(checkRateLimit(key, 2, 60).allowed).toBe(true);
    const blocked = checkRateLimit(key, 2, 60);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBeGreaterThan(0);
    expect(blocked.retryAfter).toBeLessThanOrEqual(60);
  });

  it('redacts sensitive structured log fields', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      logger.warn('phase3.security.test', {
        password: 'secret-password',
        token: 'secret-token',
        safe: 'visible'
      });
      const line = String(spy.mock.calls[0]?.[0] ?? '');
      expect(line).not.toContain('secret-password');
      expect(line).not.toContain('secret-token');
      expect(line).toContain('[REDACTED]');
      expect(line).toContain('visible');
    } finally {
      spy.mockRestore();
    }
  });
});
