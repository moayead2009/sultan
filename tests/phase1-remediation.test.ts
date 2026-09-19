import { describe, expect, it } from 'vitest';
import { canHardDelete, canManageUsers } from '@/lib/authorization';
import { resolveDefaultLocale } from '@/lib/i18n';
import { mediaDeletionBlockReason } from '@/lib/media-usage';
import { normalizeNavigationDestination, validateNavigationCompleteness } from '@/lib/navigation';
import { validatePageSections, validateSectionCompleteness } from '@/lib/publication';
import { safeAuthRedirect, safeCallbackPath } from '@/lib/security-url';
import { localizedUrls } from '@/lib/seo';
import { sessionIsActive } from '@/lib/session';

describe('Phase 1 authorization and auth safety', () => {
  it('keeps user management and hard deletion OWNER-only', () => {
    expect(canManageUsers('OWNER')).toBe(true);
    expect(canManageUsers('ADMIN')).toBe(false);
    expect(canHardDelete('OWNER')).toBe(true);
    expect(canHardDelete('ADMIN')).toBe(false);
  });

  it('rejects unsafe login callback URLs', () => {
    expect(safeCallbackPath('/admin/pages')).toBe('/admin/pages');
    expect(safeCallbackPath('javascript:alert(1)')).toBe('/admin');
    expect(safeCallbackPath('//evil.example/path')).toBe('/admin');
    expect(safeAuthRedirect('https://evil.example/x', 'https://site.example')).toBe('https://site.example/admin');
    expect(safeAuthRedirect('https://site.example/admin/users', 'https://site.example')).toBe('https://site.example/admin/users');
  });

  it('honors server-side session revocation and expiry', () => {
    const active = { revokedAt: null, expiresAt: new Date(Date.now() + 60_000), user: { status: 'ACTIVE' } };
    expect(sessionIsActive(active)).toBe(true);
    expect(sessionIsActive({ ...active, revokedAt: new Date() })).toBe(false);
    expect(sessionIsActive({ ...active, expiresAt: new Date(Date.now() - 1) })).toBe(false);
    expect(sessionIsActive({ ...active, user: { status: 'DISABLED' } })).toBe(false);
  });
});

describe('Phase 1 localization and SEO foundation', () => {
  it('keeps Arabic as deterministic fallback default locale', () => {
    expect(resolveDefaultLocale(undefined)).toBe('ar');
    expect(resolveDefaultLocale(null)).toBe('ar');
    expect(resolveDefaultLocale('en')).toBe('en');
  });

  it('produces canonical, hreflang and x-default equivalents', () => {
    const urls = localizedUrls('https://example.sa/', 'about', 'ar', 'ar');
    expect(urls.canonical).toBe('https://example.sa/ar/about');
    expect(urls.languages.en).toBe('https://example.sa/en/about');
    expect(urls.languages.ar).toBe('https://example.sa/ar/about');
    expect(urls.languages['x-default']).toBe('https://example.sa/ar/about');
  });
});

describe('Phase 1 navigation mutation validation', () => {
  it('requires exactly one safe navigation destination', () => {
    expect(normalizeNavigationDestination('page-1', null)).toEqual({ internalPageId: 'page-1', customUrl: null });
    expect(normalizeNavigationDestination(null, '/en/about')).toEqual({ internalPageId: null, customUrl: '/en/about' });
    expect(() => normalizeNavigationDestination('page-1', '/en/about')).toThrow();
    expect(() => normalizeNavigationDestination(null, 'javascript:alert(1)')).toThrow();
  });

  it('requires EN/AR labels and a publishable destination', () => {
    const result = validateNavigationCompleteness(
      [{ locale: 'en', label: 'About' }, { locale: 'ar', label: '' }],
      { internalPageId: null, customUrl: null }
    );
    expect(result.ok).toBe(false);
    expect(result.missing).toContain('ar.label');
    expect(result.missing).toContain('destination');
  });
});

describe('Phase 1 section publication validation', () => {
  it('checks actual required fields, not only translation row existence', () => {
    const gate = validateSectionCompleteness({
      sectionType: 'intro',
      translations: [
        { locale: 'en', title: 'Who we are', body: 'English body' },
        { locale: 'ar', title: 'من نحن', body: '' }
      ]
    });
    expect(gate.ok).toBe(false);
    expect(gate.missing).toContain('ar.body');
  });

  it('reports the exact enabled section key that blocks publication', () => {
    const gate = validatePageSections([
      {
        key: 'intro-main',
        enabled: true,
        sectionType: 'intro',
        translations: [
          { locale: 'en', title: 'Intro', body: 'Body' },
          { locale: 'ar', title: 'مقدمة', body: '' }
        ]
      },
      {
        key: 'disabled-broken',
        enabled: false,
        sectionType: 'intro',
        translations: []
      }
    ]);
    expect(gate.ok).toBe(false);
    expect(gate.missing).toContain('section.intro-main.ar.body');
    expect(gate.missing.some((value) => value.includes('disabled-broken'))).toBe(false);
  });
});

describe('Phase 1 media deletion protection', () => {
  it('protects published and otherwise referenced media', () => {
    expect(mediaDeletionBlockReason({ publishedUsageCount: 1, usageCount: 1, directReferenceCount: 0 })).toBe('published');
    expect(mediaDeletionBlockReason({ publishedUsageCount: 0, usageCount: 1, directReferenceCount: 0 })).toBe('referenced');
    expect(mediaDeletionBlockReason({ publishedUsageCount: 0, usageCount: 0, directReferenceCount: 1 })).toBe('referenced');
    expect(mediaDeletionBlockReason({ publishedUsageCount: 0, usageCount: 0, directReferenceCount: 0 })).toBeNull();
  });
});
