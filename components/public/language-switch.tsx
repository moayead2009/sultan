'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Locale } from '@/lib/i18n';

export function LanguageSwitch({ locale, className }: { locale: Locale; className?: string }) {
  const pathname = usePathname();
  const target: Locale = locale === 'ar' ? 'en' : 'ar';
  const pieces = pathname.split('/');
  if (pieces[1] === 'en' || pieces[1] === 'ar') pieces[1] = target;
  else pieces.splice(1, 0, target);
  const href = pieces.join('/') || '/' + target;
  return <Link className={className} href={href} lang={target} hrefLang={target}>{target === 'ar' ? 'العربية' : 'English'}</Link>;
}
