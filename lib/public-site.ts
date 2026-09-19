import { db } from '@/lib/db';
import type { Locale } from '@/lib/i18n';

export function localized<T extends { locale: string }>(rows: T[], locale: Locale) {
  return rows.find((row) => row.locale === locale) ?? rows.find((row) => row.locale === 'en') ?? rows[0];
}

export async function getSiteChrome(locale: Locale) {
  const [settings, main, footer, social] = await Promise.all([
    db.siteSettings.findUnique({ where: { id: 'site' }, include: { primaryLogo: true, alternateLogo: true } }),
    db.navigationMenu.findUnique({
      where: { key: 'main' },
      include: {
        items: {
          where: { enabled: true },
          orderBy: { sortOrder: 'asc' },
          include: { translations: true, internalPage: true, children: { include: { translations: true, internalPage: true }, orderBy: { sortOrder: 'asc' } } }
        }
      }
    }),
    db.navigationMenu.findUnique({
      where: { key: 'footer' },
      include: { items: { where: { enabled: true }, orderBy: { sortOrder: 'asc' }, include: { translations: true, internalPage: true } } }
    }),
    db.socialLink.findMany({ where: { enabled: true }, orderBy: { sortOrder: 'asc' } })
  ]);
  return { settings, main, footer, social, locale };
}

export function navigationHref(
  item: { customUrl: string | null; internalPage?: { slug: string } | null },
  locale: Locale
) {
  if (item.internalPage) return item.internalPage.slug === 'home' ? `/${locale}` : `/${locale}/${item.internalPage.slug}`;
  return item.customUrl || '#';
}

export async function getPublicPage(slug: string, locale: Locale, includeDraft = false) {
  const page = await db.page.findUnique({
    where: { slug },
    include: {
      translations: true,
      sections: {
        where: includeDraft ? {} : { enabled: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          translations: true,
          primaryMedia: { include: { translations: true } },
          secondaryMedia: { include: { translations: true } },
          media: { orderBy: { sortOrder: 'asc' }, include: { media: { include: { translations: true } } } },
          primaryCtaPage: true,
          secondaryCtaPage: true
        }
      }
    }
  });
  if (!page || (!includeDraft && page.status !== 'PUBLISHED')) return null;
  return { ...page, translation: localized(page.translations, locale) };
}

export async function getPublicEntities(locale: Locale) {
  const [services, projects, projectCategories, clients, metrics, processSteps, leadership, capabilityPackages, capabilityFeatures, contacts] =
    await Promise.all([
      db.service.findMany({
        where: { status: 'PUBLISHED', category: { enabled: true } },
        orderBy: { sortOrder: 'asc' },
        include: {
          translations: true,
          category: { include: { translations: true } },
          features: { where: { enabled: true }, orderBy: { sortOrder: 'asc' }, include: { translations: true } },
          coverMedia: { include: { translations: true } },
          iconMedia: { include: { translations: true } },
          media: { orderBy: { sortOrder: 'asc' }, include: { media: { include: { translations: true } } } }
        }
      }),
      db.project.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { sortOrder: 'asc' },
        include: {
          translations: true,
          category: { include: { translations: true } },
          coverMedia: { include: { translations: true } },
          media: { orderBy: { sortOrder: 'asc' }, include: { media: { include: { translations: true } } } },
          services: { include: { service: { include: { translations: true } } } }
        }
      }),
      db.projectCategory.findMany({
        where: { enabled: true },
        orderBy: { sortOrder: 'asc' },
        include: { translations: true }
      }),
      db.client.findMany({
        where: { enabled: true, identityConfirmed: true, publicDisplayApproved: true },
        orderBy: { sortOrder: 'asc' },
        include: { translations: true, logo: { include: { translations: true } } }
      }),
      db.metric.findMany({
        where: { enabled: true, lastConfirmedAt: { not: null } },
        orderBy: { sortOrder: 'asc' },
        include: { translations: true, iconMedia: { include: { translations: true } } }
      }),
      db.processStep.findMany({
        where: { enabled: true },
        orderBy: { sortOrder: 'asc' },
        include: { translations: true, iconMedia: true, imageMedia: true }
      }),
      db.leadershipMember.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { sortOrder: 'asc' },
        include: { translations: true, image: { include: { translations: true } } }
      }),
      db.capabilityPackage.findMany({
        where: { enabled: true, needsOwnerLabel: false },
        orderBy: { sortOrder: 'asc' },
        include: { translations: true }
      }),
      db.capabilityFeature.findMany({
        where: { enabled: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          translations: true,
          values: {
            where: { enabled: true, capabilityPackage: { enabled: true, needsOwnerLabel: false } },
            include: { translations: true, capabilityPackage: true }
          }
        }
      }),
      db.contactPerson.findMany({
        where: { enabled: true },
        orderBy: { sortOrder: 'asc' },
        include: { translations: true, image: { include: { translations: true } } }
      })
    ]);

  return {
    locale,
    services: services.map((item) => ({
      ...item,
      translation: localized(item.translations, locale),
      categoryTranslation: localized(item.category.translations, locale),
      localizedFeatures: item.features.map((feature) => ({ ...feature, translation: localized(feature.translations, locale) }))
    })),
    projects: projects.map((item) => ({ ...item, translation: localized(item.translations, locale) })),
    projectCategories: projectCategories.map((item) => ({ ...item, translation: localized(item.translations, locale) })),
    clients: clients.map((item) => ({ ...item, translation: localized(item.translations, locale) })),
    metrics: metrics.map((item) => ({ ...item, translation: localized(item.translations, locale) })),
    processSteps: processSteps.map((item) => ({ ...item, translation: localized(item.translations, locale) })),
    leadership: leadership.map((item) => ({ ...item, translation: localized(item.translations, locale) })),
    capabilityPackages: capabilityPackages.map((item) => ({ ...item, translation: localized(item.translations, locale) })),
    capabilityFeatures: capabilityFeatures.map((item) => ({
      ...item,
      translation: localized(item.translations, locale),
      values: item.values.map((value) => ({ ...value, translation: localized(value.translations, locale) }))
    })),
    contacts: contacts.map((item) => ({ ...item, translation: localized(item.translations, locale) }))
  };
}

