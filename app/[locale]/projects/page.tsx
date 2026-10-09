import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicPage } from '@/components/public/public-page';
import { isLocale } from '@/lib/i18n';
import { getPublicEntities, getPublicPage, getSiteChrome } from '@/lib/public-site';
import { buildPageMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildPageMetadata('projects', locale);
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  if (!isLocale(locale)) notFound();

  const [page, entities, chrome] = await Promise.all([
    getPublicPage('projects', locale),
    getPublicEntities(locale),
    getSiteChrome(locale),
  ]);
  if (!page) notFound();

  const activeProjectCategory = query.category?.trim() || undefined;

  return (
    <PublicPage
      locale={locale}
      page={page}
      entities={entities}
      chrome={chrome}
      activeProjectCategory={activeProjectCategory}
      breadcrumbs={[{ label: page.translation?.title || 'projects' }]}
    />
  );
}
