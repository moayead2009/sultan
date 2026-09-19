'use client';

import { usePathname } from 'next/navigation';

export default function LocaleError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const pathname = usePathname();
  const isArabic = pathname === '/ar' || pathname.startsWith('/ar/');
  return <main className="public-placeholder">
    <section className="public-placeholder__card" role="alert">
      <p className="badge">{isArabic ? 'خطأ' : 'Error'}</p>
      <h1>{isArabic ? 'حدث خطأ ما' : 'Something went wrong'}</h1>
      <p>{isArabic ? 'يرجى المحاولة مرة أخرى. لا يتم عرض التفاصيل التقنية للعامة.' : 'Please retry. Technical details are not exposed publicly.'}</p>
      <button className="button" onClick={() => reset()}>{isArabic ? 'حاول مرة أخرى' : 'Try again'}</button>
    </section>
  </main>;
}
