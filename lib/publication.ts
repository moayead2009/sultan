import type { Locale } from '@/lib/i18n';

export type TranslationLike = { locale: Locale | string; [key: string]: unknown };

const nonEmpty = (value: unknown) => typeof value === 'string' && value.trim().length > 0;

export function hasBothLocales(
  translations: TranslationLike[],
  requiredFields: string[],
): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  for (const locale of ['en', 'ar'] as const) {
    const row = translations.find((translation) => translation.locale === locale);
    for (const field of requiredFields) {
      if (!row || !nonEmpty(row[field])) missing.push(locale + '.' + field);
    }
  }
  return { ok: missing.length === 0, missing };
}

export function validatePublishable(
  entity:
    | 'page'
    | 'service'
    | 'project'
    | 'leadership'
    | 'client'
    | 'metric'
    | 'process'
    | 'capability',
  input: {
    translations: TranslationLike[];
    enabledSectionsComplete?: boolean;
    hasMedia?: boolean;
    identityConfirmed?: boolean;
    publicDisplayApproved?: boolean;
    currentnessConfirmed?: boolean;
    unresolvedPremiumEnglishLabel?: boolean;
  },
) {
  let fields: string[] = [];
  if (entity === 'page') fields = ['title'];
  if (entity === 'service') fields = ['name', 'shortDescription', 'detailedContent'];
  if (entity === 'project') fields = ['title', 'summary'];
  if (entity === 'leadership') fields = ['name', 'title', 'biographyOrMessage'];
  if (entity === 'client') fields = ['name', 'altText'];
  if (entity === 'metric') fields = ['label'];
  if (entity === 'process') fields = ['title', 'description'];
  if (entity === 'capability') fields = ['name'];

  const result = hasBothLocales(input.translations, fields);
  const missing = [...result.missing];

  if (entity === 'page' && input.enabledSectionsComplete === false) missing.push('enabledSections');
  if (entity === 'project' && input.hasMedia === false) missing.push('projectMedia');
  if (entity === 'client') {
    if (!input.identityConfirmed) missing.push('identityConfirmed');
    if (!input.publicDisplayApproved) missing.push('publicDisplayApproved');
  }
  if (entity === 'metric' && !input.currentnessConfirmed) missing.push('lastConfirmedAt');
  if (entity === 'capability' && input.unresolvedPremiumEnglishLabel) {
    missing.push('englishPremiumTierLabel');
  }

  return { ok: missing.length === 0, missing };
}
