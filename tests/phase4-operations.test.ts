import { describe, expect, it, vi } from 'vitest';
import { GET as health } from '@/app/api/health/route';
import { GET as ready } from '@/app/api/ready/route';
import { logger } from '@/lib/logger';
import { validateProductionEnvironment } from '@/lib/production-preflight';

const validProductionEnv = {
  DATABASE_URL: 'postgresql://db.example.test/solutions_gate',
  AUTH_SECRET: 'a-secure-production-secret-that-is-long-enough',
  APP_URL: 'https://www.example.test',
  NEXTAUTH_URL: 'https://www.example.test',
  STORAGE_DRIVER: 's3',
  OBJECT_STORAGE_BUCKET: 'solutions-gate-media',
  OBJECT_STORAGE_PUBLIC_URL: 'https://media.example.test',
  MAIL_PROVIDER: 'none',
  MAX_UPLOAD_BYTES: '10485760',
  RATE_LIMIT_WINDOW_SECONDS: '600',
  RATE_LIMIT_MAX: '5'
};

describe('Phase 4 production preflight', () => {
  it('accepts a complete provider-neutral production configuration', () => {
    expect(validateProductionEnvironment(validProductionEnv)).toEqual([]);
  });

  it('accepts local production media storage when its upload directory is explicit', () => {
    expect(validateProductionEnvironment({
      ...validProductionEnv,
      STORAGE_DRIVER: 'local',
      LOCAL_UPLOAD_DIR: 'public/uploads',
      OBJECT_STORAGE_BUCKET: undefined,
      OBJECT_STORAGE_PUBLIC_URL: undefined
    })).toEqual([]);
  });

  it('rejects development shortcuts and partial secret pairs', () => {
    const issues = validateProductionEnvironment({
      ...validProductionEnv,
      AUTH_SECRET: 'replace-with-me',
      APP_URL: 'http://www.example.test',
      STORAGE_DRIVER: 'invalid',
      OBJECT_STORAGE_ACCESS_KEY: 'access-only',
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'site-only'
    });
    expect(issues.join(' ')).toMatch(/AUTH_SECRET/);
    expect(issues.join(' ')).toMatch(/HTTPS/);
    expect(issues.join(' ')).toMatch(/STORAGE_DRIVER/);
    expect(issues.join(' ')).toMatch(/OBJECT_STORAGE_ACCESS_KEY/);
    expect(issues.join(' ')).toMatch(/TURNSTILE_SECRET_KEY/);
  });

  it('requires a local upload directory when local storage is selected', () => {
    const issues = validateProductionEnvironment({
      ...validProductionEnv,
      STORAGE_DRIVER: 'local',
      LOCAL_UPLOAD_DIR: '',
      OBJECT_STORAGE_BUCKET: undefined,
      OBJECT_STORAGE_PUBLIC_URL: undefined
    });
    expect(issues.join(' ')).toMatch(/LOCAL_UPLOAD_DIR/);
  });

  it('requires Resend credentials only when Resend is enabled', () => {
    const issues = validateProductionEnvironment({ ...validProductionEnv, MAIL_PROVIDER: 'resend' });
    expect(issues.join(' ')).toMatch(/MAIL_FROM/);
    expect(issues.join(' ')).toMatch(/RESEND_API_KEY/);
  });
});

describe('Phase 4 operational probes and logging', () => {
  it('provides a no-store liveness endpoint', async () => {
    const response = await health();
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    await expect(response.json()).resolves.toEqual({ status: 'ok' });
  });

  it('provides database-backed readiness in the test environment', async () => {
    const response = await ready();
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    await expect(response.json()).resolves.toEqual({ status: 'ready' });
  });

  it('recursively redacts common PII and secret fields from structured logs', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      logger.warn('phase4.logging.test', {
        safe: 'visible',
        email: 'person@example.test',
        nested: { authorization: 'Bearer secret', phone: '+1 555 555 5555' }
      });
      const line = String(spy.mock.calls[0]?.[0] ?? '');
      expect(line).toContain('visible');
      expect(line).not.toContain('person@example.test');
      expect(line).not.toContain('Bearer secret');
      expect(line).not.toContain('+1 555 555 5555');
      expect(line).toContain('[REDACTED]');
    } finally {
      spy.mockRestore();
    }
  });
});
