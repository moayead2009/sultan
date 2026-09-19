import { db } from '@/lib/db';
import { updateSiteSettings, saveSocialLink, deleteSocialLink } from '../actions/settings';
import { SubmitButton } from '@/components/submit-button';
import { requireAdmin } from '@/lib/authorization';

export const dynamic = 'force-dynamic';

export default async function SiteSettingsPage() {
  const session = await requireAdmin();
  const [settings, media, social] = await Promise.all([
    db.siteSettings.findUnique({ where: { id: 'site' } }),
    db.mediaAsset.findMany({ orderBy: { createdAt: 'desc' }, take: 250 }),
    db.socialLink.findMany({ orderBy: { sortOrder: 'asc' } })
  ]);
  const mediaOptions = <>{media.map((item) => <option key={item.id} value={item.id}>{item.originalFilename}</option>)}</>;

  return (
    <div className="stack">
      <div><h1>Site settings</h1><p>Global branding, contact information and optional business details. Empty unapproved fields remain hidden publicly.</p></div>
      <form action={updateSiteSettings} className="admin-card form-grid">
        <h2>Branding & global settings</h2>
        <label>Default locale<select name="defaultLocale" defaultValue={settings?.defaultLocale ?? 'ar'}><option value="ar">Arabic</option><option value="en">English</option></select></label>
        <div className="split">
          <label>English brand name<input name="brandNameEnglish" defaultValue={settings?.brandNameEnglish ?? ''} /></label>
          <label>Arabic brand name<input name="brandNameArabic" dir="rtl" defaultValue={settings?.brandNameArabic ?? ''} /></label>
        </div>
        <label>Website URL<input name="websiteUrl" defaultValue={settings?.websiteUrl ?? ''} /></label>
        <div className="split">
          <label>Primary logo<select name="primaryLogoId" defaultValue={settings?.primaryLogoId ?? ''}><option value="">None</option>{mediaOptions}</select></label>
          <label>Alternate logo<select name="alternateLogoId" defaultValue={settings?.alternateLogoId ?? ''}><option value="">None</option>{mediaOptions}</select></label>
        </div>
        <div className="split">
          <label>Favicon<select name="faviconId" defaultValue={settings?.faviconId ?? ''}><option value="">None</option>{mediaOptions}</select></label>
          <label>Default OpenGraph image<select name="defaultOgImageId" defaultValue={settings?.defaultOgImageId ?? ''}><option value="">None</option>{mediaOptions}</select></label>
        </div>

        <h2>Contact information</h2>
        <div className="split"><label>Primary phone<input name="contactPhonePrimary" defaultValue={settings?.contactPhonePrimary ?? ''} /></label><label>Secondary phone<input name="contactPhoneSecondary" defaultValue={settings?.contactPhoneSecondary ?? ''} /></label></div>
        <label>Contact email<input type="email" name="contactEmail" defaultValue={settings?.contactEmail ?? ''} /></label>
        <div className="split"><label>Address line 1<input name="addressLine1" defaultValue={settings?.addressLine1 ?? ''} /></label><label>Address line 2<input name="addressLine2" defaultValue={settings?.addressLine2 ?? ''} /></label></div>
        <div className="split"><label>City<input name="city" defaultValue={settings?.city ?? ''} /></label><label>Region<input name="region" defaultValue={settings?.region ?? ''} /></label></div>
        <div className="split"><label>Country<input name="country" defaultValue={settings?.country ?? ''} /></label><label>Postal code<input name="postalCode" defaultValue={settings?.postalCode ?? ''} /></label></div>
        <label>Map URL<input name="mapUrl" defaultValue={settings?.mapUrl ?? ''} /></label>

        <h2>Footer & inquiry settings</h2>
        <div className="split"><label>English copyright<input name="copyrightEnglish" defaultValue={settings?.copyrightEnglish ?? ''} /></label><label>Arabic copyright<input name="copyrightArabic" dir="rtl" defaultValue={settings?.copyrightArabic ?? ''} /></label></div>
        <label><input type="checkbox" name="contactFormEnabled" defaultChecked={settings?.contactFormEnabled ?? false} /> Contact form enabled</label>
        <div className="split"><label>Inquiry recipient email<input type="email" name="inquiryRecipient" defaultValue={settings?.inquiryRecipient ?? ''} /></label><label>Retention days<input type="number" min="1" name="inquiryRetentionDays" defaultValue={settings?.inquiryRetentionDays ?? ''} /></label></div>
        <div className="split"><label>English form notice<textarea name="inquiryFormNoticeEn" defaultValue={settings?.inquiryFormNoticeEn ?? ''} /></label><label>Arabic form notice<textarea name="inquiryFormNoticeAr" dir="rtl" defaultValue={settings?.inquiryFormNoticeAr ?? ''} /></label></div>
        <SubmitButton>Save settings</SubmitButton>
      </form>

      <section className="stack">
        <h2>Social links</h2>
        <p>Nothing renders publicly unless a social link is explicitly enabled.</p>
        <form action={saveSocialLink} className="admin-card form-grid"><div className="split"><label>Platform<input name="platform" required /></label><label>URL<input type="url" name="url" required /></label></div><label>Order<input type="number" name="sortOrder" defaultValue="0" /></label><label><input type="checkbox" name="enabled" /> Enabled</label><SubmitButton>Add social link</SubmitButton></form>
        {social.map((item) => <form action={saveSocialLink} className="admin-card form-grid" key={item.id}><input type="hidden" name="id" value={item.id}/><div className="split"><label>Platform<input name="platform" defaultValue={item.platform} required /></label><label>URL<input name="url" type="url" defaultValue={item.url} required /></label></div><label>Order<input name="sortOrder" type="number" defaultValue={item.sortOrder}/></label><label><input name="enabled" type="checkbox" defaultChecked={item.enabled}/> Enabled</label><div><SubmitButton>Save</SubmitButton>{session.user.role === 'OWNER' ? <SubmitButton formAction={deleteSocialLink} className="button danger" confirmMessage="Delete this social link?">Delete</SubmitButton> : null}</div></form>)}
      </section>
    </div>
  );
}
