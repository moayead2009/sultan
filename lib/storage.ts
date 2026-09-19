import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import path from 'path';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { env } from '@/lib/env';

export type StoredObject = {
  key: string;
  publicUrl: string;
};

export interface StorageAdapter {
  put(buffer: Buffer, extension: string, contentType: string): Promise<StoredObject>;
  delete(key: string): Promise<void>;
}

class LocalStorageAdapter implements StorageAdapter {
  private root() {
    return path.resolve(process.cwd(), env.LOCAL_UPLOAD_DIR);
  }

  private targetFor(key: string) {
    const root = this.root();
    const target = path.resolve(root, key);
    if (target !== root && !target.startsWith(root + path.sep)) {
      throw new Error('Invalid storage key.');
    }
    return target;
  }

  async put(buffer: Buffer, extension: string) {
    const key = new Date().toISOString().slice(0, 10) + '/' + randomUUID() + '.' + extension;
    const target = this.targetFor(key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, buffer);
    return { key, publicUrl: '/' + env.LOCAL_UPLOAD_DIR.replace(/^public\//, '') + '/' + key };
  }

  async delete(key: string) {
    try {
      await unlink(this.targetFor(key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
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

  private bucket() {
    if (!env.OBJECT_STORAGE_BUCKET) throw new Error('S3-compatible storage bucket is not configured.');
    return env.OBJECT_STORAGE_BUCKET;
  }

  async put(buffer: Buffer, extension: string, contentType: string) {
    if (!env.OBJECT_STORAGE_PUBLIC_URL) {
      throw new Error('S3-compatible storage public URL is not configured.');
    }
    const key = 'media/' + new Date().toISOString().slice(0, 10) + '/' + randomUUID() + '.' + extension;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket(),
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable'
      })
    );
    return { key, publicUrl: env.OBJECT_STORAGE_PUBLIC_URL.replace(/\/$/, '') + '/' + key };
  }

  async delete(key: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket(), Key: key }));
  }
}

export const storage: StorageAdapter =
  env.STORAGE_DRIVER === 's3' ? new S3StorageAdapter() : new LocalStorageAdapter();
