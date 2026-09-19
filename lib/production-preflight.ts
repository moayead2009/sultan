export type ProductionEnvironment = Record<string, string | undefined>;

function value(env: ProductionEnvironment, key: string) {
  return env[key]?.trim() ?? '';
}

function parseHttpsUrl(env: ProductionEnvironment, key: string, issues: string[]) {
  const raw = value(env, key);
  if (!raw) {
    issues.push(key + ' must be configured.');
    return null;
  }
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'https:') issues.push(key + ' must use HTTPS in production.');
    return parsed;
  } catch {
    issues.push(key + ' must be a valid absolute URL.');
    return null;
  }
}

function positiveInteger(env: ProductionEnvironment, key: string, issues: string[]) {
  const raw = value(env, key);
  if (!raw) return;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) issues.push(key + ' must be a positive integer.');
}

export function validateProductionEnvironment(env: ProductionEnvironment) {
  const issues: string[] = [];
  const databaseUrl = value(env, 'DATABASE_URL');
  if (!databaseUrl || (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://'))) {
    issues.push('DATABASE_URL must be an explicit PostgreSQL connection URL.');
  }

  const authSecret = value(env, 'AUTH_SECRET');
  if (authSecret.length < 32 || /(replace|development-only|change-me)/i.test(authSecret)) {
    issues.push('AUTH_SECRET must be a non-placeholder value of at least 32 characters.');
  }

  const appUrl = parseHttpsUrl(env, 'APP_URL', issues);
  const nextAuthUrl = parseHttpsUrl(env, 'NEXTAUTH_URL', issues);
  if (appUrl && nextAuthUrl && appUrl.origin !== nextAuthUrl.origin) {
    issues.push('APP_URL and NEXTAUTH_URL must use the same production origin.');
  }

  if (value(env, 'STORAGE_DRIVER') !== 's3') {
    issues.push('STORAGE_DRIVER must be s3 in production.');
  }
  if (!value(env, 'OBJECT_STORAGE_BUCKET')) issues.push('OBJECT_STORAGE_BUCKET must be configured.');
  parseHttpsUrl(env, 'OBJECT_STORAGE_PUBLIC_URL', issues);

  const storageAccessKey = value(env, 'OBJECT_STORAGE_ACCESS_KEY');
  const storageSecretKey = value(env, 'OBJECT_STORAGE_SECRET_KEY');
  if (Boolean(storageAccessKey) !== Boolean(storageSecretKey)) {
    issues.push('OBJECT_STORAGE_ACCESS_KEY and OBJECT_STORAGE_SECRET_KEY must be configured together when static credentials are used.');
  }

  const mailProvider = value(env, 'MAIL_PROVIDER') || 'none';
  if (!['none', 'resend'].includes(mailProvider)) {
    issues.push('MAIL_PROVIDER must be none or resend.');
  }
  if (mailProvider === 'resend') {
    if (!value(env, 'MAIL_FROM')) issues.push('MAIL_FROM is required when MAIL_PROVIDER=resend.');
    if (!value(env, 'RESEND_API_KEY')) issues.push('RESEND_API_KEY is required when MAIL_PROVIDER=resend.');
  }

  const turnstileSiteKey = value(env, 'NEXT_PUBLIC_TURNSTILE_SITE_KEY');
  const turnstileSecret = value(env, 'TURNSTILE_SECRET_KEY');
  if (Boolean(turnstileSiteKey) !== Boolean(turnstileSecret)) {
    issues.push('NEXT_PUBLIC_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY must be configured together.');
  }

  positiveInteger(env, 'MAX_UPLOAD_BYTES', issues);
  positiveInteger(env, 'RATE_LIMIT_WINDOW_SECONDS', issues);
  positiveInteger(env, 'RATE_LIMIT_MAX', issues);

  return issues;
}
