'use server';

import { hash, verify } from '@node-rs/argon2';
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

export async function setUserRole(formData: FormData) {
  await requireOwner();
  const id = z.string().min(1).parse(formData.get('id'));
  const role = z.enum(['OWNER', 'ADMIN']).parse(formData.get('role'));

  await db.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id } });
    if (user.role === 'OWNER' && user.status === 'ACTIVE' && role === 'ADMIN') {
      const activeOwners = await tx.user.count({ where: { role: 'OWNER', status: 'ACTIVE' } });
      if (activeOwners <= 1) {
        throw new Error('Cannot demote the last active OWNER.');
      }
    }
    await tx.user.update({ where: { id }, data: { role } });
  }, { isolationLevel: 'Serializable' });

  await auditAdmin('ROLE_CHANGE', 'User', id, { role });
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
    const user = await tx.user.findUniqueOrThrow({ where: { id } });
    if (status === 'DISABLED' && user.role === 'OWNER' && user.status === 'ACTIVE') {
      const activeOwners = await tx.user.count({ where: { role: 'OWNER', status: 'ACTIVE' } });
      if (activeOwners <= 1) {
        throw new Error('Cannot disable the last active OWNER.');
      }
    }

    await tx.user.update({ where: { id }, data: { status } });
    if (status === 'DISABLED') {
      await tx.authSession.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() }
      });
    }
  }, { isolationLevel: 'Serializable' });
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

  await db.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id } });
    if (user.role === 'OWNER' && user.status === 'ACTIVE') {
      const activeOwners = await tx.user.count({ where: { role: 'OWNER', status: 'ACTIVE' } });
      if (activeOwners <= 1) throw new Error('Cannot delete the last active OWNER.');
    }
    await tx.user.delete({ where: { id } });
  }, { isolationLevel: 'Serializable' });
  await auditAdmin('DELETE', 'User', id);
  revalidatePath('/admin/users');
}

export async function changeOwnPassword(formData: FormData) {
  const session = await requireAdmin();
  const currentPassword = z.string().min(1).max(128).parse(formData.get('currentPassword'));
  const newPassword = z.string().min(12).max(128).parse(formData.get('newPassword'));
  const user = await db.user.findUniqueOrThrow({ where: { id: session.user.id } });
  if (!(await verify(user.passwordHash, currentPassword))) {
    throw new Error('Current password is incorrect.');
  }
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hash(newPassword) } });
  await revokeAllUserSessions(user.id);
  await auditAdmin('PASSWORD_CHANGE', 'User', user.id);
}
