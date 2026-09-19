import { db } from '@/lib/db';
import { updateSiteSettings } from '../actions/settings';
import { SubmitButton } from '@/components/submit-button';

export const dynamic = 'force-dynamic';

export default async function SiteSettingsPage() {
  const settings = await db.siteSettings.findUnique({ where: { id: 'site' } });
  return (
    <div className="stack">
      <div><h1>Site settings</h1><p>Business details remain optional unless approved for publication.</p></div>
      <form action={updateSiteSettings} className="admin-card form-grid">
        <label>Default locale<select name="defaultLocale" defaultValue={settings?.defaultLocale ?? 'ar'}><option value="ar">Arabic</option><option value="en">English</option></select></label>
        <div className="split">
          <label>English brand name<input name="brandNameEnglish" defaultValue={settings?.brandNameEnglish ?? ''} /></label>
          <label>Arabic brand name<input name="brandNameArabic" dir="rtl" defaultValue={settings?.brandNameArabic ?? ''} /></label>
        </div>
        <label>Website URL<input name="websiteUrl" defaultValue={settings?.websiteUrl ?? ''} /></label>
        <div className="split">
          <label>Primary phone<input name="contactPhonePrimary" defaultValue={settings?.contactPhonePrimary ?? ''} /></label>
          <label>Secondary phone<input name="contactPhoneSecondary" defaultValue={settings?.contactPhoneSecondary ?? ''} /></label>
        </div>
        <label>Contact email<input type="email" name="contactEmail" defaultValue={settings?.contactEmail ?? ''} /></label>
        <label>Address<input name="addressLine1" defaultValue={settings?.addressLine1 ?? ''} /></label>
        <label><input type="checkbox" name="contactFormEnabled" defaultChecked={settings?.contactFormEnabled ?? false} /> Contact form enabled</label>
        <SubmitButton>Save settings</SubmitButton>
      </form>
    </div>
  );
}
