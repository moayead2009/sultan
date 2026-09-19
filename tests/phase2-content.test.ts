import { describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { getPublicEntities, getPublicPage } from '@/lib/public-site';
import { persistInquiry } from '@/lib/inquiries';
import { assertSectionAllowed, parseSectionSettings } from '@/lib/section-schemas';

describe('Phase 2 source-supported public content gates', () => {
  it('publishes the approved bilingual page set and source-backed services', async () => {
    const [home, about, entities] = await Promise.all([
      getPublicPage('home', 'en'),
      getPublicPage('about', 'ar'),
      getPublicEntities('en')
    ]);

    expect(home?.status).toBe('PUBLISHED');
    expect(home?.sections.some((section) => section.key === 'work-cycle')).toBe(true);
    expect(about?.translation?.title).toBe('من نحن');

    expect(entities.services).toHaveLength(9);
    expect(entities.services.every((service) => service.translations.some((row) => row.locale === 'en') && service.translations.some((row) => row.locale === 'ar'))).toBe(true);
    expect(new Set(entities.processSteps.map((step) => step.number))).toEqual(new Set(['01','02','03','04','05']));
  });

  it('keeps all seeded sections inside their approved typed contracts', async () => {
    const rows = await db.pageSection.findMany({ include: { page: true } });
    for (const section of rows) {
      expect(() => assertSectionAllowed(section.page.template as Parameters<typeof assertSectionAllowed>[0], section.sectionType)).not.toThrow();
      expect(() => parseSectionSettings(section.sectionType, section.settingsVersion, section.settingsJson)).not.toThrow();
    }
  });

  it('keeps unconfirmed metrics, clients and unresolved capability labels off the public surface', async () => {
    const entities = await getPublicEntities('en');

    expect(entities.metrics).toHaveLength(0);
    expect(entities.clients).toHaveLength(0);
    expect(entities.projects).toHaveLength(0);
    expect(entities.capabilityPackages.map((item) => item.key)).toEqual(['core','advanced']);
    expect(entities.capabilityPackages.some((item) => item.needsOwnerLabel)).toBe(false);

    const gatedMetricCount = await db.metric.count({ where: { enabled: false, lastConfirmedAt: null } });
    const unresolvedPackage = await db.capabilityPackage.findUnique({ where: { key: 'premium-unresolved' } });
    expect(gatedMetricCount).toBeGreaterThanOrEqual(3);
    expect(unresolvedPackage?.enabled).toBe(false);
    expect(unresolvedPackage?.needsOwnerLabel).toBe(true);
  });

  it('does not seed unsupported public contact details', async () => {
    const settings = await db.siteSettings.findUniqueOrThrow({ where: { id: 'site' } });
    expect(settings.contactFormEnabled).toBe(true);
    expect(settings.contactEmail).toBeNull();
    expect(settings.addressLine1).toBeNull();
    expect(settings.mapUrl).toBeNull();

    const contacts = await db.contactPerson.findMany({ include: { translations: true }, orderBy: { sortOrder: 'asc' } });
    expect(contacts.map((item) => item.phone)).toEqual(['+966555190115', '+966501395211']);
  });
});

describe('Phase 2 inquiry persistence', () => {
  it('sanitizes and persists an inquiry before optional notification', async () => {
    const submission = await persistInquiry({
      name: 'Test Person',
      organization: '<i>Example Org</i>',
      email: 'TEST@example.com',
      phone: '+966500000000',
      subject: '<b>Event inquiry</b>',
      message: '<b>Hello</b> from the event team',
      consent: true,
      locale: 'en',
      website: ''
    });

    try {
      const stored = await db.contactSubmission.findUniqueOrThrow({ where: { id: submission.id } });
      expect(stored.organization).toBe('Example Org');
      expect(stored.subject).toBe('Event inquiry');
      expect(stored.message).toBe('Hello from the event team');
      expect(stored.email).toBe('test@example.com');
      expect(stored.notificationStatus).toBe('NOT_CONFIGURED');
      expect(stored.consentJson).toEqual({ responseUseAccepted: true });
    } finally {
      await db.contactSubmission.delete({ where: { id: submission.id } });
    }
  });

  it('rejects a non-affirmative consent value', async () => {
    await expect(persistInquiry({
      name: 'Test Person',
      email: 'test@example.com',
      message: 'A valid inquiry message',
      consent: false,
      locale: 'en',
      website: ''
    })).rejects.toBeTruthy();
  });
});
