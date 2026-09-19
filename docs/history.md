# Implementation history

## 2026-09-19 — Phase 1 foundation

- Created the implementation branch from the then-current main.
- Established the Next.js App Router + TypeScript application, styling primitives, environment validation, structured logging, CI, lint/type/test/build scripts and production-safe baseline headers.
- Implemented the PostgreSQL/Prisma relational content model and initial migration.
- Implemented localized page/content tables, strict versioned section contracts, Arabic/English route primitives and deterministic Arabic-default root routing.
- Implemented maintained-library authentication with OWNER/ADMIN server authorization, disabled-account enforcement and an owner bootstrap script.
- Implemented the protected CMS shell and core management surfaces for settings, pages, sections, navigation, media, contact people, redirects and users.
- Implemented authenticated noindex draft preview, page publication gates, media upload validation/storage abstraction and protected media deletion.
- Kept owner-confirmation-only information unpublished/configurable instead of inventing it.


## 2026-09-19 — Phase 1 independent-audit remediation

- Completed Navigation CMS create/edit/enable-disable/OWNER-delete, EN/AR labels, safe internal/custom destinations, ordering and nested parent relationships.
- Completed Page Sections CMS editing for EN/AR copy, bounded versioned settings, ordering, visibility, media attachments, galleries and CTA destinations/labels.
- Tightened page publication gates to validate actual required localized section fields and localized SEO rather than translation-row existence alone.
- Added transactional MediaUsage synchronization for section attachments and published-reference state changes; media deletion now checks tracked and canonical references and removes valid stored objects.
- Added canonical Prisma relationships and database foreign keys for media/logo/image/CTA references plus restrictive delete behavior.
- Added server-revocable authentication sessions, safe callback handling, OWNER account disable/re-enable/reset/delete controls and self-service password changes that revoke sessions.
- Added localized canonical/hreflang/x-default metadata infrastructure while retaining deterministic Arabic-default routing and true RTL.
- Made CMS redirects effective in the Next.js request proxy.
- Upgraded the App Router foundation from unsupported Next.js 14 to supported Next.js 16 Active LTS and migrated async request APIs/proxy/ESLint configuration.
- Committed the npm lockfile and changed CI to a clean npm-ci + fresh migration/seed + lint/typecheck/test/build pipeline.
- Added focused Phase 1 remediation tests for authorization boundaries, authentication URL/session safety, publication completeness, media protection, navigation validation and localization/SEO primitives.


## 2026-09-19 — Phase 2 public website and business CMS

- Replaced the public foundation placeholder with CMS-driven bilingual English/Arabic routes for Home, About, Services, Projects, Capabilities, Clients and Contact, plus service/project detail routes, breadcrumbs, equivalent-page language switching, responsive navigation/footer, localized metadata and localized 404 behavior.
- Added the premium public presentation layer using the profile-derived purple/gold/turquoise visual direction, event-production geometry, responsive cards, process presentation, project galleries, capability comparison and true RTL layouts.
- Added canonical service hierarchy, service gallery and related-service relationships with a real Prisma migration.
- Populated source-supported company copy, service categories/services, exact five-stage work cycle, executive message, profile contact people and verified capability values in separately authored English/Arabic CMS records.
- Kept project records empty until names/details are verified, kept client identities gated behind identity/public-display approval, kept source metrics disabled pending currentness confirmation, and kept the unresolved English premium-tier package disabled behind the owner-label gate.
- Completed Phase 2 CMS surfaces for Homepage/About, Pages/Sections, Services/categories/features/sub-services/galleries/related services, Projects/categories/galleries/related services, Clients, Capabilities, Metrics, Work Cycle, Leadership, Contact People/info, Inquiries, Navigation/Footer, Branding/logos/favicon, Media, Buttons/CTAs, SEO, Redirects and global settings.
- Added authenticated draft previews for Pages, Services and Projects.
- Implemented persisted contact inquiries with client/server validation, sanitization, honeypot, rate limiting, optional Turnstile, optional Resend notification after persistence, inquiry status management and configurable factual form notices.
- Added source-gate and inquiry-persistence regression tests for Phase 2.


## 2026-09-19 — Phase 2 completion fixes: preview and source assets

- Fixed the authenticated preview route to bind the validated locale from resolved route parameters; EN and AR previews now use the same validated route-locale path.
- Extracted the actual Solutions Gate logo and approved source imagery from the supplied company-profile PDFs rather than using full-page screenshots.
- Added optimized source derivatives for event imagery, promotional gifts, uniforms, signage, print/digital media, immersive technology, theater examples and the executive portrait.
- Registered every imported source image as a bilingual `MediaAsset` with source-page provenance and wired it through Site Settings, Page Sections, Services, Service galleries, Leadership and `MediaUsage`.
- Removed the public footer's temporary SG mark when the CMS source logo is available, and added source covers to public service cards.
- Added `docs/source-assets.md` as the extraction/provenance/publication-gate register.
- Kept profile project collages and the strategic-client logo grid out of public CMS seed data because their identities/details remain subject to the approved V2 confirmation gates.
