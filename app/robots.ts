import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { env } from '@/lib/env';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await db.siteSettings.findUnique({ where: { id: 'site' }, select: { websiteUrl: true } });
  const base = (settings?.websiteUrl || env.APP_URL).replace(/\/+$/, '');
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/preview', '/api']
    },
    sitemap: base + '/sitemap.xml'
  };
}
