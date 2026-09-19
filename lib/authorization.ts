import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import type { Role } from '@prisma/client';
import { authOptions } from '@/lib/auth';

export async function requireAdmin(allowed: Role[] = ['OWNER', 'ADMIN']) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.status !== 'ACTIVE') redirect('/admin/login');
  if (!allowed.includes(session.user.role)) redirect('/admin?unauthorized=1');
  return session;
}

export function canManageUsers(role: Role) {
  return role === 'OWNER';
}

export function canHardDelete(role: Role) {
  return role === 'OWNER';
}
