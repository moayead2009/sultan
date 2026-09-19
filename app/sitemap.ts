import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { env } from '@/lib/env';

function baseUrl(value: string) {
  return value.replace(/\/+$/, '');
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [settings, pages, services, projects] = await Promise.all([
    db.siteSettings.findUnique({ where: { id: 'site' }, select: { websiteUrl: true } }),
    db.page.findMany({ where: { status: 'PUBLISHED' }, select: { slug: true, updatedAt: true } }),
    db.service.findMany({ where: { status: 'PUBLISHED', category: { enabled: true } }, select: { slug: true, updatedAt: true } }),
    db.project.findMany({ where: { status: 'PUBLISHED' }, select: { slug: true, updatedAt: true } })
  ]);
  const base = baseUrl(settings?.websiteUrl || env.APP_URL);
  const locales = ['en', 'ar'] as const;

  const entries: MetadataRoute.Sitemap = [];
  for (const page of pages) {
    const path = page.slug === 'home' ? '' : '/' + page.slug;
    for (const locale of locales) {
      entries.push({
        url: base + '/' + locale + path,
        lastModified: page.updatedAt,
        alternates: {
          languages: {
            en: base + '/en' + path,
            ar: base + '/ar' + path
          }
        }
      });
    }
  }

  for (const service of services) {
    const path = '/services/' + service.slug;
    for (const locale of locales) {
      entries.push({
        url: base + '/' + locale + path,
        lastModified: service.updatedAt,
        alternates: {
          languages: {
            en: base + '/en' + path,
            ar: base + '/ar' + path
          }
        }
      });
    }
  }

  for (const project of projects) {
    const path = '/projects/' + project.slug;
    for (const locale of locales) {
      entries.push({
        url: base + '/' + locale + path,
        lastModified: project.updatedAt,
        alternates: {
          languages: {
            en: base + '/en' + path,
            ar: base + '/ar' + path
          }
        }
      });
    }
  }
  return entries;
}
