export const locales = ['en', 'ar'] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function direction(locale: Locale) {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export function targetLocale(locale: Locale): Locale {
  return locale === 'ar' ? 'en' : 'ar';
}

export function switchLocalePath(pathname: string, locale: Locale) {
  const target = targetLocale(locale);
  const pieces = pathname.split('/').filter(Boolean);
  if (pieces.length && isLocale(pieces[0])) pieces[0] = target;
  else pieces.unshift(target);
  return '/' + pieces.join('/');
}
