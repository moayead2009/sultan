type LogLevel = 'info' | 'warn' | 'error';

const redactKeys = new Set([
  'password',
  'passwordHash',
  'session',
  'token',
  'secret',
  'messageBody',
  'inquiryMessage'
]);

function sanitize(meta: Record<string, unknown> = {}) {
  return Object.fromEntries(
    Object.entries(meta).map(([key, value]) => [key, redactKeys.has(key) ? '[REDACTED]' : value])
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
