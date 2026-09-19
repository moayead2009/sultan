import Image from 'next/image';
import Link from 'next/link';
import type { Locale } from '@/lib/i18n';
import { localized, navigationHref } from '@/lib/public-site';
import type { getSiteChrome } from '@/lib/public-site';
import { LanguageSwitch } from '@/components/public/language-switch';

export function SiteHeader({ data }: { data: Awaited<ReturnType<typeof getSiteChrome>> }) {
  const { settings, main, locale } = data;
  const other = locale === 'ar' ? 'en' : 'ar';
  const brand = locale === 'ar' ? settings?.brandNameArabic || 'بوابة الحلول للفعاليات' : settings?.brandNameEnglish || 'Solutions Gate';
  const roots = main?.items.filter((item) => !item.parentId) ?? [];
  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">{locale === 'ar' ? 'تجاوز إلى المحتوى الرئيسي' : 'Skip to main content'}</a>
      <div className="container-shell site-header__inner">
        <Link className="brand-lockup" href={`/${locale}`} aria-label={brand}>
          {settings?.primaryLogo ? <Image src={settings.primaryLogo.publicUrl} alt="" width={48} height={48} sizes="48px" className="brand-lockup__logo" /> : <span className="brand-mark" aria-hidden="true">SG</span>}
          <span>{brand}</span>
        </Link>
        <nav className="desktop-nav" aria-label={locale === 'ar' ? 'التنقل الرئيسي' : 'Main navigation'}>
          {roots.map((item) => {
            const copy = localized(item.translations, locale);
            const children = item.children.filter((child) => child.enabled);
            return children.length ? (
              <details className="nav-group" key={item.id}>
                <summary>{copy?.label}</summary>
                <div className="nav-dropdown">
                  {children.map((child) => <Link key={child.id} href={navigationHref(child, locale)}>{localized(child.translations, locale)?.label}</Link>)}
                </div>
              </details>
            ) : <Link key={item.id} href={navigationHref(item, locale)} target={item.targetBlank ? '_blank' : undefined}>{copy?.label}</Link>;
          })}
        </nav>
        <div className="header-actions">
          <LanguageSwitch className="language-link" locale={locale} />
          <Link className="button header-cta" href={`/${locale}/contact`}>{locale === 'ar' ? 'ابدأ مشروعك' : 'Start a project'}</Link>
          <details className="mobile-nav">
            <summary aria-label={locale === 'ar' ? 'فتح القائمة' : 'Open menu'}>☰</summary>
            <div className="mobile-nav__panel">
              {roots.map((item) => <Link key={item.id} href={navigationHref(item, locale)}>{localized(item.translations, locale)?.label}</Link>)}
              <Link href={`/${locale}/contact`}>{locale === 'ar' ? 'تواصل معنا' : 'Contact'}</Link>
              <LanguageSwitch locale={locale} />
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ data }: { data: Awaited<ReturnType<typeof getSiteChrome>> }) {
  const { settings, footer, social, locale } = data;
  const brand = locale === 'ar' ? settings?.brandNameArabic || 'بوابة الحلول للفعاليات' : settings?.brandNameEnglish || 'Solutions Gate';
  const footerLogo = settings?.alternateLogo || settings?.primaryLogo;
  return (
    <footer className="site-footer">
      <div className="container-shell footer-grid">
        <div>
          <div className="brand-lockup footer-brand">{footerLogo ? <Image src={footerLogo.publicUrl} alt="" width={48} height={48} sizes="48px" className="brand-lockup__logo footer-logo" /> : <span className="brand-mark" aria-hidden="true">SG</span>}<strong>{brand}</strong></div>
          {settings?.websiteUrl ? <p className="muted">{settings.websiteUrl.replace(/^https?:\/\//, '')}</p> : null}
        </div>
        <nav aria-label={locale === 'ar' ? 'روابط التذييل' : 'Footer links'}>
          {footer?.items.map((item) => <Link key={item.id} href={navigationHref(item, locale)}>{localized(item.translations, locale)?.label}</Link>)}
        </nav>
        <div className="footer-contact">
          {settings?.contactPhonePrimary ? <a href={`tel:${settings.contactPhonePrimary}`} dir="ltr">{settings.contactPhonePrimary}</a> : null}
          {settings?.contactPhoneSecondary ? <a href={`tel:${settings.contactPhoneSecondary}`} dir="ltr">{settings.contactPhoneSecondary}</a> : null}
          {settings?.contactEmail ? <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a> : null}
          {settings?.addressLine1 ? <span>{[settings.addressLine1, settings.addressLine2, settings.city, settings.region, settings.country, settings.postalCode].filter(Boolean).join(', ')}</span> : null}
          {settings?.mapUrl ? <a href={settings.mapUrl} target="_blank" rel="noreferrer">{locale === 'ar' ? 'عرض الخريطة' : 'View map'}</a> : null}
          {social.length ? <div className="footer-social">{social.map((item) => <a key={item.id} href={item.url} target="_blank" rel="noreferrer">{item.platform}</a>)}</div> : null}
        </div>
      </div>
      <div className="container-shell footer-bottom"><span>{locale === 'ar' ? settings?.copyrightArabic : settings?.copyrightEnglish}</span></div>
    </footer>
  );
}

export function Breadcrumbs({ locale, items }: { locale: Locale; items: Array<{ label: string; href?: string }> }) {
  return <nav className="breadcrumbs container-shell" aria-label={locale === 'ar' ? 'مسار الصفحة' : 'Breadcrumb'}>
    <Link href={`/${locale}`}>{locale === 'ar' ? 'الرئيسية' : 'Home'}</Link>
    {items.map((item, index) => <span key={index}>{item.href ? <Link href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}</span>)}
  </nav>;
}
