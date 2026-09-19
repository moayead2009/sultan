import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { inspectUpload } from '@/lib/media';
import { storage } from '@/lib/storage';
import { logger } from '@/lib/logger';
import { mediaDeletionBlockReason } from '@/lib/media-usage';
import { isTrustedMutationOrigin } from '@/lib/request-security';

export async function POST(request: Request) {
  if (!isTrustedMutationOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden origin.' }, { status: 403 });
  }
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Image file is required.' }, { status: 400 });
    }
    const altEn = String(form.get('altEn') ?? '').trim();
    const altAr = String(form.get('altAr') ?? '').trim();
    if (!altEn || !altAr) {
      return NextResponse.json({ error: 'Both localized alt texts are required.' }, { status: 400 });
    }

    const inspected = await inspectUpload(file);
    const stored = await storage.put(inspected.buffer, inspected.extension, inspected.mimeType);

    const asset = await db.mediaAsset.create({
      data: {
        storageKey: stored.key,
        publicUrl: stored.publicUrl,
        originalFilename: file.name.slice(0, 255),
        mimeType: inspected.mimeType,
        byteSize: inspected.byteSize,
        width: inspected.width,
        height: inspected.height,
        checksum: inspected.checksum,
        uploadedById: session.user.id,
        translations: {
          create: [
            { locale: 'en', altText: altEn },
            { locale: 'ar', altText: altAr }
          ]
        }
      }
    });

    await db.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: 'UPLOAD',
        entityType: 'MediaAsset',
        entityId: asset.id
      }
    });
    return NextResponse.json({ id: asset.id, url: asset.publicUrl }, { status: 201 });
  } catch (error) {
    logger.error('media.upload_failed', {
      userId: session.user.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return NextResponse.json({ error: 'Upload rejected.' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  if (!isTrustedMutationOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden origin.' }, { status: 403 });
  }
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Only OWNER can permanently delete media.' }, { status: 403 });
  }
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing media id.' }, { status: 400 });

  try {
    await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "MediaAsset" WHERE "id" = ${id} FOR UPDATE`;
      const asset = await tx.mediaAsset.findUnique({ where: { id } });
      if (!asset) throw new Error('Media asset was not found.');

      const [publishedUsageCount, usageCount, directCounts] = await Promise.all([
        tx.mediaUsage.count({ where: { mediaAssetId: id, isPublishedReference: true } }),
        tx.mediaUsage.count({ where: { mediaAssetId: id } }),
        Promise.all([
          tx.siteSettings.count({ where: { OR: [{ primaryLogoId: id }, { alternateLogoId: id }, { faviconId: id }, { defaultOgImageId: id }] } }),
          tx.pageSection.count({ where: { OR: [{ primaryMediaId: id }, { secondaryMediaId: id }] } }),
          tx.pageSectionMedia.count({ where: { mediaId: id } }),
          tx.service.count({ where: { OR: [{ iconMediaId: id }, { coverMediaId: id }] } }),
          tx.project.count({ where: { OR: [{ coverMediaId: id }, { videoMediaId: id }] } }),
          tx.projectMedia.count({ where: { mediaId: id } }),
          tx.client.count({ where: { logoId: id } }),
          tx.processStep.count({ where: { OR: [{ iconMediaId: id }, { imageMediaId: id }] } }),
          tx.metric.count({ where: { iconMediaId: id } }),
          tx.leadershipMember.count({ where: { imageId: id } }),
          tx.contactPerson.count({ where: { imageId: id } }),
          tx.seoMetadata.count({ where: { ogImageId: id } })
        ])
      ]);
      const directReferenceCount = directCounts.reduce((sum, count) => sum + count, 0);
      const blocked = mediaDeletionBlockReason({ publishedUsageCount, usageCount, directReferenceCount });
      if (blocked === 'published') throw new Error('Media referenced by published content cannot be deleted.');
      if (blocked === 'referenced') throw new Error('Detach this media before deletion.');

      await storage.delete(asset.storageKey);
      await tx.mediaAsset.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          actorUserId: session.user.id,
          action: 'DELETE',
          entityType: 'MediaAsset',
          entityId: id
        }
      });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to delete media.';
    const conflict = message.includes('referenced') || message.includes('Detach');
    return NextResponse.json({ error: message }, { status: conflict ? 409 : 400 });
  }
}
