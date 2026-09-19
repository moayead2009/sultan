'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/authorization';
import { auditAdmin } from '@/lib/admin-audit';
import { checkbox } from '@/lib/admin-input';
import { isSafeHttpOrRelativeUrl } from '@/lib/security-url';

function parsePaths(formData: FormData) {
  const fromPath = z.string().trim().startsWith('/').max(500).parse(formData.get('fromPath'));
  const toPath = z.string().trim().max(500).parse(formData.get('toPath'));
  if (fromPath === toPath) throw new Error('Redirect cannot point to itself.');
  if (!isSafeHttpOrRelativeUrl(toPath)) throw new Error('Redirect target must be relative or HTTP(S).');
  return { fromPath, toPath };
}

export async function createRedirect(formData: FormData) {
  await requireAdmin();
  const paths = parsePaths(formData);
  const redirect = await db.redirect.create({
    data: { ...paths, permanent: checkbox(formData.get('permanent')), enabled: true }
  });
  await auditAdmin('CREATE', 'Redirect', redirect.id);
  revalidatePath('/admin/redirects');
}

export async function updateRedirect(formData: FormData) {
  await requireAdmin();
  const id = z.string().min(1).parse(formData.get('id'));
  const paths = parsePaths(formData);
  await db.redirect.update({
    where: { id },
    data: { ...paths, permanent: checkbox(formData.get('permanent')), enabled: checkbox(formData.get('enabled')) }
  });
  await auditAdmin('UPDATE', 'Redirect', id);
  revalidatePath('/admin/redirects');
}

export async function deleteRedirect(formData: FormData) {
  await requireAdmin(['OWNER']);
  const id = z.string().min(1).parse(formData.get('id'));
  await db.redirect.delete({ where: { id } });
  await auditAdmin('DELETE', 'Redirect', id);
  revalidatePath('/admin/redirects');
}
