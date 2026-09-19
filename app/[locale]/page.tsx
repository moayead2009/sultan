import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buildPageMetadata } from '@/lib/seo';
import { isLocale, targetLocale } from '@/lib/i18n';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return buildPageMetadata('home', locale);
}

export default async function LocaleFoundationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <main className="public-placeholder">
      <section className="public-placeholder__card">
        <div className="badge">{locale === 'ar' ? 'بوابة الحلول' : 'Solutions Gate'}</div>
        <h1>{locale === 'ar' ? 'الموقع قيد التجهيز' : 'Website foundation ready'}</h1>
        <p>
          {locale === 'ar'
            ? 'تم تجهيز البنية ثنائية اللغة ونظام إدارة المحتوى. المحتوى العام سيُنشر فقط بعد اجتياز بوابات النشر المعتمدة.'
            : 'The bilingual foundation and CMS are ready. Public content is exposed only after the approved publication gates pass.'}
        </p>
        <Link className="button" href={'/' + targetLocale(locale)}>
          {locale === 'ar' ? 'English' : 'العربية'}
        </Link>
      </section>
    </main>
  );
}
