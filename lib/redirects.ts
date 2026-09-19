import { isSafeHttpOrRelativeUrl } from '@/lib/security-url';

export type RedirectRuleLike = {
  id?: string;
  fromPath: string;
  toPath: string;
  enabled: boolean;
};

const protectedPrefixes = ['/admin', '/preview', '/api', '/internal', '/_internal', '/_next'];

export function isProtectedRedirectPath(pathname: string) {
  const value = pathname.toLowerCase();
  return protectedPrefixes.some((prefix) => value === prefix || value.startsWith(prefix + '/'));
}

function pathOnly(value: string) {
  return new URL(value, 'https://redirect.local').pathname;
}

export function validateRedirectRule(candidate: RedirectRuleLike, existing: RedirectRuleLike[] = []) {
  if (!candidate.fromPath.startsWith('/') || candidate.fromPath.startsWith('//') || candidate.fromPath.includes('\\')) {
    throw new Error('Redirect source must be a safe absolute application path.');
  }

  const parsedSource = new URL(candidate.fromPath, 'https://redirect.local');
  if (parsedSource.origin !== 'https://redirect.local' || parsedSource.pathname !== candidate.fromPath || parsedSource.search || parsedSource.hash) {
    throw new Error('Redirect source must contain only a pathname.');
  }

  if (isProtectedRedirectPath(candidate.fromPath)) {
    throw new Error('Redirect rules cannot use protected application paths.');
  }
  if (!isSafeHttpOrRelativeUrl(candidate.toPath)) {
    throw new Error('Redirect target must be relative or HTTP(S).');
  }

  const targetIsLocal = candidate.toPath.startsWith('/') && !candidate.toPath.startsWith('//');
  const candidateTargetPath = targetIsLocal ? pathOnly(candidate.toPath) : null;
  if (candidateTargetPath && isProtectedRedirectPath(candidateTargetPath)) {
    throw new Error('Redirect rules cannot target protected application paths.');
  }

  if (!candidate.enabled) return;

  const rules = existing
    .filter((rule) => rule.enabled && (!candidate.id || rule.id !== candidate.id))
    .concat(candidate);

  const graph = new Map<string, string>();
  for (const rule of rules) {
    if (isProtectedRedirectPath(rule.fromPath)) continue;
    if (!rule.toPath.startsWith('/') || rule.toPath.startsWith('//')) continue;
    graph.set(rule.fromPath, pathOnly(rule.toPath));
  }

  for (const start of graph.keys()) {
    const visited = new Set<string>();
    let current: string | undefined = start;
    while (current && graph.has(current)) {
      if (visited.has(current)) throw new Error('Redirect loop detected.');
      visited.add(current);
      current = graph.get(current);
    }
  }
}
