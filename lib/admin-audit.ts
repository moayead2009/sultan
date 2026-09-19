import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/authorization';

export async function auditAdmin(action: string, entityType: string, entityId?: string, metadata?: Prisma.InputJsonValue) {
  const session = await requireAdmin();
  await db.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action,
      entityType,
      entityId,
      metadataJson: metadata
    }
  });
}
