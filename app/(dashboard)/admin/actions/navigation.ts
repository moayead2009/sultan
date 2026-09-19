'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/authorization';
import { auditAdmin } from '@/lib/admin-audit';
import { checkbox, integer, optionalText } from '@/lib/admin-input';
import { normalizeNavigationDestination } from '@/lib/navigation';

const label = z.string().trim().min(1).max(500);

export async function createNavigationItem(formData: FormData) {
  await requireAdmin();
  const destination = normalizeNavigationDestination(
    optionalText(formData.get('internalPageId')),
    optionalText(formData.get('customUrl'))
  );
  const item = await db.navigationItem.create({
    data: {
      menuId: z.string().min(1).parse(formData.get('menuId')),
      parentId: optionalText(formData.get('parentId')),
      ...destination,
      sortOrder: integer(formData.get('sortOrder')),
      targetBlank: checkbox(formData.get('targetBlank')),
      enabled: checkbox(formData.get('enabled')),
      translations: { create: [
        { locale: 'en', label: label.parse(formData.get('enLabel')) },
        { locale: 'ar', label: label.parse(formData.get('arLabel')) }
      ] }
    }
  });
  await auditAdmin('CREATE', 'NavigationItem', item.id);
  revalidatePath('/admin/navigation');
}

export async function updateNavigationItem(formData: FormData) {
  await requireAdmin();
  const id = z.string().min(1).parse(formData.get('id'));
  const current = await db.navigationItem.findUniqueOrThrow({ where: { id } });
  const parentId = optionalText(formData.get('parentId'));
  if (parentId === id) throw new Error('Navigation item cannot be its own parent.');
  if (parentId) {
    const parent = await db.navigationItem.findUniqueOrThrow({ where: { id: parentId } });
    if (parent.menuId !== current.menuId) throw new Error('Parent must belong to the same menu.');
    let ancestor: string | null = parent.parentId;
    while (ancestor) {
      if (ancestor === id) throw new Error('Navigation hierarchy cannot contain a cycle.');
      const next = await db.navigationItem.findUnique({ where: { id: ancestor }, select: { parentId: true } });
      ancestor = next?.parentId ?? null;
    }
  }
  const destination = normalizeNavigationDestination(
    optionalText(formData.get('internalPageId')),
    optionalText(formData.get('customUrl'))
  );

  await db.$transaction(async (tx) => {
    await tx.navigationItem.update({
      where: { id },
      data: {
        parentId,
        ...destination,
        sortOrder: integer(formData.get('sortOrder')),
        targetBlank: checkbox(formData.get('targetBlank')),
        enabled: checkbox(formData.get('enabled'))
      }
    });
    for (const locale of ['en','ar'] as const) {
      const value = label.parse(formData.get(locale + 'Label'));
      await tx.navigationItemTranslation.upsert({
        where: { navigationItemId_locale: { navigationItemId: id, locale } },
        create: { navigationItemId: id, locale, label: value },
        update: { label: value }
      });
    }
  });
  await auditAdmin('UPDATE', 'NavigationItem', id);
  revalidatePath('/admin/navigation');
}

export async function deleteNavigationItem(formData: FormData) {
  await requireAdmin(['OWNER']);
  const id = z.string().min(1).parse(formData.get('id'));
  const children = await db.navigationItem.count({ where: { parentId: id } });
  if (children) throw new Error('Move or disable child navigation items before hard deletion.');
  await db.navigationItem.delete({ where: { id } });
  await auditAdmin('DELETE', 'NavigationItem', id);
  revalidatePath('/admin/navigation');
}
