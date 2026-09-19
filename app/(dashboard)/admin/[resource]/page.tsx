import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/authorization';
import { SubmitButton } from '@/components/submit-button';
import {
  saveServiceCategory,
  saveService,
  saveServiceFeature,
  saveProjectCategory,
  saveProject
} from '../actions/services-projects';
import {
  saveClient,
  saveMetric,
  saveProcessStep,
  saveLeadership
} from '../actions/content';
import {
  saveCapabilityPackage,
  saveCapabilityFeature,
  saveCapabilityValue,
  updateInquiryStatus,
  saveSeo
} from '../actions/capabilities-inquiries-seo';

export const dynamic = 'force-dynamic';

const copy = <T extends { locale: string }>(rows: T[], locale: 'en'|'ar') => rows.find((row) => row.locale === locale);

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="admin-card">{children}</div>;
}

function ManagerLinks({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="stack"><div><h1>{title}</h1><p>Phase 2 domain is maintained through the existing typed CMS records.</p></div><div className="admin-card">{children}</div></div>;
}

export default async function BusinessResourcePage({
  params,
  searchParams
}: {
  params: Promise<{ resource: string }>;
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const session = await requireAdmin();
  const { resource } = await params;
  const query = await searchParams;
  const q = (query.q ?? '').trim();

  if (resource === 'homepage' || resource === 'about') {
    const slug = resource === 'homepage' ? 'home' : 'about';
    const page = await db.page.findUnique({ where: { slug } });
    if (!page) notFound();
    return <ManagerLinks title={resource === 'homepage' ? 'Homepage' : 'About'}>
      <p>Page copy, sections, CTA destinations, media and ordering are maintained through the Page Sections editor.</p>
      <Link className="button" href={'/admin/sections?pageId=' + page.id}>Manage {resource === 'homepage' ? 'homepage' : 'About'} sections</Link>
    </ManagerLinks>;
  }

  if (resource === 'footer') return <ManagerLinks title="Footer"><Link className="button" href="/admin/navigation">Manage footer navigation</Link></ManagerLinks>;
  if (resource === 'branding' || resource === 'contact-settings' || resource === 'global-settings') return <ManagerLinks title={resource.replaceAll('-', ' ')}><Link className="button" href="/admin/site-settings">Open site settings</Link></ManagerLinks>;
  if (resource === 'buttons' || resource === 'ctas') return <ManagerLinks title="Buttons & CTAs"><Link className="button" href="/admin/sections">Manage CTA labels and destinations in sections</Link></ManagerLinks>;
  if (resource === 'galleries' || resource === 'project-galleries') return <ManagerLinks title="Galleries"><p>Gallery relationships are maintained on Services and Projects, using assets from the Media library.</p><div className="split"><Link className="button" href="/admin/services">Service galleries</Link><Link className="button secondary" href="/admin/projects">Project galleries</Link></div></ManagerLinks>;

  if (resource === 'service-categories') {
    const rows = await db.serviceCategory.findMany({ include: { translations: true, _count: { select: { services: true } } }, orderBy: { sortOrder: 'asc' } });
    return <div className="stack">
      <div><h1>Service categories</h1><p>These group the source-supported service portfolio; they are not presented publicly as corporate divisions.</p></div>
      <form action={saveServiceCategory} className="admin-card form-grid">
        <h2>Create category</h2>
        <div className="split"><label>Slug<input name="slug" required /></label><label>Order<input name="sortOrder" type="number" defaultValue="0" /></label></div>
        <div className="split"><label>English name<input name="enName" required /></label><label>Arabic name<input name="arName" dir="rtl" required /></label></div>
        <div className="split"><label>English description<textarea name="enDescription" /></label><label>Arabic description<textarea name="arDescription" dir="rtl" /></label></div>
        <label><input type="checkbox" name="enabled" defaultChecked /> Enabled</label><SubmitButton>Create category</SubmitButton>
      </form>
      {rows.length === 0 ? <Empty>No service categories.</Empty> : rows.map((row) => {
        const en=copy(row.translations,'en'), ar=copy(row.translations,'ar');
        return <form action={saveServiceCategory} className="admin-card form-grid" key={row.id}>
          <input type="hidden" name="id" value={row.id} /><div><strong>{en?.name}</strong> · {row._count.services} services</div>
          <div className="split"><label>Slug<input name="slug" defaultValue={row.slug} required /></label><label>Order<input name="sortOrder" type="number" defaultValue={row.sortOrder} /></label></div>
          <div className="split"><label>English name<input name="enName" defaultValue={en?.name ?? ''} required /></label><label>Arabic name<input name="arName" dir="rtl" defaultValue={ar?.name ?? ''} required /></label></div>
          <div className="split"><label>English description<textarea name="enDescription" defaultValue={en?.shortDescription ?? ''} /></label><label>Arabic description<textarea name="arDescription" dir="rtl" defaultValue={ar?.shortDescription ?? ''} /></label></div>
          <label><input type="checkbox" name="enabled" defaultChecked={row.enabled} /> Enabled</label><SubmitButton>Save category</SubmitButton>
        </form>;
      })}
    </div>;
  }

  if (resource === 'services') {
    const [rows,categories,media] = await Promise.all([
      db.service.findMany({
        where: q ? { OR: [{ slug: { contains: q } }, { translations: { some: { name: { contains: q, mode: 'insensitive' } } } }] } : {},
        include: { translations: true, media: { orderBy: { sortOrder:'asc' } }, relatedFrom: true, features: { include: { translations:true }, orderBy:{sortOrder:'asc'} } },
        orderBy: { sortOrder:'asc' }, take:100
      }),
      db.serviceCategory.findMany({ where:{enabled:true}, include:{translations:true}, orderBy:{sortOrder:'asc'} }),
      db.mediaAsset.findMany({orderBy:{createdAt:'desc'},take:250})
    ]);
    return <div className="stack">
      <div><h1>Services</h1><p>Create/edit bilingual services, sub-services, galleries, related services, featured state and publication.</p></div>
      <form method="get" className="admin-card"><label>Search<input name="q" defaultValue={q}/></label><button className="button secondary">Search</button></form>
      <form action={saveService} className="admin-card form-grid">
        <h2>Create service</h2>
        <div className="split"><label>Slug<input name="slug" required /></label><label>Category<select name="categoryId" required>{categories.map((c)=><option key={c.id} value={c.id}>{copy(c.translations,'en')?.name}</option>)}</select></label></div>
        <div className="split"><label>English name<input name="enName" required /></label><label>Arabic name<input name="arName" dir="rtl" required /></label></div>
        <div className="split"><label>English summary<textarea name="enShort" required /></label><label>Arabic summary<textarea name="arShort" dir="rtl" required /></label></div>
        <div className="split"><label>English content<textarea name="enBody" required /></label><label>Arabic content<textarea name="arBody" dir="rtl" required /></label></div>
        <div className="split"><label>Status<select name="status" defaultValue="DRAFT"><option>DRAFT</option><option>PUBLISHED</option><option>ARCHIVED</option></select></label><label>Order<input name="sortOrder" type="number" defaultValue="0" /></label></div>
        <label><input name="featured" type="checkbox" /> Featured</label><SubmitButton>Create service</SubmitButton>
      </form>
      {rows.length===0?<Empty>No services match this search.</Empty>:rows.map((row)=>{
        const en=copy(row.translations,'en'),ar=copy(row.translations,'ar');
        return <details className="admin-card" key={row.id}><summary><strong>{en?.name}</strong> · <span className="badge">{row.status}</span>{row.featured?' · Featured':''}</summary>
          <form action={saveService} className="form-grid" style={{marginTop:'1rem'}}>
            <input type="hidden" name="id" value={row.id}/>
            <div className="split"><label>Slug<input name="slug" defaultValue={row.slug} required /></label><label>Category<select name="categoryId" defaultValue={row.categoryId}>{categories.map((c)=><option key={c.id} value={c.id}>{copy(c.translations,'en')?.name}</option>)}</select></label></div>
            <div className="split"><label>Parent service<select name="parentServiceId" defaultValue={row.parentServiceId ?? ''}><option value="">None</option>{rows.filter((s)=>s.id!==row.id).map((s)=><option key={s.id} value={s.id}>{copy(s.translations,'en')?.name}</option>)}</select></label><label>Order<input name="sortOrder" type="number" defaultValue={row.sortOrder}/></label></div>
            <div className="split"><label>English name<input name="enName" defaultValue={en?.name ?? ''} required /></label><label>Arabic name<input name="arName" dir="rtl" defaultValue={ar?.name ?? ''} required /></label></div>
            <div className="split"><label>English summary<textarea name="enShort" defaultValue={en?.shortDescription ?? ''} required /></label><label>Arabic summary<textarea name="arShort" dir="rtl" defaultValue={ar?.shortDescription ?? ''} required /></label></div>
            <div className="split"><label>English content<textarea rows={7} name="enBody" defaultValue={en?.detailedContent ?? ''} required /></label><label>Arabic content<textarea rows={7} name="arBody" dir="rtl" defaultValue={ar?.detailedContent ?? ''} required /></label></div>
            <div className="split"><label>English CTA label<input name="enCtaLabel" defaultValue={en?.ctaLabel ?? ''}/></label><label>Arabic CTA label<input name="arCtaLabel" dir="rtl" defaultValue={ar?.ctaLabel ?? ''}/></label></div>
            <div className="split"><label>Icon media<select name="iconMediaId" defaultValue={row.iconMediaId ?? ''}><option value="">None</option>{media.map((m)=><option key={m.id} value={m.id}>{m.originalFilename}</option>)}</select></label><label>Cover media<select name="coverMediaId" defaultValue={row.coverMediaId ?? ''}><option value="">None</option>{media.map((m)=><option key={m.id} value={m.id}>{m.originalFilename}</option>)}</select></label></div>
            <label>Gallery media IDs, ordered<input name="galleryMediaIds" defaultValue={row.media.map((m)=>m.mediaId).join(',')} /></label>
            <label>Related service IDs<input name="relatedServiceIds" defaultValue={row.relatedFrom.map((r)=>r.targetServiceId).join(',')} /></label>
            <label>CTA URL<input name="primaryCtaUrl" defaultValue={row.primaryCtaUrl ?? ''}/></label>
            <div className="split"><label>Status<select name="status" defaultValue={row.status}><option>DRAFT</option><option>PUBLISHED</option><option>ARCHIVED</option></select></label><label><input name="featured" type="checkbox" defaultChecked={row.featured}/> Featured</label></div>
            <SubmitButton>Save service</SubmitButton>
          </form>
          <div className="stack" style={{marginTop:'1rem'}}><h3>Features</h3>
            {row.features.map((feature)=><div key={feature.id} className="admin-card"><strong>{copy(feature.translations,'en')?.title}</strong></div>)}
            <form action={saveServiceFeature} className="form-grid"><input type="hidden" name="serviceId" value={row.id}/><div className="split"><label>EN title<input name="enTitle" required/></label><label>AR title<input name="arTitle" dir="rtl" required/></label></div><div className="split"><label>EN description<textarea name="enDescription"/></label><label>AR description<textarea name="arDescription" dir="rtl"/></label></div><label>Order<input name="sortOrder" type="number" defaultValue="0"/></label><label><input name="enabled" type="checkbox" defaultChecked/> Enabled</label><SubmitButton className="button secondary">Add feature</SubmitButton></form>
          </div>
        </details>;
      })}
    </div>;
  }

  if (resource === 'projects') {
    const [rows,categories,services,clients,media]=await Promise.all([
      db.project.findMany({where:q?{OR:[{slug:{contains:q}},{translations:{some:{title:{contains:q,mode:'insensitive'}}}}]}:{},include:{translations:true,media:{orderBy:{sortOrder:'asc'}},services:true},orderBy:{sortOrder:'asc'},take:100}),
      db.projectCategory.findMany({include:{translations:true},orderBy:{sortOrder:'asc'}}),
      db.service.findMany({where:{status:{not:'ARCHIVED'}},include:{translations:true},orderBy:{sortOrder:'asc'}}),
      db.client.findMany({include:{translations:true},orderBy:{sortOrder:'asc'}}),
      db.mediaAsset.findMany({orderBy:{createdAt:'desc'},take:250})
    ]);
    return <div className="stack">
      <div><h1>Projects</h1><p>Project titles/details remain draft until verified; publication requires bilingual core copy and media.</p></div>
      <form method="get" className="admin-card"><label>Search<input name="q" defaultValue={q}/></label><button className="button secondary">Search</button></form>
      <form action={saveProjectCategory} className="admin-card form-grid"><h2>Create project category</h2><div className="split"><label>Slug<input name="slug" required/></label><label>Order<input name="sortOrder" type="number" defaultValue="0"/></label></div><div className="split"><label>EN name<input name="enName" required/></label><label>AR name<input name="arName" dir="rtl" required/></label></div><label><input name="enabled" type="checkbox" defaultChecked/> Enabled</label><SubmitButton>Create category</SubmitButton></form>
      <form action={saveProject} className="admin-card form-grid"><h2>Create project draft</h2><div className="split"><label>Slug<input name="slug" required/></label><label>Category<select name="categoryId"><option value="">None</option>{categories.map((c)=><option key={c.id} value={c.id}>{copy(c.translations,'en')?.name}</option>)}</select></label></div><div className="split"><label>EN title<input name="enTitle" required/></label><label>AR title<input name="arTitle" dir="rtl" required/></label></div><div className="split"><label>EN summary<textarea name="enSummary" required/></label><label>AR summary<textarea name="arSummary" dir="rtl" required/></label></div><input type="hidden" name="status" value="DRAFT"/><input type="hidden" name="sortOrder" value="0"/><SubmitButton>Create draft</SubmitButton></form>
      {rows.length===0?<Empty>No verified project records have been created yet.</Empty>:rows.map((row)=>{
        const en=copy(row.translations,'en'),ar=copy(row.translations,'ar');
        return <details className="admin-card" key={row.id}><summary><strong>{en?.title}</strong> · <span className="badge">{row.status}</span></summary>
          <form action={saveProject} className="form-grid" style={{marginTop:'1rem'}}><input type="hidden" name="id" value={row.id}/>
            <div className="split"><label>Slug<input name="slug" defaultValue={row.slug} required/></label><label>Category<select name="categoryId" defaultValue={row.categoryId ?? ''}><option value="">None</option>{categories.map((c)=><option key={c.id} value={c.id}>{copy(c.translations,'en')?.name}</option>)}</select></label></div>
            <div className="split"><label>Client<select name="clientId" defaultValue={row.clientId ?? ''}><option value="">None</option>{clients.map((c)=><option key={c.id} value={c.id}>{copy(c.translations,'en')?.name}</option>)}</select></label><label>Year<input name="year" type="number" defaultValue={row.year ?? ''}/></label></div>
            <label>Location<input name="location" defaultValue={row.location ?? ''}/></label>
            <div className="split"><label>EN title<input name="enTitle" defaultValue={en?.title ?? ''} required/></label><label>AR title<input name="arTitle" dir="rtl" defaultValue={ar?.title ?? ''} required/></label></div>
            <div className="split"><label>EN summary<textarea name="enSummary" defaultValue={en?.summary ?? ''} required/></label><label>AR summary<textarea name="arSummary" dir="rtl" defaultValue={ar?.summary ?? ''} required/></label></div>
            <div className="split"><label>EN detail<textarea rows={6} name="enBody" defaultValue={en?.detailedDescription ?? ''}/></label><label>AR detail<textarea rows={6} name="arBody" dir="rtl" defaultValue={ar?.detailedDescription ?? ''}/></label></div>
            <div className="split"><label>Cover media<select name="coverMediaId" defaultValue={row.coverMediaId ?? ''}><option value="">None</option>{media.map((m)=><option key={m.id} value={m.id}>{m.originalFilename}</option>)}</select></label><label>Video media<select name="videoMediaId" defaultValue={row.videoMediaId ?? ''}><option value="">None</option>{media.map((m)=><option key={m.id} value={m.id}>{m.originalFilename}</option>)}</select></label></div>
            <label>Gallery media IDs<input name="galleryMediaIds" defaultValue={row.media.map((m)=>m.mediaId).join(',')}/></label>
            <label>Related service IDs<input name="serviceIds" defaultValue={row.services.map((s)=>s.serviceId).join(',')}/></label>
            <div className="split"><label>Status<select name="status" defaultValue={row.status}><option>DRAFT</option><option>PUBLISHED</option><option>ARCHIVED</option></select></label><label>Order<input name="sortOrder" type="number" defaultValue={row.sortOrder}/></label></div><label><input name="featured" type="checkbox" defaultChecked={row.featured}/> Featured</label>
            <SubmitButton>Save project</SubmitButton>
          </form>
        </details>;
      })}
    </div>;
  }

  if (resource === 'clients') {
    const [rows,media]=await Promise.all([db.client.findMany({include:{translations:true},orderBy:{sortOrder:'asc'}}),db.mediaAsset.findMany({orderBy:{createdAt:'desc'},take:250})]);
    return <div className="stack"><div><h1>Clients</h1><p>Public rendering requires both identity confirmation and public-display approval.</p></div>
      <form action={saveClient} className="admin-card form-grid"><h2>Create client record</h2><div className="split"><label>EN name<input name="enName" required/></label><label>AR name<input name="arName" dir="rtl" required/></label></div><div className="split"><label>EN logo alt<input name="enAlt" required/></label><label>AR logo alt<input name="arAlt" dir="rtl" required/></label></div><label>Logo<select name="logoId"><option value="">None</option>{media.map((m)=><option key={m.id} value={m.id}>{m.originalFilename}</option>)}</select></label><input type="hidden" name="sortOrder" value="0"/><SubmitButton>Create gated record</SubmitButton></form>
      {rows.length===0?<Empty>No client identities have been approved or entered.</Empty>:rows.map((row)=>{const en=copy(row.translations,'en'),ar=copy(row.translations,'ar');return <form action={saveClient} className="admin-card form-grid" key={row.id}><input type="hidden" name="id" value={row.id}/><div><strong>{en?.name}</strong> · <span className="badge">{row.enabled?'Public candidate':'Hidden'}</span></div><div className="split"><label>EN name<input name="enName" defaultValue={en?.name ?? ''} required/></label><label>AR name<input name="arName" dir="rtl" defaultValue={ar?.name ?? ''} required/></label></div><div className="split"><label>EN alt<input name="enAlt" defaultValue={en?.altText ?? ''} required/></label><label>AR alt<input name="arAlt" dir="rtl" defaultValue={ar?.altText ?? ''} required/></label></div><label>Logo<select name="logoId" defaultValue={row.logoId ?? ''}><option value="">None</option>{media.map((m)=><option key={m.id} value={m.id}>{m.originalFilename}</option>)}</select></label><label>External URL<input name="externalUrl" defaultValue={row.externalUrl ?? ''}/></label><label>Order<input name="sortOrder" type="number" defaultValue={row.sortOrder}/></label><div className="split"><label><input name="identityConfirmed" type="checkbox" defaultChecked={row.identityConfirmed}/> Identity confirmed</label><label><input name="publicDisplayApproved" type="checkbox" defaultChecked={row.publicDisplayApproved}/> Public display approved</label></div><div className="split"><label><input name="enabled" type="checkbox" defaultChecked={row.enabled}/> Enabled</label><label><input name="featured" type="checkbox" defaultChecked={row.featured}/> Featured</label></div><SubmitButton>Save client</SubmitButton></form>;})}
    </div>;
  }

  if (resource === 'metrics') {
    const rows=await db.metric.findMany({include:{translations:true},orderBy:{sortOrder:'asc'}});
    return <div className="stack"><div><h1>Metrics</h1><p>Source claims remain disabled until currentness is explicitly reconfirmed.</p></div>
      {rows.length===0?<Empty>No metrics.</Empty>:rows.map((row)=>{const en=copy(row.translations,'en'),ar=copy(row.translations,'ar');return <form action={saveMetric} className="admin-card form-grid" key={row.id}><input type="hidden" name="id" value={row.id}/><div><strong>{row.displayValue}</strong> · <span className="badge">{row.enabled?'Enabled':'Unpublished'}</span></div><div className="split"><label>Display value<input name="displayValue" defaultValue={row.displayValue} required/></label><label>Suffix<input name="suffix" defaultValue={row.suffix ?? ''}/></label></div><div className="split"><label>EN label<input name="enLabel" defaultValue={en?.label ?? ''} required/></label><label>AR label<input name="arLabel" dir="rtl" defaultValue={ar?.label ?? ''} required/></label></div><label>Source note<textarea name="sourceNote" defaultValue={row.sourceNote} required/></label><label>Order<input name="sortOrder" type="number" defaultValue={row.sortOrder}/></label><div className="split"><label><input name="confirmed" type="checkbox" defaultChecked={Boolean(row.lastConfirmedAt)}/> Currentness confirmed</label><label><input name="enabled" type="checkbox" defaultChecked={row.enabled}/> Enable publicly</label></div><SubmitButton>Save metric</SubmitButton></form>;})}
    </div>;
  }

  if (resource === 'work-cycle') {
    const rows=await db.processStep.findMany({include:{translations:true},orderBy:{sortOrder:'asc'}});
    return <div className="stack"><div><h1>Work cycle</h1><p>The approved five steps are separately authored in English and Arabic.</p></div>
      {rows.map((row)=>{const en=copy(row.translations,'en'),ar=copy(row.translations,'ar');return <form action={saveProcessStep} className="admin-card form-grid" key={row.id}><input type="hidden" name="id" value={row.id}/><div className="split"><label>Key<input name="key" defaultValue={row.key} required/></label><label>Number<input name="number" defaultValue={row.number} required/></label></div><div className="split"><label>EN title<input name="enTitle" defaultValue={en?.title ?? ''} required/></label><label>AR title<input name="arTitle" dir="rtl" defaultValue={ar?.title ?? ''} required/></label></div><div className="split"><label>EN description<textarea name="enDescription" defaultValue={en?.description ?? ''} required/></label><label>AR description<textarea name="arDescription" dir="rtl" defaultValue={ar?.description ?? ''} required/></label></div><label>Order<input name="sortOrder" type="number" defaultValue={row.sortOrder}/></label><label><input name="enabled" type="checkbox" defaultChecked={row.enabled}/> Enabled</label><SubmitButton>Save step</SubmitButton></form>;})}
    </div>;
  }

  if (resource === 'leadership') {
    const rows=await db.leadershipMember.findMany({include:{translations:true},orderBy:{sortOrder:'asc'}});
    return <div className="stack"><div><h1>Leadership</h1><p>Executive message, title, image and publication state. No biography is inferred.</p></div>
      {rows.map((row)=>{const en=copy(row.translations,'en'),ar=copy(row.translations,'ar');return <form action={saveLeadership} className="admin-card form-grid" key={row.id}><input type="hidden" name="id" value={row.id}/><div className="split"><label>EN name<input name="enName" defaultValue={en?.name ?? ''} required/></label><label>AR name<input name="arName" dir="rtl" defaultValue={ar?.name ?? ''} required/></label></div><div className="split"><label>EN title<input name="enTitle" defaultValue={en?.title ?? ''} required/></label><label>AR title<input name="arTitle" dir="rtl" defaultValue={ar?.title ?? ''} required/></label></div><div className="split"><label>EN executive message<textarea rows={8} name="enMessage" defaultValue={en?.biographyOrMessage ?? ''} required/></label><label>AR executive message<textarea rows={8} name="arMessage" dir="rtl" defaultValue={ar?.biographyOrMessage ?? ''} required/></label></div><label>Image media ID<input name="imageId" defaultValue={row.imageId ?? ''}/></label><div className="split"><label>Status<select name="status" defaultValue={row.status}><option>DRAFT</option><option>PUBLISHED</option><option>ARCHIVED</option></select></label><label>Order<input name="sortOrder" type="number" defaultValue={row.sortOrder}/></label></div><SubmitButton>Save leadership record</SubmitButton></form>;})}
    </div>;
  }

  if (resource === 'capabilities') {
    const [packages,features]=await Promise.all([
      db.capabilityPackage.findMany({include:{translations:true},orderBy:{sortOrder:'asc'}}),
      db.capabilityFeature.findMany({include:{translations:true,values:{include:{translations:true}}},orderBy:{sortOrder:'asc'}})
    ]);
    return <div className="stack"><div><h1>Capabilities</h1><p>Manage package labels, features and TEXT/BOOLEAN/NONE values. Owner-label gates block unresolved public labels.</p></div>
      <form action={saveCapabilityPackage} className="admin-card form-grid"><h2>Create package</h2><div className="split"><label>Key<input name="key" required/></label><label>Order<input name="sortOrder" type="number" defaultValue="0"/></label></div><div className="split"><label>EN name<input name="enName" required/></label><label>AR name<input name="arName" dir="rtl" required/></label></div><label><input name="needsOwnerLabel" type="checkbox"/> Needs owner label</label><label><input name="enabled" type="checkbox"/> Enabled</label><SubmitButton>Create package</SubmitButton></form>
      {packages.map((pkg)=>{const en=copy(pkg.translations,'en'),ar=copy(pkg.translations,'ar');return <form action={saveCapabilityPackage} className="admin-card form-grid" key={pkg.id}><input type="hidden" name="id" value={pkg.id}/><div><strong>{en?.name}</strong> · <span className="badge">{pkg.enabled?'Enabled':'Hidden'}</span>{pkg.needsOwnerLabel?' · owner confirmation required':''}</div><div className="split"><label>Key<input name="key" defaultValue={pkg.key} required/></label><label>Order<input name="sortOrder" type="number" defaultValue={pkg.sortOrder}/></label></div><div className="split"><label>EN name<input name="enName" defaultValue={en?.name ?? ''} required/></label><label>AR name<input name="arName" dir="rtl" defaultValue={ar?.name ?? ''} required/></label></div><label><input name="needsOwnerLabel" type="checkbox" defaultChecked={pkg.needsOwnerLabel}/> Needs owner label</label><label><input name="enabled" type="checkbox" defaultChecked={pkg.enabled}/> Enabled</label><SubmitButton>Save package</SubmitButton></form>;})}
      <form action={saveCapabilityFeature} className="admin-card form-grid"><h2>Create feature</h2><div className="split"><label>Key<input name="key" required/></label><label>Order<input name="sortOrder" type="number" defaultValue="0"/></label></div><div className="split"><label>EN name<input name="enName" required/></label><label>AR name<input name="arName" dir="rtl" required/></label></div><label><input name="enabled" type="checkbox" defaultChecked/> Enabled</label><SubmitButton>Create feature</SubmitButton></form>
      {features.map((feature)=>{const en=copy(feature.translations,'en'),ar=copy(feature.translations,'ar');return <div className="admin-card stack" key={feature.id}><form action={saveCapabilityFeature} className="form-grid"><input type="hidden" name="id" value={feature.id}/><div className="split"><label>Key<input name="key" defaultValue={feature.key} required/></label><label>Order<input name="sortOrder" type="number" defaultValue={feature.sortOrder}/></label></div><div className="split"><label>EN name<input name="enName" defaultValue={en?.name ?? ''} required/></label><label>AR name<input name="arName" dir="rtl" defaultValue={ar?.name ?? ''} required/></label></div><label><input name="enabled" type="checkbox" defaultChecked={feature.enabled}/> Enabled</label><SubmitButton>Save feature</SubmitButton></form><h3>Package values</h3>{packages.map((pkg)=>{const value=feature.values.find((v)=>v.capabilityPackageId===pkg.id);const ve=value?copy(value.translations,'en'):null,va=value?copy(value.translations,'ar'):null;return <form action={saveCapabilityValue} className="form-grid" key={pkg.id}><input type="hidden" name="packageId" value={pkg.id}/><input type="hidden" name="featureId" value={feature.id}/><strong>{copy(pkg.translations,'en')?.name}</strong><label>Type<select name="valueKind" defaultValue={value?.valueKind ?? 'TEXT'}><option>TEXT</option><option>BOOLEAN</option><option>NONE</option></select></label><div className="split"><label>EN text<input name="enContent" defaultValue={ve?.content ?? ''}/></label><label>AR text<input name="arContent" dir="rtl" defaultValue={va?.content ?? ''}/></label></div><label><input name="booleanValue" type="checkbox" defaultChecked={value?.booleanValue ?? false}/> Boolean value</label><label><input name="enabled" type="checkbox" defaultChecked={value?.enabled ?? false}/> Enabled</label><SubmitButton className="button secondary">Save value</SubmitButton></form>;})}</div>;})}
    </div>;
  }

  if (resource === 'inquiries') {
    const status = query.status && ['NEW','READ','IN_PROGRESS','CLOSED','SPAM'].includes(query.status) ? query.status : undefined;
    const rows=await db.contactSubmission.findMany({where:{...(status?{status:status as 'NEW'|'READ'|'IN_PROGRESS'|'CLOSED'|'SPAM'}:{}),...(q?{OR:[{name:{contains:q,mode:'insensitive'}},{email:{contains:q,mode:'insensitive'}},{organization:{contains:q,mode:'insensitive'}}]}:{})},orderBy:{createdAt:'desc'},take:100});
    return <div className="stack"><div><h1>Inquiries</h1><p>Submissions are persisted before notification attempts. This view contains user-provided information.</p></div><form method="get" className="admin-card split"><label>Search<input name="q" defaultValue={q}/></label><label>Status<select name="status" defaultValue={status ?? ''}><option value="">All</option>{['NEW','READ','IN_PROGRESS','CLOSED','SPAM'].map((s)=><option key={s}>{s}</option>)}</select></label><button className="button secondary">Filter</button></form>
      {rows.length===0?<Empty>No inquiries match this filter.</Empty>:rows.map((row)=><article className="admin-card stack" key={row.id}><div><strong>{row.name}</strong> · {row.email} · <span className="badge">{row.status}</span></div><p>{row.organization}</p><p>{row.message}</p><small>{row.createdAt.toISOString()} · locale {row.locale} · notification {row.notificationStatus}</small><form action={updateInquiryStatus} className="split"><input type="hidden" name="id" value={row.id}/><select name="status" defaultValue={row.status}>{['NEW','READ','IN_PROGRESS','CLOSED','SPAM'].map((s)=><option key={s}>{s}</option>)}</select><SubmitButton className="button secondary">Update status</SubmitButton></form></article>)}
    </div>;
  }

  if (resource === 'seo') {
    const [pages,services,projects,media,rows]=await Promise.all([db.page.findMany({orderBy:{slug:'asc'}}),db.service.findMany({orderBy:{slug:'asc'}}),db.project.findMany({orderBy:{slug:'asc'}}),db.mediaAsset.findMany({orderBy:{createdAt:'desc'},take:100}),db.seoMetadata.findMany({orderBy:[{ownerType:'asc'},{ownerId:'asc'},{locale:'asc'}]})]);
    const ownerGroups = [
      { type: 'Page', items: pages.map((item)=>({id:item.id,slug:item.slug})) },
      { type: 'Service', items: services.map((item)=>({id:item.id,slug:item.slug})) },
      { type: 'Project', items: projects.map((item)=>({id:item.id,slug:item.slug})) }
    ] as const;
    return <div className="stack"><div><h1>SEO</h1><p>Localized metadata, canonical overrides, robots directives and OG images.</p></div>
      <div className="split">{ownerGroups.map((group)=><form action={saveSeo} className="admin-card form-grid" key={group.type}><h2>Create / add {group.type} SEO</h2><input type="hidden" name="ownerType" value={group.type}/><label>Record<select name="ownerId" required><option value="">Select…</option>{group.items.map((item)=><option key={item.id} value={item.id}>{item.slug}</option>)}</select></label><label>Locale<select name="locale"><option value="en">English</option><option value="ar">Arabic</option></select></label><label>Title<input name="title" required/></label><label>Description<textarea name="description" required/></label><label>Robots<input name="robots" defaultValue="index,follow" required/></label><label>Canonical override<input name="canonicalOverride"/></label><SubmitButton>Save SEO</SubmitButton></form>)}</div>
      {rows.map((row)=>{const ownerLabel=row.ownerType==='Page'?pages.find((x)=>x.id===row.ownerId)?.slug:row.ownerType==='Service'?services.find((x)=>x.id===row.ownerId)?.slug:projects.find((x)=>x.id===row.ownerId)?.slug;return <form action={saveSeo} className="admin-card form-grid" key={row.id}><input type="hidden" name="ownerType" value={row.ownerType}/><input type="hidden" name="ownerId" value={row.ownerId}/><input type="hidden" name="locale" value={row.locale}/><div><strong>{row.ownerType}: {ownerLabel ?? row.ownerId}</strong> · {row.locale.toUpperCase()}</div><label>Title<input name="title" defaultValue={row.title} required/></label><label>Description<textarea name="description" defaultValue={row.description} required/></label><div className="split"><label>Canonical override<input name="canonicalOverride" defaultValue={row.canonicalOverride ?? ''}/></label><label>Robots<input name="robots" defaultValue={row.robots} required/></label></div><div className="split"><label>OG title<input name="ogTitle" defaultValue={row.ogTitle ?? ''}/></label><label>OG image<select name="ogImageId" defaultValue={row.ogImageId ?? ''}><option value="">Default/none</option>{media.map((m)=><option key={m.id} value={m.id}>{m.originalFilename}</option>)}</select></label></div><label>OG description<textarea name="ogDescription" defaultValue={row.ogDescription ?? ''}/></label><SubmitButton>Save SEO</SubmitButton></form>;})}
    </div>;
  }

  notFound();
}
