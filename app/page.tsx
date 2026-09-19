import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { resolveDefaultLocale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function RootPage() {
  let configuredLocale: string | null | undefined;
  try {
    const settings = await db.siteSettings.findUnique({
      where: { id: 'site' },
      select: { defaultLocale: true }
    });
    configuredLocale = settings?.defaultLocale;
  } catch {
    // The deterministic planning default is Arabic before the database is initialized.
  }
  redirect('/' + resolveDefaultLocale(configuredLocale));
}
