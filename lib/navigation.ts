import { z } from 'zod';
import { hasBothLocales, type TranslationLike } from '@/lib/publication';
import { isSafeHttpOrRelativeUrl } from '@/lib/security-url';

export const navigationInputSchema = z.object({
  internalPageId: z.string().trim().min(1).nullable(),
  customUrl: z.string().trim().nullable(),
  sortOrder: z.number().int(),
  targetBlank: z.boolean(),
  enabled: z.boolean()
});

export function normalizeNavigationDestination(internalPageId?: string | null, customUrl?: string | null) {
  const pageId = internalPageId?.trim() || null;
  const url = customUrl?.trim() || null;
  if (Boolean(pageId) === Boolean(url)) {
    throw new Error('Navigation item must use exactly one destination: an internal page or a custom URL.');
  }
  if (url && !isSafeHttpOrRelativeUrl(url)) throw new Error('Custom navigation URL is not allowed.');
  return { internalPageId: pageId, customUrl: url };
}

export function validateNavigationCompleteness(
  translations: TranslationLike[],
  destination: { internalPageId: string | null; customUrl: string | null; internalPagePublished?: boolean }
) {
  const missing = [...hasBothLocales(translations, ['label']).missing];
  if (!destination.internalPageId && !destination.customUrl) missing.push('destination');
  if (destination.internalPageId && destination.internalPagePublished === false) {
    missing.push('publishedInternalDestination');
  }
  return { ok: missing.length === 0, missing };
}
