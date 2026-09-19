import type { Locale } from '@/lib/i18n';

export type TranslationLike = { locale: Locale | string; [key: string]: unknown };

const nonEmpty = (value: unknown) => typeof value === 'string' && value.trim().length > 0;

export function hasBothLocales(
  translations: TranslationLike[],
  requiredFields: string[]
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

function requireSymmetricOptionalFields(translations: TranslationLike[], fields: string[]) {
  const missing: string[] = [];
  for (const field of fields) {
    const en = translations.find((translation) => translation.locale === 'en');
    const ar = translations.find((translation) => translation.locale === 'ar');
    const used = nonEmpty(en?.[field]) || nonEmpty(ar?.[field]);
    if (!used) continue;
    if (!nonEmpty(en?.[field])) missing.push(`en.${field}`);
    if (!nonEmpty(ar?.[field])) missing.push(`ar.${field}`);
  }
  return missing;
}

export function validateSectionCompleteness(section: {
  sectionType: string;
  translations: TranslationLike[];
  primaryCtaPageId?: string | null;
  primaryCtaUrl?: string | null;
  secondaryCtaPageId?: string | null;
  secondaryCtaUrl?: string | null;
}) {
  const alwaysRequired: Record<string, string[]> = {
    hero: ['title'],
    intro: ['title', 'body'],
    metrics: [],
    featuredServices: ['title'],
    workCycle: ['title'],
    featuredProjects: ['title'],
    technologyFeature: ['title', 'body'],
    clients: [],
    cta: ['title'],
    richText: ['body'],
    gallery: [],
    leadership: ['title'],
    capabilityComparison: ['title'],
    serviceIndex: ['title'],
    projectIndex: ['title'],
    contactDetails: ['title'],
    contactForm: ['title']
  };
  const fields = alwaysRequired[section.sectionType];
  if (!fields) return { ok: false, missing: ['sectionType'] };

  const missing = [...hasBothLocales(section.translations, fields).missing];
  missing.push(
    ...requireSymmetricOptionalFields(section.translations, [
      'subtitle',
      'accessibleLabel'
    ])
  );

  if (section.sectionType === 'metrics' || section.sectionType === 'clients' || section.sectionType === 'gallery') {
    missing.push(...requireSymmetricOptionalFields(section.translations, ['title', 'body']));
  } else if (
    ['featuredServices', 'workCycle', 'featuredProjects', 'leadership', 'capabilityComparison', 'serviceIndex', 'projectIndex', 'contactDetails', 'contactForm'].includes(section.sectionType)
  ) {
    missing.push(...requireSymmetricOptionalFields(section.translations, ['body']));
  }

  const hasPrimaryCta = Boolean(section.primaryCtaPageId || section.primaryCtaUrl);
  const hasSecondaryCta = Boolean(section.secondaryCtaPageId || secondaryCtaUrl);
  if (hasPrimaryCta) missing.push(...hasBothLocales(section.translations, ['primaryCtaLabel']).missing);
  if (hasSecondaryCta) missing.push(...hasBothLocales(section.translations, ['secondaryCtaLabel']).missing);

  return { ok: missing.length === 0, missing: [...new Set(missing)] };
}

export function validatePageSections(sections: Array<Parameters<typeof validateSectionCompleteness>[0] & { enabled: boolean; key: string }>) {
  const missing: string[] = [];
  for (const section of sections.filter((item) => item.enabled)) {
    const result = validateSectionCompleteness(section);
    for (const field of result.missing) missing.push(`section.${section.key}.${field}`);
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
    sectionMissing?: string[];
    seoComplete?: boolean;
    hasMedia?: boolean;
    identityConfirmed?: boolean;
    publicDisplayApproved?: boolean;
    currentnessConfirmed?: boolean;
    unresolvedPremiumEnglishLabel?: boolean;
  }
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

  if (entity === 'page') {
    if (input.enabledSectionsComplete === false) missing.push(...(input.sectionMissing?.length ? input.sectionMissing : ['enabledSections']));
    if (input.seoComplete === false) missing.push('localizedSeo');
  }
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
