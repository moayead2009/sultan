import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { persistInquiry } from '@/lib/inquiries';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const limit = checkRateLimit('contact:' + ip, 5, 600);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429, headers: { 'retry-after': String(limit.retryAfter ?? 600) } });
  }

  try {
    const body = await request.json();
    if (body.website) return NextResponse.json({ ok: true }, { status: 202 });
    const submission = await persistInquiry(body);
    return NextResponse.json({ ok: true, id: submission.id }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: 'Please review the form fields.' }, { status: 400 });
    logger.error('inquiry.submit_failed', { error: error instanceof Error ? error.message : 'unknown' });
    return NextResponse.json({ error: 'Unable to process the inquiry.' }, { status: 500 });
  }
}
