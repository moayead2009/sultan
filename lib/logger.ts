type LogLevel = 'info' | 'warn' | 'error';

const sensitiveKey = /(password|secret|token|authorization|cookie|session|email|phone|address|name|message|body)/i;

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (depth > 4) return '[REDACTED_DEPTH]';
  if (Array.isArray(value)) return value.map((item) => sanitizeValue(item, depth + 1));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        key,
        sensitiveKey.test(key) ? '[REDACTED]' : sanitizeValue(nested, depth + 1)
      ])
    );
  }
  return value;
}

function sanitize(meta: Record<string, unknown> = {}) {
  return Object.fromEntries(
    Object.entries(meta).map(([key, value]) => [
      key,
      sensitiveKey.test(key) ? '[REDACTED]' : sanitizeValue(value)
    ])
  );
}

function write(level: LogLevel, event: string, meta?: Record<string, unknown>) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    event,
    ...sanitize(meta)
  };
  const line = JSON.stringify(payload);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.info(line);
}

export const logger = {
  info: (event: string, meta?: Record<string, unknown>) => write('info', event, meta),
  warn: (event: string, meta?: Record<string, unknown>) => write('warn', event, meta),
  error: (event: string, meta?: Record<string, unknown>) => write('error', event, meta)
};
