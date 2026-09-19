import { describe, expect, it } from 'vitest';
import { isProtectedRedirectPath, validateRedirectRule } from '@/lib/redirects';

describe('Phase 1 redirect validation', () => {
  it('rejects protected source and local target paths', () => {
    for (const path of ['/admin', '/admin/users', '/preview/en', '/api/auth/session', '/internal/health', '/_next/static/file.js']) {
      expect(isProtectedRedirectPath(path)).toBe(true);
      expect(() => validateRedirectRule({ fromPath: path, toPath: '/en', enabled: true })).toThrow(/protected/i);
    }
    expect(() => validateRedirectRule({ fromPath: '/old', toPath: '/api/internal', enabled: true })).toThrow(/protected/i);
  });

  it('rejects direct loops including query-string variants', () => {
    expect(() => validateRedirectRule({ fromPath: '/a', toPath: '/a', enabled: true })).toThrow(/loop/i);
    expect(() => validateRedirectRule({ fromPath: '/a', toPath: '/a?campaign=1', enabled: true })).toThrow(/loop/i);
  });

  it('rejects multi-step redirect loops', () => {
    const existing = [
      { id: 'one', fromPath: '/a', toPath: '/b', enabled: true },
      { id: 'two', fromPath: '/b', toPath: '/c', enabled: true }
    ];
    expect(() => validateRedirectRule({ fromPath: '/c', toPath: '/a', enabled: true }, existing)).toThrow(/loop/i);
  });

  it('allows terminating chains and ignores a disabled candidate loop', () => {
    const existing = [
      { id: 'one', fromPath: '/a', toPath: '/b', enabled: true },
      { id: 'two', fromPath: '/b', toPath: '/en/final', enabled: true }
    ];
    expect(() => validateRedirectRule({ fromPath: '/c', toPath: '/a', enabled: true }, existing)).not.toThrow();
    expect(() => validateRedirectRule({ fromPath: '/en/final', toPath: '/a', enabled: false }, existing)).not.toThrow();
  });
});
