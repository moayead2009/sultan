import type { Locale } from '@/lib/i18n';
import { localized } from '@/lib/public-site';

export function PublicImage({
  asset,
  locale,
  className = ''
}: {
  asset: { publicUrl: string; width: number | null; height: number | null; translations: Array<{ locale: string; altText: string | null; caption?: string | null }> };
  locale: Locale;
  className?: string;
}) {
  const copy = localized(asset.translations, locale);
  return <img
    className={className}
    src={asset.publicUrl}
    width={asset.width ?? undefined}
    height={asset.height ?? undefined}
    alt={copy?.altText ?? ''}
    loading="lazy"
    decoding="async"
  />;
}
