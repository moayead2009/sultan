import { describe, expect, it } from 'vitest';
import { isProtectedRedirectPath, validateRedirectRule } from '@/lib/redirects';

const appUrl = 'https://example.test';

describe('Phase 1 redirect validation', () => {
  it('rejects protected source and local target paths', () => {
    for (const path of ['/admin', '/admin/users', '/preview/en', '/api/auth/session', '/internal/health', '/_next/static/file.js']) {
      expect(isProtectedRedirectPath(path)).toBe(true);
      expect(() => validateRedirectRule({ fromPath: path, toPath: '/en', enabled: true }, [], appUrl)).toThrow(/protected/i);
    }
    expect(() => validateRedirectRule({ fromPath: '/old', toPath: '/api/internal', enabled: true }, [], appUrl)).toThrow(/protected/i);
    expect(() => validateRedirectRule({ fromPath: '/old', toPath: 'https://example.test/admin/users', enabled: true }, [], appUrl)).toThrow(/protected/i);
    expect(() => validateRedirectRule({ fromPath: '/old', toPath: 'https://external.test/admin/users', enabled: true }, [], appUrl)).not.toThrow();
  });

  it('rejects direct loops including query-string and same-origin absolute variants', () => {
    expect(() => validateRedirectRule({ fromPath: '/a', toPath: '/a', enabled: true }, [], appUrl)).toThrow(/loop/i);
    expect(() => validateRedirectRule({ fromPath: '/a', toPath: '/a?campaign=1', enabled: true }, [], appUrl)).toThrow(/loop/i);
    expect(() => validateRedirectRule({ fromPath: '/a', toPath: 'https://example.test/a', enabled: true }, [], appUrl)).toThrow(/loop/i);
  });

  it('rejects multi-step redirect loops including same-origin absolute steps', () => {
    const existing = [
      { id: 'one', fromPath: '/a', toPath: 'https://example.test/b', enabled: true },
      { id: 'two', fromPath: '/b', toPath: '/c', enabled: true }
    ];
    expect(() => validateRedirectRule({ fromPath: '/c', toPath: '/a', enabled: true }, existing, appUrl)).toThrow(/loop/i);
  });

  it('allows terminating chains and ignores a disabled candidate loop', () => {
    const existing = [
      { id: 'one', fromPath: '/a', toPath: '/b', enabled: true },
      { id: 'two', fromPath: '/b', toPath: '/en/final', enabled: true }
    ];
    expect(() => validateRedirectRule({ fromPath: '/c', toPath: '/a', enabled: true }, existing, appUrl)).not.toThrow();
    expect(() => validateRedirectRule({ fromPath: '/en/final', toPath: '/a', enabled: false }, existing, appUrl)).not.toThrow();
  });
});
