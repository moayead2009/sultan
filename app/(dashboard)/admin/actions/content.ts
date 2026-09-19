'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/authorization';
import { auditAdmin } from '@/lib/admin-audit';
import { checkbox, integer, optionalText } from '@/lib/admin-input';
import { replaceMediaUsage } from '@/lib/media-usage';
import { validatePublishable } from '@/lib/publication';
import { isSafeHttpUrl } from '@/lib/security-url';

const id = z.string().trim().min(1);
const slug = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

function requiredText(formData: FormData, key: string, max = 500) {
  return z.string().trim().min(1).max(max).parse(formData.get(key));
}

export async function saveClient(formData: FormData) {
  await requireAdmin();
  const rowId = optionalText(formData.get('id'));
  const logoId = optionalText(formData.get('logoId'));
  const translations = (['en','ar'] as const).map((locale) => ({
    locale,
    name: requiredText(formData, locale + 'Name'),
    altText: requiredText(formData, locale + 'Alt')
  }));
  const externalUrl = optionalText(formData.get('externalUrl'));
  if (externalUrl && !isSafeHttpUrl(externalUrl)) throw new Error('Client external URL must be HTTP(S).');
  const data = {
    logoId,
    externalUrl,
    sortOrder: integer(formData.get('sortOrder')),
    featured: checkbox(formData.get('featured')),
    enabled: checkbox(formData.get('enabled')),
    identityConfirmed: checkbox(formData.get('identityConfirmed')),
    publicDisplayApproved: checkbox(formData.get('publicDisplayApproved'))
  };
  if (data.enabled) {
    const gate = validatePublishable('client', {
      translations,
      identityConfirmed: data.identityConfirmed,
      publicDisplayApproved: data.publicDisplayApproved
    });
    if (!gate.ok) throw new Error('Client publication blocked: ' + gate.missing.join(', '));
  }
  const row = await db.$transaction(async (tx) => {
    const client = rowId ? await tx.client.update({ where: { id: rowId }, data }) : await tx.client.create({ data });
    for (const copy of translations) {
      await tx.clientTranslation.upsert({
        where: { clientId_locale: { clientId: client.id, locale: copy.locale } },
        create: { clientId: client.id, ...copy },
        update: copy
      });
    }
    await replaceMediaUsage(tx, 'Client', client.id, logoId ? [{ mediaAssetId: logoId, usageRole: 'logo' }] : [], data.enabled);
    return client;
  });
  await auditAdmin(rowId ? 'UPDATE' : 'CREATE', 'Client', row.id);
  revalidatePath('/admin/clients');
}

export async function saveMetric(formData: FormData) {
  await requireAdmin();
  const rowId = optionalText(formData.get('id'));
  const iconMediaId = optionalText(formData.get('iconMediaId'));
  const confirmed = checkbox(formData.get('confirmed'));
  const enabled = checkbox(formData.get('enabled'));
  const translations = (['en','ar'] as const).map((locale) => ({
    locale,
    label: requiredText(formData, locale + 'Label'),
    description: optionalText(formData.get(locale + 'Description'))
  }));
  if (enabled) {
    const gate = validatePublishable('metric', { translations, currentnessConfirmed: confirmed });
    if (!gate.ok) throw new Error('Metric publication blocked: ' + gate.missing.join(', '));
  }
  const data = {
    displayValue: requiredText(formData, 'displayValue'),
    suffix: optionalText(formData.get('suffix')),
    iconMediaId,
    sortOrder: integer(formData.get('sortOrder')),
    enabled,
    sourceNote: requiredText(formData, 'sourceNote', 3000),
    lastConfirmedAt: confirmed ? new Date() : null
  };
  const row = await db.$transaction(async (tx) => {
    const metric = rowId ? await tx.metric.update({ where: { id: rowId }, data }) : await tx.metric.create({ data });
    for (const copy of translations) {
      await tx.metricTranslation.upsert({
        where: { metricId_locale: { metricId: metric.id, locale: copy.locale } },
        create: { metricId: metric.id, ...copy },
        update: copy
      });
    }
    await replaceMediaUsage(tx, 'Metric', metric.id, iconMediaId ? [{ mediaAssetId: iconMediaId, usageRole: 'icon' }] : [], enabled);
    return metric;
  });
  await auditAdmin(rowId ? 'UPDATE' : 'CREATE', 'Metric', row.id);
  revalidatePath('/admin/metrics');
}

