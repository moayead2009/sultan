import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n';
import { LocaleDocument } from '@/components/public/locale-document';

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <><LocaleDocument locale={locale} />{children}</>;
}
