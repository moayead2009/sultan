import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { env } from '@/lib/env';

export type StoredObject = {
  key: string;
  publicUrl: string;
};

export interface StorageAdapter {
  put(buffer: Buffer, extension: string, contentType: string): Promise<StoredObject>;
}

class LocalStorageAdapter implements StorageAdapter {
  async put(buffer: Buffer, extension: string) {
    const key = new Date().toISOString().slice(0, 10) + '/' + randomUUID() + '.' + extension;
    const root = path.join(process.cwd(), env.LOCAL_UPLOAD_DIR);
    const target = path.join(root, key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, buffer);
    return { key, publicUrl: '/' + env.LOCAL_UPLOAD_DIR.replace(/^public\//, '') + '/' + key };
  }
}

class S3StorageAdapter implements StorageAdapter {
  private client = new S3Client({
    region: env.OBJECT_STORAGE_REGION,
    endpoint: env.OBJECT_STORAGE_ENDPOINT,
    forcePathStyle: Boolean(env.OBJECT_STORAGE_ENDPOINT),
    credentials:
      env.OBJECT_STORAGE_ACCESS_KEY && env.OBJECT_STORAGE_SECRET_KEY
        ? {
            accessKeyId: env.OBJECT_STORAGE_ACCESS_KEY,
            secretAccessKey: env.OBJECT_STORAGE_SECRET_KEY
          }
        : undefined
  });

  async put(buffer: Buffer, extension: string, contentType: string) {
    if (!env.OBJECT_STORAGE_BUCKET || !env.OBJECT_STORAGE_PUBLIC_URL) {
      throw new Error('S3-compatible storage is not fully configured.');
    }
    const key = 'media/' + new Date().toISOString().slice(0, 10) + '/' + randomUUID() + '.' + extension;
    await this.client.send(
      new PutObjectCommand({
        Bucket: env.OBJECT_STORAGE_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable'
      })
    );
    return { key, publicUrl: env.OBJECT_STORAGE_PUBLIC_URL.replace(/\/$/, '') + '/' + key };
  }
}

export const storage: StorageAdapter =
  env.STORAGE_DRIVER === 's3' ? new S3StorageAdapter() : new LocalStorageAdapter();