export async function getService(slug: string, locale: Locale) {
  const item = await db.service.findFirst({
    where: { slug, status: 'PUBLISHED', category: { enabled: true } },
    include: {
      translations: true,
      category: { include: { translations: true } },
      parentService: { include: { translations: true } },
      childServices: { where: { status: 'PUBLISHED' }, orderBy: { sortOrder: 'asc' }, include: { translations: true } },
      features: { where: { enabled: true }, orderBy: { sortOrder: 'asc' }, include: { translations: true } },
      coverMedia: { include: { translations: true } },
      media: { orderBy: { sortOrder: 'asc' }, include: { media: { include: { translations: true } } } },
      projects: { include: { project: { include: { translations: true, coverMedia: true } } }, orderBy: { sortOrder: 'asc' } },
      relatedFrom: { include: { targetService: { include: { translations: true } } }, orderBy: { sortOrder: 'asc' } }
    }
  });
  if (!item) return null;
  return {
    ...item,
    translation: localized(item.translations, locale),
    categoryTranslation: localized(item.category.translations, locale),
    localizedFeatures: item.features.map((feature) => ({ ...feature, translation: localized(feature.translations, locale) })),
    localizedChildren: item.childServices.map((service) => ({ ...service, translation: localized(service.translations, locale) })),
    localizedRelated: item.relatedFrom
      .filter((relation) => relation.targetService.status === 'PUBLISHED')
      .map((relation) => ({ ...relation.targetService, translation: localized(relation.targetService.translations, locale) })),
    localizedProjects: item.projects
      .filter((relation) => relation.project.status === 'PUBLISHED')
      .map((relation) => ({ ...relation.project, translation: localized(relation.project.translations, locale) }))
  };
}

export async function getProject(slug: string, locale: Locale) {
  const item = await db.project.findFirst({
    where: { slug, status: 'PUBLISHED' },
    include: {
      translations: true,
      category: { include: { translations: true } },
      client: { include: { translations: true } },
      coverMedia: { include: { translations: true } },
      videoMedia: true,
      media: { orderBy: { sortOrder: 'asc' }, include: { media: { include: { translations: true } } } },
      services: { orderBy: { sortOrder: 'asc' }, include: { service: { include: { translations: true } } } }
    }
  });
  if (!item) return null;
  const clientAllowed = item.client?.enabled && item.client.identityConfirmed && item.client.publicDisplayApproved;
  return {
    ...item,
    translation: localized(item.translations, locale),
    categoryTranslation: item.category ? localized(item.category.translations, locale) : null,
    clientTranslation: clientAllowed && item.client ? localized(item.client.translations, locale) : null,
    localizedServices: item.services
      .filter((row) => row.service.status === 'PUBLISHED')
      .map((row) => ({ ...row.service, translation: localized(row.service.translations, locale) }))
  };
}
