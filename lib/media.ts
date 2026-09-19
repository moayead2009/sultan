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

async function optimize(buffer: Buffer, mime: string) {
  const base = sharp(buffer, { failOn: 'error', limitInputPixels: 40_000_000 }).rotate();
  if (mime === 'image/jpeg') return base.jpeg({ quality: 86, mozjpeg: true }).toBuffer();
  if (mime === 'image/png') return base.png({ compressionLevel: 9, palette: false }).toBuffer();
  if (mime === 'image/webp') return base.webp({ quality: 86, effort: 5 }).toBuffer();
  return base.avif({ quality: 65, effort: 5 }).toBuffer();
}

export async function inspectUpload(file: File) {
  if (file.size <= 0) throw new Error('Image file is empty.');
  if (file.size > env.MAX_UPLOAD_BYTES) throw new Error('File exceeds configured upload limit.');

  const extension = allowed.get(file.type);
  if (!extension) throw new Error('Unsupported file type.');

  const original = Buffer.from(await file.arrayBuffer());
  if (!signatureMatches(original, file.type)) throw new Error('File signature does not match MIME type.');

  const initial = await sharp(original, { failOn: 'error', limitInputPixels: 40_000_000 }).metadata();
  if (!initial.width || !initial.height) throw new Error('Image dimensions could not be determined.');
  if (initial.width > 12000 || initial.height > 12000 || initial.width * initial.height > 40_000_000) {
    throw new Error('Image dimensions are too large.');
  }

  // Re-encode uploads to remove EXIF/GPS/embedded metadata and cap output size while
  // preserving the approved MIME family. sharp omits source metadata by default.
  const buffer = await optimize(original, file.type);
  if (buffer.length > env.MAX_UPLOAD_BYTES) throw new Error('Optimized image exceeds configured upload limit.');

  const metadata = await sharp(buffer).metadata();
  if (!metadata.width || !metadata.height) throw new Error('Optimized image dimensions could not be determined.');

  return {
    buffer,
    extension,
    mimeType: file.type,
    byteSize: buffer.length,
    width: metadata.width,
    height: metadata.height,
    checksum: createHash('sha256').update(buffer).digest('hex')
  };
}
