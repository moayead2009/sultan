import { z } from 'zod';
import { assertProductionRuntimeRequirements } from '@/lib/runtime-requirements';

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(24),
  APP_URL: z.string().url(),
  NEXTAUTH_URL: z.string().url(),
  USE_DATABASE_CONTENT: z.enum(['true', 'false']).default('false'),
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  LOCAL_UPLOAD_DIR: z.string().default('public/uploads'),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(10_485_760),
  OBJECT_STORAGE_ENDPOINT: z.string().optional(),
  OBJECT_STORAGE_REGION: z.string().default('auto'),
  OBJECT_STORAGE_BUCKET: z.string().optional(),
  OBJECT_STORAGE_ACCESS_KEY: z.string().optional(),
  OBJECT_STORAGE_SECRET_KEY: z.string().optional(),
  OBJECT_STORAGE_PUBLIC_URL: z.string().optional(),
  MAIL_PROVIDER: z.string().default('none'),
  MAIL_FROM: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(600),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  ERROR_MONITORING_DSN: z.string().optional()
});

const fallback = {
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/solutions_gate',
  AUTH_SECRET: 'development-only-change-me-please-123456',
  APP_URL: 'http://localhost:3000',
  NEXTAUTH_URL: 'http://localhost:3000'
};

const parsed = schema.safeParse({
  ...fallback,
  ...process.env
});

if (!parsed.success) {
  throw new Error('Invalid environment configuration: ' + parsed.error.message);
}

if (process.env.NODE_ENV === 'production') {
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.includes('development-only')) {
    throw new Error('AUTH_SECRET must be explicitly configured in production.');
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be explicitly configured in production.');
  }
}

assertProductionRuntimeRequirements({
  nodeEnv: process.env.NODE_ENV,
  nextAuthUrlExplicit: process.env.NEXTAUTH_URL,
  storageDriver: parsed.data.STORAGE_DRIVER,
  objectStorageBucket: parsed.data.OBJECT_STORAGE_BUCKET,
  objectStoragePublicUrl: parsed.data.OBJECT_STORAGE_PUBLIC_URL
});

export const env = parsed.data;
