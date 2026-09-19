# Solutions Gate architecture

## Application shape

Solutions Gate is a single Next.js App Router application. Public English/Arabic routes live under `app/[locale]`; the private CMS is under `app/(dashboard)/admin`; authentication is under `app/(auth)` and `/api/auth`; public inquiry handling is `/api/contact`; `/api/health` is a process liveness probe and `/api/ready` verifies database-backed readiness without exposing dependency details.

The application is intentionally provider-neutral around PostgreSQL and S3-compatible object storage. Production infrastructure, DNS, TLS termination, object-storage vendor, email credentials and monitoring vendor are deployment inputs, not source-controlled assumptions.

## Data and migrations

`prisma/schema.prisma` is the source of truth for the relational model. Core domains include users/auth sessions/audit logs, site settings/navigation/pages/sections/SEO/redirects, services and service relations, projects and galleries, clients, process steps, metrics, capabilities, leadership/contact people, media/media usage and contact submissions.

Schema changes are committed as ordered Prisma migrations under `prisma/migrations`. Production applies migrations with `prisma migrate deploy`; destructive down-migration is not part of the application workflow. A database backup is required before a production migration window so rollback can be handled deliberately if application/schema compatibility is lost.

## Authentication and permissions

NextAuth credentials authentication uses Argon2 password hashes. There is no public registration. Roles are OWNER and ADMIN. Sensitive server actions enforce authorization on the server, and mutation endpoints enforce trusted same-origin behavior. Auth sessions are represented server-side and can be revoked when accounts are disabled, passwords change or logout occurs.

The first OWNER is provisioned only through the bootstrap script with one-time environment inputs. OWNER account-management functions remain restricted to OWNER users.

## Localization and RTL

English (`en`) and Arabic (`ar`) are first-class locales. Public content and SEO metadata use explicit translation records; the application does not invent missing translation copy. Arabic renders with true RTL document behavior. The locale switch resolves the equivalent route rather than simply changing labels.

## CMS publication model

CMS records can be drafted and previewed privately. Public rendering only includes records that meet their publication state and validation gates. Page sections use versioned schemas. Source-derived metrics, clients, projects and unresolved labels retain dedicated confirmation gates so ambiguous company-profile material cannot become public fact by accident.

## Media and storage

Media metadata lives in PostgreSQL while file bytes live behind the storage adapter. Development may use `public/uploads`; production requires S3-compatible storage. Upload processing validates image signatures, re-encodes approved formats and strips source metadata. Referential usage tracking and relational foreign keys prevent unsafe deletion of media still in use.

A complete disaster-recovery set therefore consists of both a database backup and the corresponding object-storage contents/version history.

## Inquiries and email

Contact submissions are validated, sanitized, rate limited and optionally Turnstile-protected. The database insert occurs before any external notification. Resend notification is optional and failure does not discard the stored inquiry. Inquiry recipient and retention behavior are CMS settings; production provider credentials stay outside the repository.

## SEO and redirects

Localized canonical/hreflang/x-default metadata, sitemap, robots rules and structured data are generated only from approved public content. Admin and preview routes are noindex. CMS redirect records are validated and executed at the request boundary while protected surfaces are excluded.

## Security and observability

The application sets CSP, HSTS in production, clickjacking/content-type/referrer/permissions headers, validates external URL schemes and uses structured JSON logging. Sensitive and common PII-named metadata fields are recursively redacted. Runtime errors shown publicly are localized and do not disclose internals. External error collection may be attached through deployment configuration, but no monitoring credential is committed.

See `docs/operations.md` for environment validation, deployment ordering, backups, restore tests, monitoring and rollback.
