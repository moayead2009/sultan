import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn()
}));

vi.mock('@/lib/db', () => ({
  db: {
    redirect: {
      findUnique: mocks.findUnique
    }
  }
}));

import { proxy } from '@/proxy';

describe('database redirects in request proxy', () => {
  beforeEach(() => mocks.findUnique.mockReset());

  it('applies an enabled permanent CMS redirect', async () => {
    mocks.findUnique.mockResolvedValue({
      fromPath: '/old',
      toPath: '/en/new',
      permanent: true,
      enabled: true
    });
    const response = await proxy(new NextRequest('https://example.test/old'));
    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe('https://example.test/en/new');
  });

  it('ignores disabled redirects and preserves locale routing', async () => {
    mocks.findUnique.mockResolvedValue({
      fromPath: '/en/about',
      toPath: '/en/new',
      permanent: true,
      enabled: false
    });
    const response = await proxy(new NextRequest('https://example.test/en/about'));
    expect(response.status).toBe(200);
    expect(response.headers.get('x-middleware-request-x-route-locale')).toBe('en');
  });

  it('does not consult redirects for protected routes', async () => {
    for (const path of ['/admin/users', '/preview/en/about', '/api/internal', '/internal/health']) {
      mocks.findUnique.mockClear();
      const response = await proxy(new NextRequest('https://example.test' + path));
      expect(mocks.findUnique).not.toHaveBeenCalled();
      expect(response.status).toBe(200);
    }
  });
});
