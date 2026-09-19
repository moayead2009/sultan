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
