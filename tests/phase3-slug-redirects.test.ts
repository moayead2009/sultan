import { afterEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/lib/db';

vi.mock('@/lib/authorization', () => ({
  requireAdmin: vi.fn(async () => ({
    user: {
      id: 'phase3-owner',
      name: 'Phase 3 Owner',
      email: 'owner@example.invalid',
      role: 'OWNER',
      status: 'ACTIVE'
    }
  }))
}));
vi.mock('@/lib/admin-audit', () => ({ auditAdmin: vi.fn(async () => undefined) }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { saveProject, saveService } from '@/app/(dashboard)/admin/actions/services-projects';

const serviceSlugs = ['phase3-old-service', 'phase3-new-service'];
const projectSlugs = ['phase3-old-project', 'phase3-new-project'];

afterEach(async () => {
  await db.redirect.deleteMany({
    where: {
      fromPath: {
        in: [
          '/en/services/phase3-old-service',
          '/ar/services/phase3-old-service',
          '/en/projects/phase3-old-project',
          '/ar/projects/phase3-old-project'
        ]
      }
    }
  });
  await db.service.deleteMany({ where: { slug: { in: serviceSlugs } } });
  await db.project.deleteMany({ where: { slug: { in: projectSlugs } } });
});

describe('Phase 3 automatic slug redirects', () => {
  it('creates permanent EN and AR redirects when a service slug changes', async () => {
    const category = await db.serviceCategory.findFirstOrThrow({ where: { slug: 'event-production' } });
    const service = await db.service.create({
      data: {
        slug: 'phase3-old-service',
        categoryId: category.id,
        status: 'DRAFT',
        translations: {
          create: [
            { locale: 'en', name: 'Phase 3 Service', shortDescription: 'Temporary service', detailedContent: 'Temporary service body' },
            { locale: 'ar', name: 'خدمة المرحلة الثالثة', shortDescription: 'خدمة مؤقتة', detailedContent: 'محتوى خدمة مؤقت' }
          ]
        }
      }
    });

    const form = new FormData();
    form.set('id', service.id);
    form.set('categoryId', category.id);
    form.set('slug', 'phase3-new-service');
    form.set('sortOrder', '0');
    form.set('status', 'DRAFT');
    form.set('enName', 'Phase 3 Service');
    form.set('enShort', 'Temporary service');
    form.set('enBody', 'Temporary service body');
    form.set('arName', 'خدمة المرحلة الثالثة');
    form.set('arShort', 'خدمة مؤقتة');
    form.set('arBody', 'محتوى خدمة مؤقت');

    await saveService(form);

    const redirects = await db.redirect.findMany({
      where: { fromPath: { in: ['/en/services/phase3-old-service', '/ar/services/phase3-old-service'] } },
      orderBy: { fromPath: 'asc' }
    });
    expect(redirects).toHaveLength(2);
    expect(redirects.every((item) => item.enabled && item.permanent)).toBe(true);
    expect(redirects.map((item) => item.toPath).sort()).toEqual([
      '/ar/services/phase3-new-service',
      '/en/services/phase3-new-service'
    ]);
  });

  it('creates permanent EN and AR redirects when a project slug changes', async () => {
    const project = await db.project.create({
      data: {
        slug: 'phase3-old-project',
        status: 'DRAFT',
        translations: {
          create: [
            { locale: 'en', title: 'Phase 3 Project', summary: 'Temporary project' },
            { locale: 'ar', title: 'مشروع المرحلة الثالثة', summary: 'مشروع مؤقت' }
          ]
        }
      }
    });

    const form = new FormData();
    form.set('id', project.id);
    form.set('slug', 'phase3-new-project');
    form.set('sortOrder', '0');
    form.set('status', 'DRAFT');
    form.set('enTitle', 'Phase 3 Project');
    form.set('enSummary', 'Temporary project');
    form.set('arTitle', 'مشروع المرحلة الثالثة');
    form.set('arSummary', 'مشروع مؤقت');

    await saveProject(form);

    const redirects = await db.redirect.findMany({
      where: { fromPath: { in: ['/en/projects/phase3-old-project', '/ar/projects/phase3-old-project'] } },
      orderBy: { fromPath: 'asc' }
    });
    expect(redirects).toHaveLength(2);
    expect(redirects.every((item) => item.enabled && item.permanent)).toBe(true);
    expect(redirects.map((item) => item.toPath).sort()).toEqual([
      '/ar/projects/phase3-new-project',
      '/en/projects/phase3-new-project'
    ]);
  });
});
