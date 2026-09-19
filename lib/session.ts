import { db } from '@/lib/db';

const SESSION_LIFETIME_MS = 12 * 60 * 60 * 1000;

export async function createAuthSession(userId: string) {
  return db.authSession.create({
    data: {
      userId,
      expiresAt: new Date(Date.now() + SESSION_LIFETIME_MS)
    }
  });
}

export async function revokeAuthSession(id: string, userId?: string) {
  await db.authSession.updateMany({
    where: {
      id,
      ...(userId ? { userId } : {}),
      revokedAt: null
    },
    data: { revokedAt: new Date() }
  });
}

export async function revokeAllUserSessions(userId: string) {
  await db.authSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() }
  });
}

export function sessionIsActive(session: {
  revokedAt: Date | null;
  expiresAt: Date;
  user: { status: string };
}) {
  return session.user.status === 'ACTIVE' && !session.revokedAt && session.expiresAt.getTime() > Date.now();
}
