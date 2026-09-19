import { env } from '@/lib/env';

export function isTrustedMutationOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    const candidate = new URL(origin);
    const allowed = new Set([
      new URL(env.NEXTAUTH_URL).origin,
      new URL(env.APP_URL).origin
    ]);
    return allowed.has(candidate.origin);
  } catch {
    return false;
  }
}
