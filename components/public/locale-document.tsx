'use client';

import { useEffect } from 'react';
import type { Locale } from '@/lib/i18n';

export function LocaleDocument({ locale }: { locale: Locale }) {
  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);
  return null;
}
