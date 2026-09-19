import sanitizeHtml from 'sanitize-html';
import { z } from 'zod';
import { db } from '@/lib/db';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

const inquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  organization: z.string().trim().max(160).optional().default(''),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(60).optional().default(''),
  serviceId: z.string().trim().max(100).optional().default(''),
  subject: z.string().trim().max(180).optional().default(''),
  message: z.string().trim().min(10).max(5000),
  consent: z.union([z.boolean(), z.literal('on'), z.literal('true')]),
  locale: z.enum(['en', 'ar']),
  website: z.string().max(0).optional().default('')
});

const plain = (value: string) => sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();

export async function persistInquiry(input: unknown) {
  const parsed = inquirySchema.parse(input);
  const service = parsed.serviceId ? await db.service.findFirst({ where: { id: parsed.serviceId, status: 'PUBLISHED' }, select: { id: true } }) : null;
  const retentionUntil = env.NODE_ENV === 'test' ? null : null;
  const submission = await db.contactSubmission.create({
    data: {
      name: plain(parsed.name),
      organization: parsed.organization ? plain(parsed.organization) : null,
      email: parsed.email.toLowerCase(),
      phone: parsed.phone ? plain(parsed.phone) : null,
      serviceId: service?.id ?? null,
      subject: parsed.subject ? plain(parsed.subject) : null,
      message: plain(parsed.message),
      locale: parsed.locale,
      consentJson: { responseUseAccepted: true },
      notificationStatus: env.MAIL_PROVIDER === 'none' ? 'NOT_CONFIGURED' : 'PENDING',
      retentionUntil
    }
  });

  // Persistence intentionally happens before notification. No provider is fabricated:
  // when a provider is not configured, the inquiry remains safely stored and visible in CMS.
  if (env.MAIL_PROVIDER !== 'none') {
    try {
      logger.warn('inquiry.notification_provider_unimplemented', { submissionId: submission.id, provider: env.MAIL_PROVIDER });
      await db.contactSubmission.update({ where: { id: submission.id }, data: { notificationStatus: 'FAILED' } });
    } catch {
      // Notification-state failure must never roll back a successfully persisted inquiry.
    }
  }
  return submission;
}
