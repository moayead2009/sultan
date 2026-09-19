import { describe, expect, it } from 'vitest';
import { hasBothLocales, validatePublishable } from '@/lib/publication';

describe('publication gates', () => {
  it('requires separately authored English and Arabic fields', () => {
    const result = hasBothLocales(
      [
        { locale: 'en', title: 'Home' },
        { locale: 'ar', title: '' }
      ],
      ['title']
    );
    expect(result.ok).toBe(false);
    expect(result.missing).toContain('ar.title');
  });

  it('does not permit client publication without both identity gates', () => {
    const result = validatePublishable('client', {
      translations: [
        { locale: 'en', name: 'Example', altText: 'Example logo' },
        { locale: 'ar', name: 'مثال', altText: 'شعار مثال' }
      ],
      identityConfirmed: true,
      publicDisplayApproved: false
    });
    expect(result.ok).toBe(false);
    expect(result.missing).toContain('publicDisplayApproved');
  });

  it('blocks stale source metrics', () => {
    const result = validatePublishable('metric', {
      translations: [
        { locale: 'en', label: 'Events' },
        { locale: 'ar', label: 'الفعاليات' }
      ],
      currentnessConfirmed: false
    });
    expect(result.ok).toBe(false);
  });

  it('blocks the unresolved English premium capability label', () => {
    const result = validatePublishable('capability', {
      translations: [
        { locale: 'en', name: 'Unconfirmed' },
        { locale: 'ar', name: 'الحلول الملكية والاستثنائية' }
      ],
      unresolvedPremiumEnglishLabel: true
    });
    expect(result.ok).toBe(false);
    expect(result.missing).toContain('englishPremiumTierLabel');
  });
});
