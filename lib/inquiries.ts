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
  consent: z.union([z.literal(true), z.literal('on'), z.literal('true')]),
  locale: z.enum(['en', 'ar']),
  website: z.string().max(0).optional().default('')
});

const plain = (value: string) => sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();

async function notifyInquiry(
  submission: {
    id: string;
    name: string;
    email: string;
    organization: string | null;
    phone: string | null;
    subject: string | null;
    message: string;
  },
  recipient: string | null
) {
  if (env.MAIL_PROVIDER !== 'resend' || !env.RESEND_API_KEY || !env.MAIL_FROM || !recipient) {
    await db.contactSubmission.update({
      where: { id: submission.id },
      data: { notificationStatus: 'NOT_CONFIGURED' }
    });
    return;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: 'Bearer ' + env.RESEND_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        from: env.MAIL_FROM,
        to: [recipient],
        reply_to: submission.email,
        subject: submission.subject || 'New website inquiry',
        text: [
          'New website inquiry',
          'Name: ' + submission.name,
          submission.organization ? 'Organization: ' + submission.organization : '',
          'Email: ' + submission.email,
          submission.phone ? 'Phone: ' + submission.phone : '',
          '',
          submission.message
        ].filter(Boolean).join('\n')
      })
    });

    await db.contactSubmission.update({
      where: { id: submission.id },
      data: { notificationStatus: response.ok ? 'SENT' : 'FAILED' }
    });
    if (!response.ok) {
      logger.warn('inquiry.notification_failed', { submissionId: submission.id, status: response.status });
    }
  } catch (error) {
    await db.contactSubmission.update({
      where: { id: submission.id },
      data: { notificationStatus: 'FAILED' }
    }).catch(() => undefined);
    logger.warn('inquiry.notification_failed', {
      submissionId: submission.id,
      error: error instanceof Error ? error.message : 'unknown'
    });
  }
}

export async function persistInquiry(input: unknown) {
  const parsed = inquirySchema.parse(input);
  const [service, settings] = await Promise.all([
    parsed.serviceId
      ? db.service.findFirst({ where: { id: parsed.serviceId, status: 'PUBLISHED' }, select: { id: true } })
      : Promise.resolve(null),
    db.siteSettings.findUnique({
      where: { id: 'site' },
      select: { inquiryRecipient: true, inquiryRetentionDays: true }
    })
  ]);

  const retentionUntil = settings?.inquiryRetentionDays
    ? new Date(Date.now() + settings.inquiryRetentionDays * 86_400_000)
    : null;

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
      notificationStatus: 'PENDING',
      retentionUntil
    }
  });

  await notifyInquiry(submission, settings?.inquiryRecipient ?? null);
  return submission;
}
