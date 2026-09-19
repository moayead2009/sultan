export function safeCallbackPath(value: string | null | undefined, fallback = '/admin') {
  if (!value) return fallback;
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback;
  try {
    const url = new URL(value, 'https://callback.invalid');
    if (url.origin !== 'https://callback.invalid') return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function safeAuthRedirect(url: string, baseUrl: string) {
  try {
    if (url.startsWith('/')) return new URL(safeCallbackPath(url), baseUrl).toString();
    const candidate = new URL(url);
    if (candidate.origin === new URL(baseUrl).origin) return candidate.toString();
  } catch {
    // Fall through to the protected admin landing page.
  }
  return new URL('/admin', baseUrl).toString();
}

export function isSafeHttpOrRelativeUrl(value: string) {
  if (value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
