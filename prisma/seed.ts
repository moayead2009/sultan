import { db } from '../lib/db';

const pages = [
  ['home', 'home'],
  ['about', 'about'],
  ['services', 'services'],
  ['projects', 'projects'],
  ['capabilities', 'capabilities'],
  ['clients', 'clients'],
  ['contact', 'contact'],
  ['privacy', 'legal'],
  ['terms', 'legal']
] as const;

const pageTitles: Record<string, { en: string; ar: string }> = {
  home: { en: 'Home', ar: 'الرئيسية' },
  about: { en: 'About', ar: 'من نحن' },
  services: { en: 'Services', ar: 'الخدمات' },
  projects: { en: 'Projects', ar: 'المشاريع' },
  capabilities: { en: 'Capabilities', ar: 'القدرات' },
  clients: { en: 'Clients', ar: 'العملاء' },
  contact: { en: 'Contact', ar: 'تواصل معنا' },
  privacy: { en: 'Privacy', ar: 'الخصوصية' },
  terms: { en: 'Terms', ar: 'الشروط' }
};

async function main() {
  await db.siteSettings.upsert({
    where: { id: 'site' },
    update: {},
    create: {
      id: 'site',
      defaultLocale: 'ar',
      websiteUrl: 'https://solutiongate.sa',
      brandNameEnglish: null,
      brandNameArabic: null,
      contactPhonePrimary: '+966555190115',
      contactPhoneSecondary: '+966501395211',
      contactFormEnabled: false
    }
  });

  for (const [slug, template] of pages) {
    const page = await db.page.upsert({
      where: { slug },
      update: { template },
      create: {
        slug,
        template,
        status: slug === 'privacy' || slug === 'terms' ? 'DRAFT' : 'DRAFT'
      }
    });
    for (const locale of ['en', 'ar'] as const) {
      const title = pageTitles[slug][locale];
      await db.pageTranslation.upsert({
        where: { pageId_locale: { pageId: page.id, locale } },
        update: { title, navigationLabel: title },
        create: { pageId: page.id, locale, title, navigationLabel: title }
      });
    }
  }

  for (const [key, enabled] of [
    ['main', true],
    ['footer', true]
  ] as const) {
    await db.navigationMenu.upsert({
      where: { key },
      update: { enabled },
      create: { key, enabled }
    });
  }

  console.log('Base seed complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => db.$disconnect());
