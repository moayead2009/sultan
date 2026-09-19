import { isSafeHttpOrRelativeUrl } from '@/lib/security-url';

export const optionalText = (value: FormDataEntryValue | null) => String(value ?? '').trim() || null;
export const checkbox = (value: FormDataEntryValue | null) => value === 'on' || value === 'true';
export const integer = (value: FormDataEntryValue | null, fallback = 0) => {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed)) throw new Error('Expected a whole number.');
  return parsed;
};

export function ctaTarget(pageValue: FormDataEntryValue | null, urlValue: FormDataEntryValue | null) {
  const pageId = optionalText(pageValue);
  const url = optionalText(urlValue);
  if (pageId && url) throw new Error('CTA must use exactly one destination mechanism.');
  if (url && !isSafeHttpOrRelativeUrl(url)) throw new Error('CTA URL is not allowed.');
  return { pageId, url };
}
