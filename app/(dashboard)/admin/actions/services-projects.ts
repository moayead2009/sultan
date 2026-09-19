'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/authorization';
import { auditAdmin } from '@/lib/admin-audit';
import { checkbox, integer, optionalText } from '@/lib/admin-input';
import { replaceMediaUsage, setOwnerUsagePublication, type MediaUsageInput } from '@/lib/media-usage';
import { validatePublishable } from '@/lib/publication';
import { validateRedirectRule } from '@/lib/redirects';
import { env } from '@/lib/env';

const id = z.string().trim().min(1);
const slug = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

function requiredText(formData: FormData, key: string, max = 500) {
  return z.string().trim().min(1).max(max).parse(formData.get(key));
}

function list(formData: FormData, key: string) {
  return formData.getAll(key).flatMap((value) => String(value).split(',')).map((item) => item.trim()).filter(Boolean);
}

function optionalInt(formData: FormData, key: string) {
  const value = optionalText(formData.get(key));
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) throw new Error(key + ' must be a whole number.');
  return parsed;
}

export async function saveServiceCategory(formData: FormData) {
  await requireAdmin();
  const rowId = optionalText(formData.get('id'));
  const data = { slug: slug.parse(formData.get('slug')), sortOrder: integer(formData.get('sortOrder')), enabled: checkbox(formData.get('enabled')) };
  const row = rowId ? await db.serviceCategory.update({ where: { id: rowId }, data }) : await db.serviceCategory.create({ data });
  for (const locale of ['en','ar'] as const) {
    const name = requiredText(formData, locale + 'Name');
    const shortDescription = optionalText(formData.get(locale + 'Description'));
    await db.serviceCategoryTranslation.upsert({
      where: { categoryId_locale: { categoryId: row.id, locale } },
      create: { categoryId: row.id, locale, name, shortDescription },
      update: { name, shortDescription }
    });
  }
  await auditAdmin(rowId ? 'UPDATE' : 'CREATE', 'ServiceCategory', row.id);
  revalidatePath('/admin/service-categories');
  revalidatePath('/admin/services');
}

export async function saveService(formData: FormData) {
  await requireAdmin();
  const rowId = optionalText(formData.get('id'));
  const status = z.enum(['DRAFT','PUBLISHED','ARCHIVED']).parse(String(formData.get('status') || 'DRAFT'));
  const translations = (['en','ar'] as const).map((locale) => ({
    locale,
    name: requiredText(formData, locale + 'Name'),
    shortDescription: requiredText(formData, locale + 'Short', 2000),
    detailedContent: requiredText(formData, locale + 'Body', 30000),
    ctaLabel: optionalText(formData.get(locale + 'CtaLabel'))
  }));
  if (status === 'PUBLISHED') {
    const gate = validatePublishable('service', { translations });
    if (!gate.ok) throw new Error('Service publication blocked: ' + gate.missing.join(', '));
  }
  const iconMediaId = optionalText(formData.get('iconMediaId'));
  const coverMediaId = optionalText(formData.get('coverMediaId'));
  const galleryIds = list(formData, 'galleryMediaIds');
  const relatedIds = list(formData, 'relatedServiceIds');
  const base = {
    categoryId: id.parse(formData.get('categoryId')),
    parentServiceId: optionalText(formData.get('parentServiceId')),
    slug: slug.parse(formData.get('slug')),
    iconMediaId,
    coverMediaId,
    primaryCtaUrl: optionalText(formData.get('primaryCtaUrl')),
    sortOrder: integer(formData.get('sortOrder')),
    featured: checkbox(formData.get('featured')),
    status,
    publishedAt: status === 'PUBLISHED' ? new Date() : null
  };

  let previousSlug: string | null = null;
  const row = await db.$transaction(async (tx) => {
    const existing = rowId ? await tx.service.findUniqueOrThrow({ where: { id: rowId }, select: { slug: true } }) : null;
    previousSlug = existing?.slug ?? null;
    const service = rowId ? await tx.service.update({ where: { id: rowId }, data: base }) : await tx.service.create({ data: base });
    for (const copy of translations) {
      await tx.serviceTranslation.upsert({
        where: { serviceId_locale: { serviceId: service.id, locale: copy.locale } },
        create: { serviceId: service.id, ...copy },
        update: copy
      });
    }
    await tx.serviceMedia.deleteMany({ where: { serviceId: service.id } });
    if (galleryIds.length) {
      await tx.serviceMedia.createMany({ data: galleryIds.map((mediaId, index) => ({ serviceId: service.id, mediaId, role: 'gallery', sortOrder: index })) });
    }
    await tx.serviceRelation.deleteMany({ where: { sourceServiceId: service.id } });
    if (relatedIds.length) {
      await tx.serviceRelation.createMany({ data: relatedIds.filter((targetServiceId) => targetServiceId !== service.id).map((targetServiceId, index) => ({ sourceServiceId: service.id, targetServiceId, sortOrder: index })) });
    }
    const usages: MediaUsageInput[] = [];
    if (iconMediaId) usages.push({ mediaAssetId: iconMediaId, usageRole: 'icon' });
    if (coverMediaId) usages.push({ mediaAssetId: coverMediaId, usageRole: 'cover' });
    galleryIds.forEach((mediaAssetId, index) => usages.push({ mediaAssetId, usageRole: 'gallery:' + index }));
    await replaceMediaUsage(tx, 'Service', service.id, usages, status === 'PUBLISHED');
    if (existing && existing.slug !== service.slug) {
      const rules = await tx.redirect.findMany();
      for (const locale of ['en','ar'] as const) {
        const candidate = {
          fromPath: '/' + locale + '/services/' + existing.slug,
          toPath: '/' + locale + '/services/' + service.slug,
          enabled: true
        };
        validateRedirectRule(candidate, rules.filter((rule) => rule.fromPath !== candidate.fromPath), env.APP_URL);
        await tx.redirect.upsert({
          where: { fromPath: candidate.fromPath },
          create: { ...candidate, permanent: true },
          update: { toPath: candidate.toPath, enabled: true, permanent: true }
        });
      }
    }
    return service;
  });
  await auditAdmin(rowId ? 'UPDATE' : 'CREATE', 'Service', row.id, { status });
  revalidatePath('/admin/services');
  if (previousSlug && previousSlug !== row.slug) {
    revalidatePath('/en/services/' + previousSlug);
    revalidatePath('/ar/services/' + previousSlug);
  }
  revalidatePath('/en/services/' + row.slug);
  revalidatePath('/ar/services/' + row.slug);
}

