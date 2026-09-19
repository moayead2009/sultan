import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { inspectUpload } from '@/lib/media';
import { storage } from '@/lib/storage';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
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
        byteSize: file.size,
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
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing media id.' }, { status: 400 });

  const publishedUsage = await db.mediaUsage.findFirst({
    where: { mediaAssetId: id, isPublishedReference: true }
  });
  if (publishedUsage) {
    return NextResponse.json(
      { error: 'Media referenced by published content cannot be deleted.' },
      { status: 409 }
    );
  }
  const anyUsage = await db.mediaUsage.findFirst({ where: { mediaAssetId: id } });
  if (anyUsage) {
    return NextResponse.json({ error: 'Detach this media before deletion.' }, { status: 409 });
  }

  await db.mediaAsset.delete({ where: { id } });
  await db.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action: 'DELETE',
      entityType: 'MediaAsset',
      entityId: id
    }
  });
  return NextResponse.json({ ok: true });
}
