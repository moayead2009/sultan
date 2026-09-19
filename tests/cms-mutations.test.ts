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
import { deleteUser, setUserRole, setUserStatus } from '@/app/(dashboard)/admin/actions/users';

const suffix = randomUUID().slice(0, 8);
const ids: { user?: string; secondOwner?: string; page?: string; menu?: string; media?: string; section?: string; nav?: string } = {};

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
  if (ids.secondOwner) await db.user.deleteMany({ where: { id: ids.secondOwner } });
  if (ids.page) await db.page.deleteMany({ where: { id: ids.page } });
  if (ids.menu) await db.navigationMenu.deleteMany({ where: { id: ids.menu } });
  if (ids.media) await db.mediaAsset.deleteMany({ where: { id: ids.media } });
  if (ids.user) await db.user.deleteMany({ where: { id: ids.user } });
  await db.$disconnect();
});

describe('core Phase 1 CMS mutations', () => {
  it('keeps role changes OWNER-only and prevents demoting the last active OWNER', async () => {
    auth.requireAdmin.mockClear();

    const demoteLast = new FormData();
    demoteLast.set('id', ids.user!);
    demoteLast.set('role', 'ADMIN');
    await expect(setUserRole(demoteLast)).rejects.toThrow(/last active OWNER/i);
    expect(auth.requireAdmin).toHaveBeenCalledWith(['OWNER']);

    const second = await db.user.create({
      data: {
        name: 'Second Owner',
        email: `phase1-second-${suffix}@example.invalid`,
        passwordHash: 'not-used',
        role: 'OWNER',
        status: 'ACTIVE'
      }
    });
    ids.secondOwner = second.id;

    await setUserRole(demoteLast);
    expect((await db.user.findUniqueOrThrow({ where: { id: ids.user } })).role).toBe('ADMIN');

    const promoteAgain = new FormData();
    promoteAgain.set('id', ids.user!);
    promoteAgain.set('role', 'OWNER');
    await setUserRole(promoteAgain);
    expect((await db.user.findUniqueOrThrow({ where: { id: ids.user } })).role).toBe('OWNER');

    await db.user.delete({ where: { id: second.id } });
    ids.secondOwner = undefined;
  });

  it('prevents disabling or deleting the last active OWNER', async () => {
    auth.requireAdmin.mockImplementation(async () => ({
      user: {
        id: 'acting-owner',
        name: 'Acting Owner',
        email: 'acting-owner@example.invalid',
        role: 'OWNER',
        status: 'ACTIVE'
      }
    }));

    const disable = new FormData();
    disable.set('id', ids.user!);
    disable.set('status', 'DISABLED');
    await expect(setUserStatus(disable)).rejects.toThrow(/last active OWNER/i);

    const remove = new FormData();
    remove.set('id', ids.user!);
    await expect(deleteUser(remove)).rejects.toThrow(/last active OWNER/i);

    const user = await db.user.findUniqueOrThrow({ where: { id: ids.user } });
    auth.requireAdmin.mockImplementation(async () => ({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'OWNER',
        status: 'ACTIVE'
      }
    }));
  });

  it('materializes all Phase 1 schema indexes through migrations', async () => {
    const expected = [
      'User_status_email_idx',
      'PageSectionMedia_mediaId_idx',
      'ServiceFeature_serviceId_sortOrder_idx',
      'ProjectMedia_mediaId_idx',
      'MediaAsset_kind_createdAt_idx',
      'AuditLog_actorUserId_createdAt_idx'
    ];
    const rows = await db.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname IN (
          'User_status_email_idx',
          'PageSectionMedia_mediaId_idx',
          'ServiceFeature_serviceId_sortOrder_idx',
          'ProjectMedia_mediaId_idx',
          'MediaAsset_kind_createdAt_idx',
          'AuditLog_actorUserId_createdAt_idx'
        )
    `;
    expect(new Set(rows.map((row) => row.indexname))).toEqual(new Set(expected));
  });

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
