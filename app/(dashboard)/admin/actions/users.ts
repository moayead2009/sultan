'use server';

import { hash } from '@node-rs/argon2';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/authorization';
import { auditAdmin } from '@/lib/admin-audit';
import { revokeAllUserSessions } from '@/lib/session';

async function requireOwner() {
  return requireAdmin(['OWNER']);
}

export async function createUser(formData: FormData) {
  await requireOwner();
  const password = z.string().min(12).max(128).parse(formData.get('password'));
  const user = await db.user.create({
    data: {
      name: z.string().trim().min(1).max(100).parse(formData.get('name')),
      email: z.string().email().transform((v) => v.toLowerCase()).parse(formData.get('email')),
      passwordHash: await hash(password),
      role: formData.get('role') === 'OWNER' ? 'OWNER' : 'ADMIN'
    }
  });
  await auditAdmin('CREATE', 'User', user.id);
  revalidatePath('/admin/users');
}

export async function setUserStatus(formData: FormData) {
  const session = await requireOwner();
  const id = z.string().min(1).parse(formData.get('id'));
  const status = z.enum(['ACTIVE','DISABLED']).parse(formData.get('status'));
  if (id === session.user.id && status === 'DISABLED') {
    throw new Error('OWNER cannot disable the currently authenticated account.');
  }

  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id }, data: { status } });
    if (status === 'DISABLED') {
      await tx.authSession.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() }
      });
    }
  });
  await auditAdmin('STATUS_CHANGE', 'User', id, { status });
  revalidatePath('/admin/users');
}

export async function resetUserPassword(formData: FormData) {
  await requireOwner();
  const id = z.string().min(1).parse(formData.get('id'));
  const password = z.string().min(12).max(128).parse(formData.get('password'));
  await db.user.update({ where: { id }, data: { passwordHash: await hash(password) } });
  await revokeAllUserSessions(id);
  await auditAdmin('PASSWORD_RESET', 'User', id);
  revalidatePath('/admin/users');
}

export async function deleteUser(formData: FormData) {
  const session = await requireOwner();
  const id = z.string().min(1).parse(formData.get('id'));
  if (id === session.user.id) throw new Error('OWNER cannot hard-delete the current account.');

  const user = await db.user.findUniqueOrThrow({ where: { id } });
  if (user.role === 'OWNER') {
    const activeOwners = await db.user.count({ where: { role: 'OWNER', status: 'ACTIVE' } });
    if (activeOwners <= 1) throw new Error('Cannot delete the last active OWNER.');
  }
  await db.user.delete({ where: { id } });
  await auditAdmin('DELETE', 'User', id);
  revalidatePath('/admin/users');
}
