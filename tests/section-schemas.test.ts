import { describe, expect, it } from 'vitest';
import { assertSectionAllowed, parseSectionSettings } from '@/lib/section-schemas';

describe('section contracts', () => {
  it('accepts bounded versioned settings', () => {
    expect(parseSectionSettings('hero', 1, { overlay: 45, textAlign: 'start' })).toMatchObject({
      overlay: 45,
      textAlign: 'start'
    });
  });

  it('rejects unknown keys', () => {
    expect(() => parseSectionSettings('hero', 1, { arbitraryIds: ['x'] })).toThrow();
  });

  it('rejects unknown schema versions', () => {
    expect(() => parseSectionSettings('hero', 2, {})).toThrow();
  });

  it('rejects section types outside the page template contract', () => {
    expect(() => assertSectionAllowed('contact', 'metrics')).toThrow();
  });
});
