import type { Metadata } from 'next';
import { headers } from 'next/headers';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Solutions Gate',
    template: '%s | Solutions Gate'
  },
  description: 'Solutions Gate'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = headers().get('x-route-locale') === 'ar' ? 'ar' : 'en';
  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body>{children}</body>
    </html>
  );
}
