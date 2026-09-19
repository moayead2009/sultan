'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/authorization';
import { auditAdmin } from '@/lib/admin-audit';
import { checkbox } from '@/lib/admin-input';
import { validateRedirectRule } from '@/lib/redirects';
import { env } from '@/lib/env';

function parsePaths(formData: FormData) {
  const fromPath = z.string().trim().startsWith('/').max(500).parse(formData.get('fromPath'));
  const toPath = z.string().trim().max(500).parse(formData.get('toPath'));
  return { fromPath, toPath };
}

export async function createRedirect(formData: FormData) {
  await requireAdmin();
  const paths = parsePaths(formData);
  const existing = await db.redirect.findMany();
  validateRedirectRule({ ...paths, enabled: true }, existing, env.APP_URL);
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
  const enabled = checkbox(formData.get('enabled'));
  const existing = await db.redirect.findMany();
  validateRedirectRule({ id, ...paths, enabled }, existing, env.APP_URL);
  await db.redirect.update({
    where: { id },
    data: { ...paths, permanent: checkbox(formData.get('permanent')), enabled }
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
