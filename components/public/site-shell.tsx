import Link from 'next/link';
import type { Locale } from '@/lib/i18n';
import { localized, navigationHref } from '@/lib/public-site';

export function SiteHeader({ data }: { data: Awaited<ReturnType<typeof import('@/lib/public-site').getSiteChrome>> }) {
  const { settings, main, locale } = data;
  const other = locale === 'ar' ? 'en' : 'ar';
  const brand = locale === 'ar' ? settings?.brandNameArabic || 'بوابة الحلول للفعاليات' : settings?.brandNameEnglish || 'Solutions Gate';
  const roots = main?.items.filter((item) => !item.parentId) ?? [];
  return (
    <header className="site-header">
      <div className="container-shell site-header__inner">
        <Link className="brand-lockup" href={`/${locale}`} aria-label={brand}>
          {settings?.primaryLogo ? <img src={settings.primaryLogo.publicUrl} alt="" className="brand-lockup__logo" /> : <span className="brand-mark" aria-hidden="true">SG</span>}
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
          <Link className="language-link" href={`/${other}`} lang={other}>{other === 'ar' ? 'العربية' : 'English'}</Link>
          <Link className="button header-cta" href={`/${locale}/contact`}>{locale === 'ar' ? 'ابدأ مشروعك' : 'Start a project'}</Link>
          <details className="mobile-nav">
            <summary aria-label={locale === 'ar' ? 'فتح القائمة' : 'Open menu'}>☰</summary>
            <div className="mobile-nav__panel">
              {roots.map((item) => <Link key={item.id} href={navigationHref(item, locale)}>{localized(item.translations, locale)?.label}</Link>)}
              <Link href={`/${locale}/contact`}>{locale === 'ar' ? 'تواصل معنا' : 'Contact'}</Link>
              <Link href={`/${other}`} lang={other}>{other === 'ar' ? 'العربية' : 'English'}</Link>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ data }: { data: Awaited<ReturnType<typeof import('@/lib/public-site').getSiteChrome>> }) {
  const { settings, footer, locale } = data;
  const brand = locale === 'ar' ? settings?.brandNameArabic || 'بوابة الحلول للفعاليات' : settings?.brandNameEnglish || 'Solutions Gate';
  return (
    <footer className="site-footer">
      <div className="container-shell footer-grid">
        <div>
          <div className="brand-lockup footer-brand"><span className="brand-mark" aria-hidden="true">SG</span><strong>{brand}</strong></div>
          {settings?.websiteUrl ? <p className="muted">{settings.websiteUrl.replace(/^https?:\/\//, '')}</p> : null}
        </div>
        <nav aria-label={locale === 'ar' ? 'روابط التذييل' : 'Footer links'}>
          {footer?.items.map((item) => <Link key={item.id} href={navigationHref(item, locale)}>{localized(item.translations, locale)?.label}</Link>)}
        </nav>
        <div className="footer-contact">
          {settings?.contactPhonePrimary ? <a href={`tel:${settings.contactPhonePrimary}`} dir="ltr">{settings.contactPhonePrimary}</a> : null}
          {settings?.contactPhoneSecondary ? <a href={`tel:${settings.contactPhoneSecondary}`} dir="ltr">{settings.contactPhoneSecondary}</a> : null}
          {settings?.contactEmail ? <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a> : null}
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
