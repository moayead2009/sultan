import { redirect } from 'next/navigation';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function RootPage() {
  let locale: 'en' | 'ar' = 'ar';
  try {
    const settings = await db.siteSettings.findUnique({
      where: { id: 'site' },
      select: { defaultLocale: true }
    });
    if (settings?.defaultLocale === 'en') locale = 'en';
  } catch {
    // The deterministic planning default is Arabic before the database is initialized.
  }
  redirect('/' + locale);
}
