import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await db.siteSettings.findUnique({
    where: { id: 'site' },
    include: { favicon: true, defaultOgImage: true }
  });
  return {
    title: {
      default: settings?.brandNameEnglish || 'Solutions Gate',
      template: '%s | ' + (settings?.brandNameEnglish || 'Solutions Gate')
    },
    description: settings?.brandNameEnglish || 'Solutions Gate',
    icons: settings?.favicon ? { icon: [{ url: settings.favicon.publicUrl }] } : undefined,
    openGraph: settings?.defaultOgImage ? {
      images: [{
        url: settings.defaultOgImage.publicUrl,
        width: settings.defaultOgImage.width || undefined,
        height: settings.defaultOgImage.height || undefined
      }]
    } : undefined
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const requestHeaders = await headers();
  const locale = requestHeaders.get('x-route-locale') === 'ar' ? 'ar' : 'en';
  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body>{children}</body>
    </html>
  );
}
