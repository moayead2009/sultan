import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildPageMetadata } from '@/lib/seo';
import { getPublicEntities, getPublicPage, getSiteChrome } from '@/lib/public-site';
import { isLocale } from '@/lib/i18n';
import { PublicPage } from '@/components/public/public-page';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildPageMetadata('projects', locale);
}

export default async function Page({
  params,
  searchParams
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
    getSiteChrome(locale)
  ]);
  if (!page) notFound();

  const category = query.category?.trim();
  const filteredEntities = category
    ? { ...entities, projects: entities.projects.filter((project) => project.category?.slug === category) }
    : entities;

  return <PublicPage
    locale={locale}
    page={page}
    entities={filteredEntities}
    chrome={chrome}
    breadcrumbs={[{ label: page.translation?.title || 'projects' }]}
  />;
}