export async function saveProcessStep(formData: FormData) {
  await requireAdmin();
  const rowId = optionalText(formData.get('id'));
  const iconMediaId = optionalText(formData.get('iconMediaId'));
  const imageMediaId = optionalText(formData.get('imageMediaId'));
  const enabled = checkbox(formData.get('enabled'));
  const translations = (['en','ar'] as const).map((locale) => ({
    locale,
    title: requiredText(formData, locale + 'Title'),
    description: requiredText(formData, locale + 'Description', 5000)
  }));
  if (enabled) {
    const gate = validatePublishable('process', { translations });
    if (!gate.ok) throw new Error('Process step incomplete: ' + gate.missing.join(', '));
  }
  const data = {
    key: slug.parse(formData.get('key')),
    number: requiredText(formData, 'number', 20),
    iconMediaId,
    imageMediaId,
    link: optionalText(formData.get('link')),
    sortOrder: integer(formData.get('sortOrder')),
    enabled
  };
  const row = await db.$transaction(async (tx) => {
    const step = rowId ? await tx.processStep.update({ where: { id: rowId }, data }) : await tx.processStep.create({ data });
    for (const copy of translations) {
      await tx.processStepTranslation.upsert({
        where: { processStepId_locale: { processStepId: step.id, locale: copy.locale } },
        create: { processStepId: step.id, ...copy },
        update: copy
      });
    }
    const usages = [];
    if (iconMediaId) usages.push({ mediaAssetId: iconMediaId, usageRole: 'icon' });
    if (imageMediaId) usages.push({ mediaAssetId: imageMediaId, usageRole: 'image' });
    await replaceMediaUsage(tx, 'ProcessStep', step.id, usages, enabled);
    return step;
  });
  await auditAdmin(rowId ? 'UPDATE' : 'CREATE', 'ProcessStep', row.id);
  revalidatePath('/admin/work-cycle');
}

export async function saveLeadership(formData: FormData) {
  await requireAdmin();
  const rowId = optionalText(formData.get('id'));
  const imageId = optionalText(formData.get('imageId'));
  const status = z.enum(['DRAFT','PUBLISHED','ARCHIVED']).parse(String(formData.get('status') || 'DRAFT'));
  const translations = (['en','ar'] as const).map((locale) => ({
    locale,
    name: requiredText(formData, locale + 'Name'),
    title: requiredText(formData, locale + 'Title'),
    biographyOrMessage: requiredText(formData, locale + 'Message', 10000)
  }));
  if (status === 'PUBLISHED') {
    const gate = validatePublishable('leadership', { translations });
    if (!gate.ok) throw new Error('Leadership publication blocked: ' + gate.missing.join(', '));
  }
  const row = await db.$transaction(async (tx) => {
    const leader = rowId
      ? await tx.leadershipMember.update({ where: { id: rowId }, data: { imageId, sortOrder: integer(formData.get('sortOrder')), status } })
      : await tx.leadershipMember.create({ data: { imageId, sortOrder: integer(formData.get('sortOrder')), status } });
    for (const copy of translations) {
      await tx.leadershipMemberTranslation.upsert({
        where: { leadershipMemberId_locale: { leadershipMemberId: leader.id, locale: copy.locale } },
        create: { leadershipMemberId: leader.id, ...copy },
        update: copy
      });
    }
    await replaceMediaUsage(tx, 'LeadershipMember', leader.id, imageId ? [{ mediaAssetId: imageId, usageRole: 'image' }] : [], status === 'PUBLISHED');
    return leader;
  });
  await auditAdmin(rowId ? 'UPDATE' : 'CREATE', 'LeadershipMember', row.id, { status });
  revalidatePath('/admin/leadership');
}

export async function saveContactPerson(formData: FormData) {
  await requireAdmin();
  const rowId = optionalText(formData.get('id'));
  const imageId = optionalText(formData.get('imageId'));
  const enabled = checkbox(formData.get('enabled'));
  const data = {
    phone: optionalText(formData.get('phone')),
    email: optionalText(formData.get('email')),
    organization: optionalText(formData.get('organization')),
    imageId,
    sortOrder: integer(formData.get('sortOrder')),
    enabled
  };
  const row = await db.$transaction(async (tx) => {
    const person = rowId ? await tx.contactPerson.update({ where: { id: rowId }, data }) : await tx.contactPerson.create({ data });
    for (const locale of ['en','ar'] as const) {
      const name = requiredText(formData, locale + 'Name');
      const title = optionalText(formData.get(locale + 'Title'));
      await tx.contactPersonTranslation.upsert({
        where: { contactPersonId_locale: { contactPersonId: person.id, locale } },
        create: { contactPersonId: person.id, locale, name, title },
        update: { name, title }
      });
    }
    await replaceMediaUsage(tx, 'ContactPerson', person.id, imageId ? [{ mediaAssetId: imageId, usageRole: 'image' }] : [], enabled);
    return person;
  });
  await auditAdmin(rowId ? 'UPDATE' : 'CREATE', 'ContactPerson', row.id);
  revalidatePath('/admin/contact-people');
}

export async function deleteContactPerson(formData: FormData) {
  await requireAdmin(['OWNER']);
  const rowId = id.parse(formData.get('id'));
  await db.$transaction(async (tx) => {
    await tx.mediaUsage.deleteMany({ where: { ownerType: 'ContactPerson', ownerId: rowId } });
    await tx.contactPerson.delete({ where: { id: rowId } });
  });
  await auditAdmin('DELETE', 'ContactPerson', rowId);
  revalidatePath('/admin/contact-people');
}
