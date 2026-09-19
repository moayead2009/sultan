import sharp from 'sharp';
import { createHash } from 'crypto';
import { env } from '@/lib/env';

const allowed = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/avif', 'avif']
]);

function signatureMatches(buffer: Buffer, mime: string) {
  if (mime === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8;
  if (mime === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mime === 'image/webp') return buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  if (mime === 'image/avif') return buffer.toString('ascii', 4, 12).includes('ftypavif') || buffer.toString('ascii', 4, 16).includes('ftypavis');
  return false;
}

export async function inspectUpload(file: File) {
  if (file.size > env.MAX_UPLOAD_BYTES) throw new Error('File exceeds configured upload limit.');
  const extension = allowed.get(file.type);
  if (!extension) throw new Error('Unsupported file type.');
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!signatureMatches(buffer, file.type)) throw new Error('File signature does not match MIME type.');
  const metadata = await sharp(buffer).metadata();
  if (!metadata.width || !metadata.height) throw new Error('Image dimensions could not be determined.');
  if (metadata.width > 12000 || metadata.height > 12000) throw new Error('Image dimensions are too large.');
  return {
    buffer,
    extension,
    mimeType: file.type,
    width: metadata.width,
    height: metadata.height,
    checksum: createHash('sha256').update(buffer).digest('hex')
  };
}
