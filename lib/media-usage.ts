import type { Prisma } from '@prisma/client';

export type MediaUsageInput = {
  mediaAssetId: string;
  usageRole: string;
};

export function collectSectionMediaUsages(input: {
  primaryMediaId?: string | null;
  secondaryMediaId?: string | null;
  galleryMedia?: Array<{ mediaId: string; role: string }>;
}) {
  const rows: MediaUsageInput[] = [];
  if (input.primaryMediaId) rows.push({ mediaAssetId: input.primaryMediaId, usageRole: 'primaryMedia' });
  if (input.secondaryMediaId) rows.push({ mediaAssetId: input.secondaryMediaId, usageRole: 'secondaryMedia' });
  for (const item of input.galleryMedia ?? []) {
    rows.push({ mediaAssetId: item.mediaId, usageRole: `gallery:${item.role}` });
  }
  const deduped = new Map(rows.map((row) => [`${row.mediaAssetId}:${row.usageRole}`, row]));
  return [...deduped.values()];
}

export async function replaceMediaUsage(
  tx: Prisma.TransactionClient,
  ownerType: string,
  ownerId: string,
  usages: MediaUsageInput[],
  isPublishedReference: boolean
) {
  await tx.mediaUsage.deleteMany({ where: { ownerType, ownerId } });
  if (usages.length) {
    await tx.mediaUsage.createMany({
      data: usages.map((usage) => ({
        mediaAssetId: usage.mediaAssetId,
        ownerType,
        ownerId,
        usageRole: usage.usageRole,
        isPublishedReference
      }))
    });
  }
}

export async function setOwnerUsagePublication(
  tx: Prisma.TransactionClient,
  ownerType: string,
  ownerIds: string[],
  published: boolean
) {
  if (!ownerIds.length) return;
  await tx.mediaUsage.updateMany({
    where: { ownerType, ownerId: { in: ownerIds } },
    data: { isPublishedReference: published }
  });
}

export function mediaDeletionBlockReason(input: {
  publishedUsageCount: number;
  usageCount: number;
  directReferenceCount: number;
}) {
  if (input.publishedUsageCount > 0) return 'published';
  if (input.usageCount > 0 || input.directReferenceCount > 0) return 'referenced';
  return null;
}
