import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    const storageReady =
      env.STORAGE_DRIVER === 'local' || Boolean(env.OBJECT_STORAGE_BUCKET && env.OBJECT_STORAGE_PUBLIC_URL);

    if (!storageReady) {
      logger.warn('readiness.unavailable', { reasonCode: 'storage_configuration' });
      return NextResponse.json(
        { status: 'unavailable' },
        { status: 503, headers: { 'cache-control': 'no-store' } }
      );
    }

    return NextResponse.json(
      { status: 'ready' },
      { status: 200, headers: { 'cache-control': 'no-store' } }
    );
  } catch (error) {
    logger.error('readiness.unavailable', {
      reasonCode: 'database',
      errorType: error instanceof Error ? error.name : 'unknown'
    });
    return NextResponse.json(
      { status: 'unavailable' },
      { status: 503, headers: { 'cache-control': 'no-store' } }
    );
  }
}