export async function setServiceStatus(formData: FormData) {
  await requireAdmin();
  const rowId = id.parse(formData.get('id'));
  const status = z.enum(['DRAFT','PUBLISHED','ARCHIVED']).parse(formData.get('status'));
  const row = await db.service.findUniqueOrThrow({ where: { id: rowId }, include: { translations: true } });
  if (status === 'PUBLISHED') {
    const gate = validatePublishable('service', { translations: row.translations });
    if (!gate.ok) throw new Error('Service publication blocked: ' + gate.missing.join(', '));
  }
  await db.$transaction(async (tx) => {
    await tx.service.update({ where: { id: rowId }, data: { status, publishedAt: status === 'PUBLISHED' ? new Date() : null } });
    await setOwnerUsagePublication(tx, 'Service', [rowId], status === 'PUBLISHED');
  });
  await auditAdmin('STATUS_CHANGE', 'Service', rowId, { status });
  revalidatePath('/admin/services');
}

export async function saveServiceFeature(formData: FormData) {
  await requireAdmin();
  const rowId = optionalText(formData.get('id'));
  const data = { serviceId: id.parse(formData.get('serviceId')), sortOrder: integer(formData.get('sortOrder')), enabled: checkbox(formData.get('enabled')) };
  const row = rowId ? await db.serviceFeature.update({ where: { id: rowId }, data }) : await db.serviceFeature.create({ data });
  for (const locale of ['en','ar'] as const) {
    const title = requiredText(formData, locale + 'Title');
    const description = optionalText(formData.get(locale + 'Description'));
    await db.serviceFeatureTranslation.upsert({
      where: { serviceFeatureId_locale: { serviceFeatureId: row.id, locale } },
      create: { serviceFeatureId: row.id, locale, title, description },
      update: { title, description }
    });
  }
  await auditAdmin(rowId ? 'UPDATE' : 'CREATE', 'ServiceFeature', row.id);
  revalidatePath('/admin/services');
}

export async function saveProjectCategory(formData: FormData) {
  await requireAdmin();
  const rowId = optionalText(formData.get('id'));
  const data = { slug: slug.parse(formData.get('slug')), sortOrder: integer(formData.get('sortOrder')), enabled: checkbox(formData.get('enabled')) };
  const row = rowId ? await db.projectCategory.update({ where: { id: rowId }, data }) : await db.projectCategory.create({ data });
  for (const locale of ['en','ar'] as const) {
    const name = requiredText(formData, locale + 'Name');
    await db.projectCategoryTranslation.upsert({
      where: { categoryId_locale: { categoryId: row.id, locale } },
      create: { categoryId: row.id, locale, name },
      update: { name }
    });
  }
  await auditAdmin(rowId ? 'UPDATE' : 'CREATE', 'ProjectCategory', row.id);
  revalidatePath('/admin/projects');
}

