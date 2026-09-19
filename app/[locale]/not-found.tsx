import Link from 'next/link';
import { headers } from 'next/headers';

export default async function NotFound() {
  const requestHeaders = await headers();
  const locale = requestHeaders.get('x-route-locale') === 'ar' ? 'ar' : 'en';
  return <main className="public-placeholder"><section className="public-placeholder__card">
    <p className="badge">404</p>
    <h1>{locale === 'ar' ? 'الصفحة غير موجودة' : 'Page not found'}</h1>
    <p>{locale === 'ar' ? 'الصفحة المطلوبة غير موجودة أو لم يتم نشرها.' : 'The requested page does not exist or is not published.'}</p>
    <div className="cta-row"><Link className="button" href={'/' + locale}>{locale === 'ar' ? 'العودة للرئيسية' : 'Return home'}</Link></div>
  </section></main>;
}
