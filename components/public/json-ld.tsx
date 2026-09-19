type JsonLdValue = Record<string, unknown> | Array<Record<string, unknown>>;

function serialize(value: JsonLdValue) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function JsonLd({ data }: { data: JsonLdValue }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialize(data) }} />;
}

function absolute(baseUrl: string, value?: string | null) {
  if (!value) return undefined;
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return undefined;
  }
}

export function siteStructuredData(input: {
  baseUrl: string;
  brandEnglish?: string | null;
  brandArabic?: string | null;
  logoUrl?: string | null;
}) {
  const baseUrl = input.baseUrl.replace(/\/+$/, '');
  const name = input.brandEnglish || 'Solutions Gate';
  const organization = {
    '@type': 'Organization',
    '@id': baseUrl + '/#organization',
    name,
    alternateName: input.brandArabic || undefined,
    url: baseUrl,
    logo: absolute(baseUrl, input.logoUrl)
  };
  const website = {
    '@type': 'WebSite',
    '@id': baseUrl + '/#website',
    url: baseUrl,
    name,
    alternateName: input.brandArabic || undefined,
    inLanguage: ['en', 'ar'],
    publisher: { '@id': baseUrl + '/#organization' }
  };
  return {
    '@context': 'https://schema.org',
    '@graph': [organization, website]
  };
}

export function breadcrumbStructuredData(baseUrl: string, locale: 'en' | 'ar', items: Array<{ label: string; href?: string }>) {
  const base = baseUrl.replace(/\/+$/, '');
  const entries = [
    { label: locale === 'ar' ? 'الرئيسية' : 'Home', href: '/' + locale },
    ...items
  ];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: entries.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.href ? new URL(item.href, base).toString() : undefined
    }))
  };
}

export function serviceStructuredData(input: {
  baseUrl: string;
  locale: 'en' | 'ar';
  slug: string;
  name: string;
  description?: string | null;
  providerName: string;
  providerArabic?: string | null;
  imageUrl?: string | null;
}) {
  const base = input.baseUrl.replace(/\/+$/, '');
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: input.name,
    description: input.description || undefined,
    url: base + '/' + input.locale + '/services/' + input.slug,
    image: absolute(base, input.imageUrl),
    provider: {
      '@type': 'Organization',
      '@id': base + '/#organization',
      name: input.providerName,
      alternateName: input.providerArabic || undefined,
      url: base
    }
  };
}
