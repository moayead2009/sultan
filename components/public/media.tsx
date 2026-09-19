import Image from 'next/image';
import type { Locale } from '@/lib/i18n';
import { localized } from '@/lib/public-site';

export function PublicImage({
  asset,
  locale,
  className = '',
  sizes = '(max-width: 760px) 100vw, (max-width: 1180px) 90vw, 1180px',
  eager = false
}: {
  asset: { publicUrl: string; width: number | null; height: number | null; translations: Array<{ locale: string; altText: string | null; caption?: string | null }> };
  locale: Locale;
  className?: string;
  sizes?: string;
  eager?: boolean;
}) {
  const copy = localized(asset.translations, locale);
  const width = asset.width && asset.width > 0 ? asset.width : 1200;
  const height = asset.height && asset.height > 0 ? asset.height : 800;

  return <Image
    className={className}
    src={asset.publicUrl}
    width={width}
    height={height}
    sizes={sizes}
    alt={copy?.altText ?? ''}
    loading={eager ? 'eager' : 'lazy'}
    fetchPriority={eager ? 'high' : undefined}
  />;
}
