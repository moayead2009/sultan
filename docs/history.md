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