export async function saveProject(formData: FormData) {
  await requireAdmin();
  const rowId = optionalText(formData.get('id'));
  const status = z.enum(['DRAFT','PUBLISHED','ARCHIVED']).parse(String(formData.get('status') || 'DRAFT'));
  const translations = (['en','ar'] as const).map((locale) => ({
    locale,
    title: requiredText(formData, locale + 'Title'),
    summary: requiredText(formData, locale + 'Summary', 4000),
    detailedDescription: optionalText(formData.get(locale + 'Body')),
    challenge: optionalText(formData.get(locale + 'Challenge')),
    solution: optionalText(formData.get(locale + 'Solution')),
    results: optionalText(formData.get(locale + 'Results'))
  }));
  const coverMediaId = optionalText(formData.get('coverMediaId'));
  const videoMediaId = optionalText(formData.get('videoMediaId'));
  const galleryIds = list(formData, 'galleryMediaIds');
  const serviceIds = list(formData, 'serviceIds');
  if (status === 'PUBLISHED') {
    const gate = validatePublishable('project', { translations, hasMedia: Boolean(coverMediaId || galleryIds.length) });
    if (!gate.ok) throw new Error('Project publication blocked: ' + gate.missing.join(', '));
  }
  const base = {
    slug: slug.parse(formData.get('slug')),
    categoryId: optionalText(formData.get('categoryId')),
    clientId: optionalText(formData.get('clientId')),
    location: optionalText(formData.get('location')),
    year: optionalInt(formData, 'year'),
    coverMediaId,
    videoMediaId,
    featured: checkbox(formData.get('featured')),
    sortOrder: integer(formData.get('sortOrder')),
    status,
    publishedAt: status === 'PUBLISHED' ? new Date() : null
  };

  let previousSlug: string | null = null;
  const row = await db.$transaction(async (tx) => {
    const existing = rowId ? await tx.project.findUniqueOrThrow({ where: { id: rowId }, select: { slug: true } }) : null;
    previousSlug = existing?.slug ?? null;
    const project = rowId ? await tx.project.update({ where: { id: rowId }, data: base }) : await tx.project.create({ data: base });
    for (const copy of translations) {
      await tx.projectTranslation.upsert({
        where: { projectId_locale: { projectId: project.id, locale: copy.locale } },
        create: { projectId: project.id, ...copy },
        update: copy
      });
    }
    await tx.projectMedia.deleteMany({ where: { projectId: project.id } });
    if (galleryIds.length) await tx.projectMedia.createMany({ data: galleryIds.map((mediaId, index) => ({ projectId: project.id, mediaId, role: 'gallery', sortOrder: index })) });
    await tx.projectService.deleteMany({ where: { projectId: project.id } });
    if (serviceIds.length) await tx.projectService.createMany({ data: serviceIds.map((serviceId, index) => ({ projectId: project.id, serviceId, sortOrder: index })) });
    const usages: MediaUsageInput[] = [];
    if (coverMediaId) usages.push({ mediaAssetId: coverMediaId, usageRole: 'cover' });
    if (videoMediaId) usages.push({ mediaAssetId: videoMediaId, usageRole: 'video' });
    galleryIds.forEach((mediaAssetId, index) => usages.push({ mediaAssetId, usageRole: 'gallery:' + index }));
    await replaceMediaUsage(tx, 'Project', project.id, usages, status === 'PUBLISHED');
    if (existing && existing.slug !== project.slug) {
      const rules = await tx.redirect.findMany();
      for (const locale of ['en','ar'] as const) {
        const candidate = {
          fromPath: '/' + locale + '/projects/' + existing.slug,
          toPath: '/' + locale + '/projects/' + project.slug,
          enabled: true
        };
        validateRedirectRule(candidate, rules.filter((rule) => rule.fromPath !== candidate.fromPath), env.APP_URL);
        await tx.redirect.upsert({
          where: { fromPath: candidate.fromPath },
          create: { ...candidate, permanent: true },
          update: { toPath: candidate.toPath, enabled: true, permanent: true }
        });
      }
    }
    return project;
  });
  await auditAdmin(rowId ? 'UPDATE' : 'CREATE', 'Project', row.id, { status });
  revalidatePath('/admin/projects');
  if (previousSlug && previousSlug !== row.slug) {
    revalidatePath('/en/projects/' + previousSlug);
    revalidatePath('/ar/projects/' + previousSlug);
  }
  revalidatePath('/en/projects/' + row.slug);
  revalidatePath('/ar/projects/' + row.slug);
}

export async function setProjectStatus(formData: FormData) {
  await requireAdmin();
  const rowId = id.parse(formData.get('id'));
  const status = z.enum(['DRAFT','PUBLISHED','ARCHIVED']).parse(formData.get('status'));
  const row = await db.project.findUniqueOrThrow({ where: { id: rowId }, include: { translations: true, media: true } });
  if (status === 'PUBLISHED') {
    const gate = validatePublishable('project', { translations: row.translations, hasMedia: row.media.length > 0 || Boolean(row.coverMediaId) });
    if (!gate.ok) throw new Error('Project publication blocked: ' + gate.missing.join(', '));
  }
  await db.$transaction(async (tx) => {
    await tx.project.update({ where: { id: rowId }, data: { status, publishedAt: status === 'PUBLISHED' ? new Date() : null } });
    await setOwnerUsagePublication(tx, 'Project', [rowId], status === 'PUBLISHED');
  });
  await auditAdmin('STATUS_CHANGE', 'Project', rowId, { status });
  revalidatePath('/admin/projects');
}
