'use client';

import Script from 'next/script';
import { useState } from 'react';
import type { Locale } from '@/lib/i18n';

export function ContactForm({
  locale,
  services,
  turnstileSiteKey,
  notice
}: {
  locale: Locale;
  services: Array<{ id: string; name: string }>;
  turnstileSiteKey?: string;
  notice?: string | null;
}) {
  const [state, setState] = useState<'idle'|'sending'|'success'|'error'>('idle');
  const [message, setMessage] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setState('sending');
    setMessage('');
    const form = new FormData(formElement);
    const payload = Object.fromEntries(form.entries());
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...payload, locale })
    });
    const result = await response.json().catch(() => ({}));
    if (response.ok) {
      formElement.reset();
      setState('success');
      setMessage(locale === 'ar' ? 'تم استلام رسالتك بنجاح.' : 'Your inquiry was received successfully.');
    } else {
      setState('error');
      setMessage(result.error || (locale === 'ar' ? 'تعذر إرسال الطلب. حاول مرة أخرى.' : 'Unable to submit the inquiry. Please try again.'));
    }
  }

  return <>
    {turnstileSiteKey ? <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" /> : null}
    <form className="contact-form" onSubmit={submit}>
      <div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <div className="form-row">
        <label>{locale === 'ar' ? 'الاسم' : 'Name'}<input name="name" required maxLength={120} /></label>
        <label>{locale === 'ar' ? 'المنشأة / الشركة' : 'Organization'}<input name="organization" maxLength={160} /></label>
      </div>
      <div className="form-row">
        <label>{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}<input name="email" type="email" required maxLength={200} /></label>
        <label>{locale === 'ar' ? 'الهاتف' : 'Phone'}<input name="phone" type="tel" maxLength={60} /></label>
      </div>
      <label>{locale === 'ar' ? 'الخدمة' : 'Service interest'}<select name="serviceId" defaultValue=""><option value="">{locale === 'ar' ? 'اختر عند الحاجة' : 'Select if applicable'}</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></label>
      <label>{locale === 'ar' ? 'الموضوع' : 'Subject'}<input name="subject" maxLength={180} /></label>
      <label>{locale === 'ar' ? 'الرسالة' : 'Message'}<textarea name="message" required minLength={10} maxLength={5000} rows={7} /></label>
      <label className="consent"><input name="consent" type="checkbox" required /> {notice || (locale === 'ar' ? 'أوافق على استخدام البيانات المقدمة للرد على هذا الاستفسار.' : 'I agree that the submitted information may be used to respond to this inquiry.')}</label>
      {turnstileSiteKey ? <div className="cf-turnstile" data-sitekey={turnstileSiteKey} /> : null}
      <button className="button" disabled={state === 'sending'}>{state === 'sending' ? (locale === 'ar' ? 'جارٍ الإرسال…' : 'Sending…') : (locale === 'ar' ? 'إرسال الاستفسار' : 'Send inquiry')}</button>
      {message ? <p role="status" className={state === 'error' ? 'form-status error' : 'form-status'}>{message}</p> : null}
    </form>
  </>;
}
