import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildPageMetadata } from '@/lib/seo';
import { getPublicEntities, getPublicPage, getSiteChrome } from '@/lib/public-site';
import { isLocale } from '@/lib/i18n';
import { PublicPage } from '@/components/public/public-page';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildPageMetadata('home', locale);
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [page, entities, chrome] = await Promise.all([getPublicPage('home', locale), getPublicEntities(locale), getSiteChrome(locale)]);
  if (!page) notFound();
  return <PublicPage locale={locale} page={page} entities={entities} chrome={chrome} />;
}
