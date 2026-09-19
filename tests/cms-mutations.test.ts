import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { replaceMediaUsage } from '@/lib/media-usage';
import { revokeAllUserSessions } from '@/lib/session';

const auth = vi.hoisted(() => ({
  requireAdmin: vi.fn(async () => ({
    user: {
      id: 'test-owner',
      name: 'Test Owner',
      email: 'owner@example.invalid',
      role: 'OWNER',
      status: 'ACTIVE'
    }
  }))
}));

vi.mock('@/lib/authorization', () => ({
  requireAdmin: auth.requireAdmin,
  canManageUsers: (role: string) => role === 'OWNER',
  canHardDelete: (role: string) => role === 'OWNER'
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { createNavigationItem, updateNavigationItem } from '@/app/(dashboard)/admin/actions/navigation';
import { createSection, updateSection } from '@/app/(dashboard)/admin/actions/sections';

const suffix = randomUUID().slice(0, 8);
const ids: { user?: string; page?: string; menu?: string; media?: string; section?: string; nav?: string } = {};

beforeAll(async () => {
  const user = await db.user.upsert({
    where: { email: `phase1-${suffix}@example.invalid` },
    create: {
      name: 'Phase 1 Test Owner',
      email: `phase1-${suffix}@example.invalid`,
      passwordHash: 'not-used',
      role: 'OWNER'
    },
    update: {}
  });
  ids.user = user.id;
  auth.requireAdmin.mockImplementation(async () => ({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'OWNER',
      status: 'ACTIVE'
    }
  }));

  const page = await db.page.create({
    data: {
      slug: `phase1-${suffix}`,
      template: 'home',
      translations: { create: [
        { locale: 'en', title: 'Test' },
        { locale: 'ar', title: 'اختبار' }
      ] }
    }
  });
  ids.page = page.id;
  ids.menu = (await db.navigationMenu.create({ data: { key: `phase1-${suffix}` } })).id;
  ids.media = (await db.mediaAsset.create({
    data: {
      storageKey: `tests/${suffix}.png`,
      publicUrl: `/tests/${suffix}.png`,
      originalFilename: 'test.png',
      mimeType: 'image/png',
      byteSize: 1,
      width: 1,
      height: 1,
      translations: { create: [
        { locale: 'en', altText: 'Test' },
        { locale: 'ar', altText: 'اختبار' }
      ] }
    }
  })).id;
});

afterAll(async () => {
  if (ids.page) await db.page.deleteMany({ where: { id: ids.page } });
  if (ids.menu) await db.navigationMenu.deleteMany({ where: { id: ids.menu } });
  if (ids.media) await db.mediaAsset.deleteMany({ where: { id: ids.media } });
  if (ids.user) await db.user.deleteMany({ where: { id: ids.user } });
  await db.$disconnect();
});

describe('core Phase 1 CMS mutations', () => {
  it('creates and edits bilingual navigation records', async () => {
    const create = new FormData();
    create.set('menuId', ids.menu!);
    create.set('enLabel', 'About');
    create.set('arLabel', 'من نحن');
    create.set('customUrl', '/en/about');
    create.set('sortOrder', '10');
    create.set('enabled', 'on');
    await createNavigationItem(create);

    const item = await db.navigationItem.findFirstOrThrow({
      where: { menuId: ids.menu },
      include: { translations: true }
    });
    ids.nav = item.id;
    expect(item.enabled).toBe(true);
    expect(item.translations).toHaveLength(2);

    const edit = new FormData();
    edit.set('id', item.id);
    edit.set('enLabel', 'About us');
    edit.set('arLabel', 'من نحن');
    edit.set('customUrl', '/en/company');
    edit.set('sortOrder', '20');
    edit.set('enabled', 'on');
    await updateNavigationItem(edit);

    const updated = await db.navigationItem.findUniqueOrThrow({ where: { id: item.id }, include: { translations: true } });
    expect(updated.customUrl).toBe('/en/company');
    expect(updated.sortOrder).toBe(20);
    expect(updated.translations.find((row) => row.locale === 'en')?.label).toBe('About us');
  });

  it('creates and edits a constrained section and synchronizes MediaUsage', async () => {
    const create = new FormData();
    create.set('pageId', ids.page!);
    create.set('key', `hero-${suffix}`);
    create.set('sectionType', 'hero');
    create.set('sortOrder', '1');
    create.set('enTitle', 'Hero');
    create.set('arTitle', 'الرئيسية');
    create.set('settingsJson', '{"overlay":35,"textAlign":"start","mediaPosition":"background"}');
    await createSection(create);

    const section = await db.pageSection.findFirstOrThrow({ where: { pageId: ids.page, key: `hero-${suffix}` } });
    ids.section = section.id;

    const edit = new FormData();
    edit.set('id', section.id);
    edit.set('sortOrder', '2');
    edit.set('enabled', 'on');
    edit.set('settingsJson', '{"overlay":40,"textAlign":"center","mediaPosition":"background"}');
    edit.set('enTitle', 'Hero updated');
    edit.set('arTitle', 'الرئيسية');
    edit.set('primaryMediaId', ids.media!);
    await updateSection(edit);

    const [updated, usage] = await Promise.all([
      db.pageSection.findUniqueOrThrow({ where: { id: section.id } }),
      db.mediaUsage.findFirst({ where: { ownerType: 'PageSection', ownerId: section.id, mediaAssetId: ids.media } })
    ]);
    expect(updated.primaryMediaId).toBe(ids.media);
    expect(updated.sortOrder).toBe(2);
    expect(usage?.usageRole).toBe('primaryMedia');

    await db.$transaction((tx) => replaceMediaUsage(tx, 'PageSection', section.id, [], false));
    expect(await db.mediaUsage.count({ where: { ownerType: 'PageSection', ownerId: section.id } })).toBe(0);
  });

  it('revokes persisted sessions for password/reset-style invalidation', async () => {
    const session = await db.authSession.create({
      data: { userId: ids.user!, expiresAt: new Date(Date.now() + 60_000) }
    });
    await revokeAllUserSessions(ids.user!);
    const revoked = await db.authSession.findUniqueOrThrow({ where: { id: session.id } });
    expect(revoked.revokedAt).toBeInstanceOf(Date);
  });
});
